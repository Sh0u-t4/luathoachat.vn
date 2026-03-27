/**
 * OCR SCANNED PDF USING GEMINI REST API (raw fetch — same approach as chat/route.ts)
 *
 * Quy trình:
 * 1. Đọc PDF → base64
 * 2. Gửi inline base64 + prompt → Gemini REST API /v1beta/models/gemini-2.0-flash:generateContent
 * 3. Lưu text → extracted-text/nghi_dinh_24_2026.txt
 *
 * Yêu cầu: GEMINI_API_KEY trong .env
 * Chạy:    npm run ocr-nd24-gemini
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

const PDF_PATH    = path.join(__dirname, '../data/legal-documents/nghi-dinh-24-2026ndcp.pdf');
const OUTPUT_PATH = path.join(__dirname, '../data/legal-documents/extracted-text/nghi_dinh_24_2026.txt');

// ─── Prompt ──────────────────────────────────────────────────────────────────
const PROMPT = `Ban la chuyen gia OCR van ban phap ly Viet Nam. Hay trich xuat TOAN BO noi dung van ban tu PDF nay.

YEU CAU QUAN TRONG:
1. Giu nguyen cau truc: Chuong, Dieu, Khoan (1. 2. 3...), Diem (a) b) c)...)
2. Giu nguyen ten cac Phu luc (Phu luc I, II, III, IV)
3. Voi cac BANG (dac biet bang ma HS, danh muc hoa chat):
   - Trich xuat day du: STT | Ten hoa chat | Ma HS | Ghi chu
   - Moi hang cua bang tren mot dong, cac cot ngan cach bang " | "
4. Giu nguyen ma so hoa chat (CAS number, ma HS code)
5. Khong them chu thich hay dien giai cua ban
6. Khong bo sot trang nao - trich xuat het 88 trang
7. Viet tieng Viet co dau chinh xac

Hay bat dau tu trang 1 va trich xuat den het tai lieu.`;

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting Gemini OCR for ND 24/2026...');
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

  console.log('\nSending to Gemini API (this may take 2-5 minutes for 88 pages)...');

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

  console.log('OCR SUCCESS!');
  console.log('Characters extracted:', text.length.toLocaleString());
  console.log('Finish reason:', candidate.finishReason);
  console.log('\nFirst 300 chars preview:');
  console.log(text.substring(0, 300));

  // Save with line numbers (compatible with ingest script)
  const lines = text.split('\n');
  const numbered = lines.map((l, i) => `${String(i + 1).padStart(6, ' ')}→${l}`).join('\n');
  fs.writeFileSync(OUTPUT_PATH, numbered, 'utf-8');

  console.log('\nSaved to:', path.relative(process.cwd(), OUTPUT_PATH));
  console.log('Total lines:', lines.length.toLocaleString());
  console.log('\nNext steps:');
  console.log('  1. Review output file for HS code tables');
  console.log('  2. Run: npm run ingest-legal-docs');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
