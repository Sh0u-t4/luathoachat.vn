/**
 * ocr-gemini-vision.mjs  v3
 * OCR file PDF scan bằng Gemini 2.5 Flash, chia theo chunk 15 trang/lần.
 *
 * Benchmark: ~40s/10 trang → 88 trang ≈ 6 phút
 *
 * Chạy: node scripts/ocr-gemini-vision.mjs nd24
 *        node scripts/ocr-gemini-vision.mjs 69qh
 *        node scripts/ocr-gemini-vision.mjs        (cả hai)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Env loader ───────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  for (const f of ['.env', '.env.local']) {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) continue;
    for (const line of fs.readFileSync(fp, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k) env[k] = v;
    }
  }
  return env;
}

const env = loadEnv();
const GEMINI_KEY = env['GEMINI_API_KEY'];
const MODEL = 'gemini-2.5-flash';
// Timeout per OCR chunk: 10 trang × 45s/10trang + 60s buffer = ~120s
const OCR_TIMEOUT_MS = 300_000; // 5 phút per chunk (conservative)

if (!GEMINI_KEY) {
  console.error('❌ GEMINI_API_KEY không có trong .env');
  process.exit(1);
}

const PDF_DIR = path.join(ROOT, 'data', 'legal-documents');
const OUT_DIR  = path.join(ROOT, 'data', 'legal-documents', 'extracted-text');

const TARGET_FILES = {
  'nd24': {
    file: 'nghi-dinh-24-2026ndcp.pdf',
    outFile: 'nghi_dinh_24_2026.txt',
    title: 'Nghị định 24/2026/NĐ-CP',
    totalPages: 88,
    chunkPages: 12,   // OCR mỗi lần N trang
  },
  '69qh': {
    file: '69qh.signed.pdf',
    outFile: '69qh_luat_hoa_chat.txt',
    title: 'Luật Hóa chất 69/2025/QH15',
    totalPages: 29,
    chunkPages: 15,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function bar(done, total, width = 25) {
  const p = Math.round((done / total) * width);
  return '[' + '█'.repeat(p) + '░'.repeat(width - p) + ']';
}

// fetch với timeout
async function fetchWithTimeout(url, opts, timeoutMs = 30_000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(tid);
    return r;
  } catch(e) {
    clearTimeout(tid);
    if (e.name === 'AbortError') throw new Error(`Timeout after ${timeoutMs/1000}s`);
    throw e;
  }
}

async function retry(fn, retries = 2, delayMs = 10_000, label = '') {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch(e) {
      if (i === retries) throw e;
      console.log(`\n    ⟳ Retry ${i+1}/${retries} [${label}]: ${e.message}`);
      await sleep(delayMs);
    }
  }
}

// ── Upload PDF → Gemini File API ─────────────────────────────────────────────
async function uploadPDF(filePath) {
  const buf = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  process.stdout.write(`  📤 Upload ${name} (${(buf.length/1048576).toFixed(1)} MB)... `);

  const initRes = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': buf.length.toString(),
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: name } }),
    },
    30_000
  );

  if (!initRes.ok) throw new Error(`Upload init ${initRes.status}: ${await initRes.text()}`);
  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('No upload URL returned');

  const upRes = await fetchWithTimeout(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': buf.length.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: buf,
  }, 120_000);

  if (!upRes.ok) throw new Error(`Upload bytes ${upRes.status}: ${await upRes.text()}`);
  const data = await upRes.json();
  const uri = data?.file?.uri;
  if (!uri) throw new Error('No file URI in response');
  console.log(`✅ ${uri.split('/').pop()}`);
  return uri;
}

// ── Wait for File ACTIVE ──────────────────────────────────────────────────────
async function waitActive(fileUri) {
  const id = fileUri.split('/').pop();
  process.stdout.write('  ⏳ File processing');
  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    const r = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/files/${id}?key=${GEMINI_KEY}`,
      {}, 10_000
    );
    if (!r.ok) { process.stdout.write('.'); continue; }
    const d = await r.json();
    if (d.state === 'ACTIVE') { console.log(' ✅ ACTIVE'); return; }
    if (d.state === 'FAILED') throw new Error('File processing FAILED');
    process.stdout.write('.');
  }
  throw new Error('Timeout: file not ACTIVE after 90s');
}

// ── OCR một chunk trang ───────────────────────────────────────────────────────
async function ocrChunk(fileUri, startPage, endPage, totalPages, title) {
  const isAppendix = startPage >= 5; // Từ trang 5 trở đi thường là phụ lục bảng

  const appendixHint = isAppendix
    ? `\nLƯU Ý ĐẶC BIỆT: Các trang này có thể chứa bảng danh mục hóa chất với các cột: STT | Tên hóa chất | Công thức | Mã CAS | Mã HS. PHẢI ghi đầy đủ TẤT CẢ các hàng, không được bỏ sót bất kỳ chất nào.`
    : '';

  const prompt = `OCR văn bản pháp lý tiếng Việt — "${title}" — TRANG ${startPage} đến ${endPage}/${totalPages}.${appendixHint}

QUY TẮC:
1. Chỉ trích xuất nội dung từ trang ${startPage} đến trang ${endPage}. Bỏ qua các trang khác.
2. Giữ nguyên cấu trúc: Chương, Điều, Khoản, Điểm
3. Với bảng: ghi đủ từng hàng theo format hàng ngang, phân cách bởi | 
4. KHÔNG tóm tắt, KHÔNG bỏ sót, KHÔNG thêm chú thích của bạn
5. Bắt đầu bằng "=== TRANG ${startPage}-${endPage} ===" và kết thúc bằng "=== HẾT TRANG ${endPage} ==="

Trích xuất:`;

  const r = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
          { text: prompt },
        ]}],
        generationConfig: {
          temperature: 0.05,
          maxOutputTokens: 16384,
        },
      }),
    },
    OCR_TIMEOUT_MS
  );

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Gemini ${r.status}: ${err.slice(0, 200)}`);
  }

  const d = await r.json();
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const reason = d?.candidates?.[0]?.finishReason ?? '?';
  return { text, reason };
}

// ── Main OCR logic ────────────────────────────────────────────────────────────
async function processFile(key, config) {
  const { file, outFile, title, totalPages, chunkPages } = config;
  const filePath = path.join(PDF_DIR, file);
  const outPath  = path.join(OUT_DIR, outFile);

  console.log(`\n${'═'.repeat(64)}`);
  console.log(`📄 ${title}`);
  console.log(`   ${file} — ${totalPages} trang — chunk mỗi ${chunkPages} trang`);
  console.log(`${'═'.repeat(64)}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File không tồn tại: ${filePath}`);
    return false;
  }

  // Upload
  const fileUri = await retry(() => uploadPDF(filePath), 2, 10_000, 'upload');

  // Wait ACTIVE
  await waitActive(fileUri);

  // Chia trang thành chunks
  const chunks = [];
  for (let p = 1; p <= totalPages; p += chunkPages) {
    chunks.push({ start: p, end: Math.min(p + chunkPages - 1, totalPages) });
  }

  console.log(`\n  🔍 OCR ${chunks.length} chunks...`);

  const allParts = [];
  const t0 = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    const { start, end } = chunks[i];
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const eta = i > 0
      ? Math.round((Date.now() - t0) / i / 1000 * (chunks.length - i))
      : '?';

    process.stdout.write(
      `\r  ${bar(i, chunks.length)} Chunk ${i+1}/${chunks.length}: trang ${start}-${end} | ${elapsed}s | eta ${eta}s`
    );

    try {
      const { text, reason } = await retry(
        () => ocrChunk(fileUri, start, end, totalPages, title),
        2, 12_000, `pages ${start}-${end}`
      );

      if (text.trim().length < 20) {
        console.log(`\n    ⚠️  Chunk ${i+1} rỗng (reason: ${reason}) — bỏ qua`);
      } else {
        allParts.push(text);
        if (reason === 'MAX_TOKENS') {
          console.log(`\n    ⚠️  Chunk ${i+1} bị cắt (MAX_TOKENS) — nội dung có thể thiếu`);
        }
      }
    } catch(e) {
      console.log(`\n    ❌ Chunk ${i+1} thất bại: ${e.message}`);
      allParts.push(`\n[!!! OCR THẤT BẠI cho trang ${start}-${end}: ${e.message} !!!]\n`);
    }

    // Delay giữa các chunk để tránh rate limit
    if (i < chunks.length - 1) await sleep(2000);
  }

  console.log(''); // newline
  const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);

  if (allParts.length === 0) {
    console.error('  ❌ Không có nội dung nào được trích xuất!');
    return false;
  }

  // Ghép và lưu
  const fullText = allParts.join('\n\n');
  const header = [
    `# ${title}`,
    `# OCR bởi: Gemini ${MODEL} — chunk ${chunkPages} trang/lần`,
    `# Ngày: ${new Date().toISOString()}`,
    `# Tổng trang: ${totalPages} | Chunks: ${chunks.length} | Thời gian: ${totalSecs}s`,
    `# File gốc: ${file}`,
    '',
    '',
  ].join('\n');

  fs.writeFileSync(outPath, header + fullText, 'utf-8');

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n  ✅ Lưu: ${outPath}`);
  console.log(`  📊 ${sizeKB} KB | ${fullText.length.toLocaleString()} ký tự | ${totalSecs}s`);
  console.log(`  📦 ${allParts.length}/${chunks.length} chunks thành công`);

  if (fullText.length < 10_000) {
    console.warn(`  ⚠️  CẢNH BÁO: Nội dung có vẻ ngắn bất thường!`);
  }

  return true;
}

// ── Entry ─────────────────────────────────────────────────────────────────────
const arg = process.argv[2]?.toLowerCase();
const entries = arg
  ? (TARGET_FILES[arg] ? [[arg, TARGET_FILES[arg]]] : null)
  : Object.entries(TARGET_FILES);

if (!entries) {
  console.error(`❌ Key không hợp lệ: "${arg}". Dùng: nd24 | 69qh`);
  process.exit(1);
}

console.log(`\n🚀 OCR VỚI ${MODEL.toUpperCase()} — ${entries.length} file(s)`);

let ok = 0;
for (const [k, c] of entries) {
  if (await processFile(k, c)) ok++;
  if (entries.length > 1) await sleep(10_000);
}

console.log(`\n${'═'.repeat(64)}`);
console.log(`✅ Xong: ${ok}/${entries.length} file(s)`);
if (ok > 0) {
  console.log(`\n📌 BƯỚC TIẾP THEO — nạp vào Knowledge Base:`);
  console.log(`   npm run ingest-text`);
}
console.log(`${'═'.repeat(64)}\n`);
