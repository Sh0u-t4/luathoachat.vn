/**
 * OCR SCANNED PDF USING GEMINI FILES API + GEMINI 2.0 FLASH
 *
 * Quy trình:
 * 1. Upload PDF lên Gemini Files API
 * 2. Gửi PDF + prompt → Gemini 2.0 Flash (multimodal vision)
 * 3. Lưu text vào extracted-text/nghi_dinh_24_2026.txt
 *
 * Yêu cầu: GEMINI_API_KEY trong .env
 * Chạy:    node scripts/ocr-with-gemini.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Load env từ .env ────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ Thiếu GEMINI_API_KEY trong .env');
  process.exit(1);
}

// ─── Config ──────────────────────────────────────────────────────────────────
const PDF_PATH   = path.join(__dirname, '../data/legal-documents/nghi-dinh-24-2026ndcp.pdf');
const OUTPUT_PATH = path.join(__dirname, '../data/legal-documents/extracted-text/nghi_dinh_24_2026.txt');
const MODEL_NAME  = 'gemini-2.0-flash';

// ─── Prompt chuyên biệt cho văn bản pháp lý Việt Nam ────────────────────────
const OCR_PROMPT = `Bạn là chuyên gia OCR văn bản pháp lý Việt Nam. Hãy trích xuất TOÀN BỘ nội dung văn bản từ PDF này.

YÊU CẦU QUAN TRỌNG:
1. Giữ nguyên cấu trúc: Chương, Điều, Khoản (1. 2. 3...), Điểm (a) b) c)...)
2. Giữ nguyên tên các Phụ lục (Phụ lục I, II, III, IV)
3. Với các BẢNG (đặc biệt bảng mã HS, danh mục hóa chất):
   - Trích xuất đầy đủ: STT | Tên hóa chất | Mã HS | Ghi chú
   - Mỗi hàng của bảng trên một dòng, các cột ngăn cách bằng " | "
4. Giữ nguyên mã số hóa chất (CAS number, mã HS)
5. Không thêm chú thích hay diễn giải của bạn
6. Không bỏ sót trang nào
7. Nếu ảnh mờ/khó đọc, ghi: [KHÔNG RÕ] thay vì bỏ qua

Hãy bắt đầu từ trang 1 và trích xuất đến hết tài liệu.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFileActive(fileManager, fileName) {
  console.log('  ⏳ Đang chờ Gemini xử lý file...');
  let file = await fileManager.getFile(fileName);
  let attempts = 0;
  while (file.state === FileState.PROCESSING && attempts < 30) {
    await sleep(5000);
    file = await fileManager.getFile(fileName);
    attempts++;
    process.stdout.write('.');
  }
  console.log('');
  if (file.state !== FileState.ACTIVE) {
    throw new Error(`File không ở trạng thái ACTIVE sau ${attempts} lần thử. State: ${file.state}`);
  }
  return file;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Bắt đầu OCR NĐ 24/2026 bằng Gemini API...\n');

  if (!fs.existsSync(PDF_PATH)) {
    console.error(`❌ Không tìm thấy file PDF: ${PDF_PATH}`);
    process.exit(1);
  }

  const pdfStats = fs.statSync(PDF_PATH);
  console.log(`📄 File: ${path.basename(PDF_PATH)}`);
  console.log(`📦 Kích thước: ${(pdfStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🤖 Model: ${MODEL_NAME}\n`);

  const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // ── Bước 1: Upload PDF ───────────────────────────────────────────────────
  console.log('📤 Bước 1/3: Đang upload PDF lên Gemini Files API...');
  let uploadedFile;
  try {
    const uploadResponse = await fileManager.uploadFile(PDF_PATH, {
      mimeType: 'application/pdf',
      displayName: 'NĐ 24/2026/NĐ-CP — Danh mục hóa chất',
    });
    uploadedFile = uploadResponse.file;
    console.log(`✅ Upload thành công: ${uploadedFile.name}`);
    console.log(`   URI: ${uploadedFile.uri}`);
  } catch (err) {
    console.error('❌ Lỗi upload:', err.message);
    process.exit(1);
  }

  // ── Bước 2: Đợi file sẵn sàng ──────────────────────────────────────────
  console.log('\n⏳ Bước 2/3: Đang đợi Gemini xử lý file...');
  try {
    uploadedFile = await waitForFileActive(fileManager, uploadedFile.name);
    console.log('✅ File đã sẵn sàng để xử lý');
  } catch (err) {
    console.error('❌ Lỗi chờ file:', err.message);
    process.exit(1);
  }

  // ── Bước 3: OCR với Gemini ───────────────────────────────────────────────
  console.log('\n🔍 Bước 3/3: Đang OCR PDF với Gemini 2.0 Flash...');
  console.log('   (88 trang, quá trình này có thể mất 1-3 phút)\n');
  
  let extractedText = '';
  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'application/pdf',
          fileUri: uploadedFile.uri,
        },
      },
      { text: OCR_PROMPT },
    ]);

    extractedText = result.response.text();
    console.log(`✅ OCR hoàn thành!`);
    console.log(`   Ký tự trích xuất: ${extractedText.length.toLocaleString()}`);
  } catch (err) {
    console.error('❌ Lỗi OCR:', err.message);
    // Cleanup uploaded file
    try { await fileManager.deleteFile(uploadedFile.name); } catch (_) {}
    process.exit(1);
  }

  // ── Lưu kết quả ─────────────────────────────────────────────────────────
  console.log('\n💾 Đang lưu kết quả...');
  const lines = extractedText.split('\n');
  const numberedLines = lines
    .map((line, idx) => `${String(idx + 1).padStart(6, ' ')}→${line}`)
    .join('\n');

  fs.writeFileSync(OUTPUT_PATH, numberedLines, 'utf-8');
  console.log(`✅ Đã lưu vào: ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`   Tổng dòng: ${lines.length.toLocaleString()}`);

  // ── Cleanup file upload ──────────────────────────────────────────────────
  try {
    await fileManager.deleteFile(uploadedFile.name);
    console.log('🧹 Đã xóa file tạm khỏi Gemini Files API');
  } catch (_) {}

  // ── Tóm tắt ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 OCR HOÀN TẤT!');
  console.log('═'.repeat(60));
  console.log(`📁 Output: ${OUTPUT_PATH}`);
  console.log(`📊 ${lines.length} dòng | ${extractedText.length.toLocaleString()} ký tự`);
  console.log('\n📋 Bước tiếp theo:');
  console.log('  1. Kiểm tra file output (có bảng HS code đúng không?)');
  console.log('  2. Chạy: npm run ingest-legal-docs  ← Re-index vào Supabase');
  console.log('  3. Test chat: "Mã HS của axit sulfuric trong NĐ 24 là gì?"');
}

main().catch((err) => {
  console.error('💥 Lỗi nghiêm trọng:', err);
  process.exit(1);
});
