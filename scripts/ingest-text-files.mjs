/**
 * ingest-text-files.mjs
 * Đọc các file .txt đã được OCR và nạp vào Supabase Knowledge Base
 * với embeddings từ Gemini text-embedding.
 *
 * Chạy: node scripts/ingest-text-files.mjs
 * Hoặc chỉ 1 file: node scripts/ingest-text-files.mjs nghi_dinh_24_2026.txt
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Load env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envFiles = ['.env', '.env.local'];
  const env = {};
  for (const f of envFiles) {
    const fpath = path.join(ROOT, f);
    if (!fs.existsSync(fpath)) continue;
    const content = fs.readFileSync(fpath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];
const GEMINI_KEY   = env['GEMINI_API_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('❌ Thiếu env vars:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SERVICE_KEY: !!SERVICE_KEY,
    GEMINI_KEY: !!GEMINI_KEY,
  });
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEXT_DIR = path.join(ROOT, 'data', 'legal-documents', 'extracted-text');

// Map filename → document title
const FILE_TITLE_MAP = {
  'nghi_dinh_24_2026.txt': 'Nghị định 24/2026/NĐ-CP',
  '69qh_luat_hoa_chat.txt': 'Luật Hóa chất 69/2025/QH15',
  'nghi_dinh_25_2026.txt': 'Nghị định 25/2026/NĐ-CP',
  'nghi_dinh_26_2026.txt': 'Nghị định 26/2026/NĐ-CP',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Smart chunking: ưu tiên chia theo Điều/Khoản để mỗi chunk có ngữ nghĩa đầy đủ
 */
function chunkTextSmart(text, maxChunkSize = 1000, overlap = 150) {
  const chunks = [];

  // Thử chia theo Điều trước
  const dieuPattern = /(?=\nĐiều \d+[.\s])/g;
  const dieuSections = text.split(dieuPattern).filter(s => s.trim().length > 30);

  if (dieuSections.length > 1) {
    // Có cấu trúc Điều/Khoản — chia theo đó
    for (const section of dieuSections) {
      if (section.length <= maxChunkSize) {
        chunks.push(section.trim());
      } else {
        // Section quá dài → chia nhỏ hơn theo đoạn
        const subChunks = splitByParagraph(section, maxChunkSize, overlap);
        chunks.push(...subChunks);
      }
    }
  } else {
    // Không có cấu trúc Điều → chia theo đoạn/dòng
    chunks.push(...splitByParagraph(text, maxChunkSize, overlap));
  }

  return chunks.filter(c => c.trim().length > 50);
}

function splitByParagraph(text, maxSize, overlap) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      // Overlap: giữ lại một số ký tự cuối
      const overlapText = current.slice(-overlap);
      current = overlapText + '\n\n' + para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Generate embedding bằng Gemini text-embedding-004
 */
async function generateEmbedding(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

/**
 * Upsert document record trong Supabase
 */
async function upsertDocument(title, fileName, fileSize) {
  const { data: existing } = await supabase
    .from('knowledge_documents')
    .select('id')
    .eq('title', title)
    .maybeSingle();

  if (existing) {
    await supabase.from('knowledge_chunks').delete().eq('document_id', existing.id);
    await supabase.from('knowledge_documents')
      .update({ status: 'processing', chunk_count: 0 })
      .eq('id', existing.id);
    console.log(`  ♻️  Tái sử dụng document ID: ${existing.id}`);
    return existing.id;
  }

  const { data: newDoc, error } = await supabase
    .from('knowledge_documents')
    .insert({
      title,
      file_name: fileName,
      file_type: 'txt',
      file_size: fileSize,
      storage_path: fileName,
      status: 'processing',
    })
    .select()
    .single();

  if (error) throw new Error(`DB insert error: ${error.message}`);
  console.log(`  🆕 Tạo document mới ID: ${newDoc.id}`);
  return newDoc.id;
}

// ── Main ingest function ─────────────────────────────────────────────────────
async function ingestFile(fileName, title) {
  const filePath = path.join(TEXT_DIR, fileName);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 INGEST: ${title}`);
  console.log(`   File: ${fileName}`);
  console.log(`${'='.repeat(60)}`);

  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ File không tồn tại: ${filePath}`);
    return { success: false, error: 'File not found' };
  }

  const rawText = fs.readFileSync(filePath, 'utf-8');
  const fileSize = Buffer.byteLength(rawText, 'utf-8');

  console.log(`  📊 Kích thước: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`  📝 Số ký tự: ${rawText.length.toLocaleString()}`);

  if (rawText.trim().length < 100) {
    console.error(`  ❌ File quá ngắn — có thể chưa được OCR`);
    return { success: false, error: 'File too short (not OCR-ed?)' };
  }

  // Upsert document record
  const docId = await upsertDocument(title, fileName, fileSize);

  // Chunk text
  const chunks = chunkTextSmart(rawText);
  console.log(`  ✂️  Chunked thành ${chunks.length} đoạn`);

  if (chunks.length === 0) {
    await supabase.from('knowledge_documents')
      .update({ status: 'error', error_message: 'No chunks' })
      .eq('id', docId);
    return { success: false, error: 'No chunks' };
  }

  // Generate embeddings + prepare inserts
  const insertsAll = [];
  let embErrors = 0;
  const startTime = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    try {
      const vec = await generateEmbedding(chunks[i]);
      insertsAll.push({
        document_id: docId,
        chunk_index: i,
        content: chunks[i],
        embedding: `[${vec.join(',')}]`,
        metadata: {
          chunk_index: i,
          total_chunks: chunks.length,
          source_file: fileName,
          char_count: chunks[i].length,
        },
      });

      // Progress
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const eta = Math.round((elapsed / (i + 1)) * (chunks.length - i - 1));
        process.stdout.write(`\r  ⚡ Embedding ${i + 1}/${chunks.length} (${elapsed}s, eta ${eta}s)...`);
      }

      // Rate limit: delay mỗi 50 chunks
      if (i % 50 === 49) await sleep(1500);
    } catch (e) {
      embErrors++;
      console.error(`\n  ⚠️  Embed error chunk ${i}: ${e.message}`);
      await sleep(3000);
    }
  }

  console.log(''); // newline

  // Batch insert vào Supabase (50 per batch)
  const BATCH = 50;
  for (let b = 0; b < insertsAll.length; b += BATCH) {
    const batch = insertsAll.slice(b, b + BATCH);
    const { error } = await supabase.from('knowledge_chunks').insert(batch);
    if (error) {
      console.error(`  ⚠️  Insert batch ${b}-${b + BATCH - 1} error:`, error.message);
    }
  }

  // Update document status
  await supabase.from('knowledge_documents')
    .update({ status: 'ready', chunk_count: insertsAll.length })
    .eq('id', docId);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ XONG! ${insertsAll.length} chunks inserted (${embErrors} lỗi) trong ${totalTime}s`);

  return { success: true, chunks: insertsAll.length, errors: embErrors };
}

// ── Entry Point ──────────────────────────────────────────────────────────────
const targetArg = process.argv[2]; // optional: specific filename

let filesToProcess = [];
if (targetArg) {
  const title = FILE_TITLE_MAP[targetArg] || targetArg.replace('.txt', '');
  filesToProcess = [[targetArg, title]];
} else {
  filesToProcess = Object.entries(FILE_TITLE_MAP);
}

console.log('\n🚀 BẮT ĐẦU INGEST VĂN BẢN VÀO KNOWLEDGE BASE');
console.log(`📋 Sẽ xử lý ${filesToProcess.length} file(s)\n`);

const results = {};
for (const [fileName, title] of filesToProcess) {
  results[fileName] = await ingestFile(fileName, title);
  if (filesToProcess.length > 1) await sleep(2000);
}

// Final summary
console.log('\n\n╔══════════════════════════════════════════╗');
console.log('║         KẾT QUẢ INGEST KNOWLEDGE BASE    ║');
console.log('╚══════════════════════════════════════════╝');

const { data: docs } = await supabase
  .from('knowledge_documents')
  .select('title, chunk_count, status')
  .order('title');

let total = 0;
for (const d of (docs || [])) {
  total += d.chunk_count || 0;
  const icon = d.status === 'ready' && d.chunk_count > 0 ? '✅' : '❌';
  console.log(`${icon} ${d.title}: ${d.chunk_count || 0} chunks [${d.status}]`);
}
console.log(`\n📊 Tổng số chunks trong KB: ${total}`);
console.log('\n✨ Hoàn tất! Hệ thống RAG đã sẵn sàng tra cứu.\n');
