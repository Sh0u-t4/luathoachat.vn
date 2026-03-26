// Test script to diagnose OCR error
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Load .env
const env = fs.readFileSync('.env', 'utf-8');
for (const line of env.split('\n')) {
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const KEY = process.env.GEMINI_API_KEY;
console.log('API Key found:', !!KEY, '| First 10 chars:', KEY?.slice(0, 10));

const fileManager = new GoogleAIFileManager(KEY);
const genAI = new GoogleGenerativeAI(KEY);

try {
  console.log('Attempting upload...');
  const result = await fileManager.uploadFile(
    'data/legal-documents/nghi-dinh-24-2026ndcp.pdf',
    { mimeType: 'application/pdf', displayName: 'ND24' }
  );
  console.log('Upload OK:', result.file.name, result.file.state);

  // Wait for processing
  let file = result.file;
  let attempts = 0;
  while (file.state === 'PROCESSING' && attempts < 10) {
    await new Promise(r => setTimeout(r, 3000));
    file = await fileManager.getFile(file.name);
    console.log('State:', file.state, 'attempt:', ++attempts);
  }

  if (file.state !== 'ACTIVE') {
    console.error('File not ACTIVE, state:', file.state);
    process.exit(1);
  }

  console.log('File ACTIVE, running OCR...');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const res = await model.generateContent([
    { fileData: { mimeType: 'application/pdf', fileUri: file.uri } },
    { text: 'Extract the first 200 characters of text from this document. Output in Vietnamese.' }
  ]);
  
  const text = res.response.text();
  console.log('OCR result (first 300 chars):', text.substring(0, 300));
  
  // Cleanup
  await fileManager.deleteFile(file.name);
  console.log('Cleanup done.');
  
} catch (e) {
  console.error('ERROR:', e.message);
  console.error('STATUS:', e.status);
  console.error('DETAILS:', JSON.stringify(e.errorDetails || {}, null, 2));
}
