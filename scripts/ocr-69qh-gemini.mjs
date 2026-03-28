/**
 * OCR LUẬT HÓA CHẤT 69/2025/QH15 USING GEMINI REST API
 *
 * Quy trình:
 * 1. Đọc PDF → base64
 * 2. Gửi inline base64 + prompt → Gemini REST API
 * 3. Lưu text → extracted-text/69qh_luat_hoa_chat.txt
 *
 * Yêu cầu: GEMINI_API_KEY trong .env
 * Chạy:    npm run ocr-69qh-gemini
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq < 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('ERROR: Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const PDF_PATH    = path.join(__dirname, '../data/legal-documents/69qh.signed.pdf');
const OUTPUT_PATH = path.join(__dirname, '../data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt');

// ─── Prompt ──────────────────────────────────────────────────────────────────
const PROMPT = `Bạn là chuyên gia OCR văn bản pháp lý Việt Nam. Hãy trích xuất TOÀN BỘ nội dung từ file PDF Luật Hóa chất 69/2025/QH15 này.

YÊU CẦU QUAN TRỌNG:
1. Giữ nguyên cấu trúc: Phần, Chương, Điều, Khoản (1. 2. 3...), Điểm (a) b) c)...)
2. Giữ nguyên tiêu đề các Điều (ví dụ: "Điều 1. Phạm vi điều chỉnh")
3. Trích xuất đầy đủ tất cả các điều khoản, không bỏ sót
4. Giữ nguyên định nghĩa các thuật ngữ hóa chất
5. Không thêm chú thích hay diễn giải của bạn
6. Viết tiếng Việt có dấu chính xác
7. Với các danh mục/bảng: trích xuất đủ từng dòng

Hãy bắt đầu từ trang 1 và trích xuất đến hết tài liệu.`;

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting Gemini OCR for Luật Hóa chất 69/2025/QH15...');
  console.log('Model:', MODEL);

  if (!fs.existsSync(PDF_PATH)) {
    console.error('PDF not found:', PDF_PATH);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const base64PDF = pdfBuffer.toString('base64');
  console.log('PDF loaded:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('Base64 length:', base64PDF.length, 'chars');

  const body = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64PDF,
          }
        },
        { text: PROMPT }
      ]
    }],
    generationConfig: {
      maxOutputTokens: 65536,
      temperature: 0.1,
    }
  };

  console.log('\nSending to Gemini API (this may take 2-5 minutes for scanned PDF)...');

  let response;
  try {
    response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error('Network error:', e.message);
    process.exit(1);
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error('API Error:', response.status, response.statusText);
    console.error('Details:', errText.substring(0, 500));
    process.exit(1);
  }

  const data = await response.json();

  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.error('No candidates in response');
    console.error('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    process.exit(1);
  }

  const text = candidate.content?.parts?.map(p => p.text || '').join('') || '';

  if (!text || text.length < 100) {
    console.error('Empty or too-short response. Length:', text.length);
    console.error('Finish reason:', candidate.finishReason);
    process.exit(1);
  }

  console.log('\nOCR SUCCESS!');
  console.log('Characters extracted:', text.length.toLocaleString());
  console.log('Finish reason:', candidate.finishReason);
  console.log('\nFirst 300 chars preview:');
  console.log(text.substring(0, 300));

  // Save with line numbers
  const lines = text.split('\n');
  const numbered = lines.map((l, i) => `${String(i + 1).padStart(6, ' ')}→${l}`).join('\n');
  fs.writeFileSync(OUTPUT_PATH, numbered, 'utf-8');

  console.log('\nSaved to:', path.relative(process.cwd(), OUTPUT_PATH));
  console.log('Total lines:', lines.length.toLocaleString());
  console.log('\nNext step: npm run ingest-legal-docs');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
