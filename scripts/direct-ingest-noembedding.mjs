/**
 * Direct ingest script - reads local PDFs and saves text chunks to Supabase
 * WITHOUT needing Gemini embedding API (uses full-text search instead)
 * Usage: npx tsx scripts/direct-ingest-noembedding.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load env vars from .env.local
const envContent = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...vals] = trimmed.split('=');
  if (key) env[key.trim()] = vals.join('=').trim();
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE env vars!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PDF_MAP = {
  'nghi_dinh_so_25.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf': 'Nghị định 25/2026/NĐ-CP',
  'nghi_dinh_so_26.2026.nd-cp_qlhc_va_hc_nguy_hiem_(1).pdf':              'Nghị định 26/2026/NĐ-CP',
  '69qh.signed.pdf':                                                        'Luật Hóa chất 69/2025/QH15',
  'nghi-dinh-24-2026ndcp.pdf':                                              'Nghị định 24/2026/NĐ-CP',
};

function chunkText(text, chunkSize = 1200, overlap = 150) {
  const chunks = [];
  // Split by Vietnamese legal structure markers first
  const sections = text.split(/\n(?=Điều\s+\d+|Chương\s+[IVX]+|PHẦN\s+[IVX]+)/);
  
  for (const section of sections) {
    if (section.length <= chunkSize) {
      if (section.trim().length > 80) chunks.push(section.trim());
    } else {
      // Further split long sections by sentences
      const sentences = section.split(/(?<=[.!?])\s+/);
      let current = '';
      for (const s of sentences) {
        if ((current + ' ' + s).length > chunkSize && current.length > 0) {
          chunks.push(current.trim());
          const words = current.split(' ');
          current = words.slice(-Math.floor(overlap / 8)).join(' ') + ' ' + s;
        } else {
          current += (current ? ' ' : '') + s;
        }
      }
      if (current.trim().length > 80) chunks.push(current.trim());
    }
  }
  return chunks.filter(c => c.length > 80);
}

async function ingestFile(filename, title) {
  const filePath = path.join(ROOT, 'data', 'legal-documents', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ File not found: ${filePath}`);
    return false;
  }

  const fileSize = fs.statSync(filePath).size;
  const buffer = fs.readFileSync(filePath);
  
  // Parse PDF
  let parsed;
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    parsed = await pdfParse(buffer);
  } catch (e) {
    console.error(`  ✗ PDF parse error: ${e.message}`);
    // Try fallback
    try {
      const pdfParse2 = (await import('pdf-parse')).default;
      parsed = await pdfParse2(buffer);
    } catch (e2) {
      console.error(`  ✗ PDF parse fallback error: ${e2.message}`);
      return false;
    }
  }

  if (!parsed?.text || parsed.text.trim().length < 100) {
    console.error(`  ✗ No extractable text (scanned PDF?): ${filename}`);
    return false;
  }

  console.log(`  ✓ Extracted ${parsed.text.length.toLocaleString()} chars, ${parsed.numpages} pages`);

  // Upsert document record
  let docId;
  const { data: existing } = await supabase
    .from('knowledge_documents')
    .select('id')
    .eq('title', title)
    .maybeSingle();

  if (existing) {
    docId = existing.id;
    const { error: delErr } = await supabase.from('knowledge_chunks').delete().eq('document_id', docId);
    if (delErr) console.log(`  ⚠️  Could not delete old chunks: ${delErr.message}`);
    await supabase.from('knowledge_documents')
      .update({ status: 'processing', chunk_count: 0, storage_path: filename, error_message: null })
      .eq('id', docId);
    console.log(`  Reusing doc ID: ${docId}`);
  } else {
    const { data: newDoc, error } = await supabase
      .from('knowledge_documents')
      .insert({
        title,
        file_name: filename,
        file_type: 'pdf',
        file_size: fileSize,
        storage_path: filename,
        status: 'processing',
      })
      .select().single();
    if (error) { console.error(`  ✗ DB insert: ${error.message}`); return false; }
    docId = newDoc.id;
    console.log(`  Created doc ID: ${docId}`);
  }

  const chunks = chunkText(parsed.text);
  console.log(`  Chunked into ${chunks.length} segments`);

  // Insert chunks WITHOUT embeddings (null embedding = text search mode)
  const inserts = chunks.map((content, i) => ({
    document_id: docId,
    chunk_index: i,
    content,
    embedding: null,  // no embedding — will use full-text search
    metadata: { chunk_index: i, total_chunks: chunks.length, source: filename },
  }));

  // Batch insert (50 at a time)
  let inserted = 0;
  for (let b = 0; b < inserts.length; b += 50) {
    const batch = inserts.slice(b, b + 50);
    const { error } = await supabase.from('knowledge_chunks').insert(batch);
    if (error) {
      console.error(`  ✗ Insert batch ${b}: ${error.message}`);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${inserts.length} chunks...`);
    }
  }
  console.log(''); // newline

  // Update status
  await supabase.from('knowledge_documents')
    .update({ status: 'ready', chunk_count: inserted })
    .eq('id', docId);

  console.log(`  ✅ Done: ${inserted} chunks saved`);
  return inserted > 0;
}

// Main
const targetKey = process.argv[2];
const entries = targetKey
  ? Object.entries(PDF_MAP).filter(([f]) => f.includes(targetKey))
  : Object.entries(PDF_MAP);

console.log(`\n🚀 Ingesting ${entries.length} file(s) WITHOUT embeddings (text search mode)\n`);

for (const [filename, title] of entries) {
  console.log(`\n📄 ${title}`);
  await ingestFile(filename, title);
}

// Summary
const { data: docs } = await supabase
  .from('knowledge_documents')
  .select('title, chunk_count, status');

console.log('\n=== Knowledge Base Summary ===');
let total = 0;
for (const d of (docs || [])) {
  total += d.chunk_count || 0;
  const icon = d.chunk_count > 0 ? '✅' : '❌';
  console.log(`${icon} ${d.title}: ${d.chunk_count} chunks`);
}
console.log(`\nTotal chunks: ${total}`);
console.log('\nNOTE: Using PostgreSQL full-text search (no vector embeddings needed)');
