/**
 * Direct ingest script - reads local PDFs and embeds them into Supabase
 * Run with: node --loader ts-node/esm scripts/direct-ingest.mjs
 * Or: npx tsx scripts/direct-ingest.mjs
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
const GEMINI_KEY   = env['GEMINI_API_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Missing env vars!', { SUPABASE_URL: !!SUPABASE_URL, SERVICE_KEY: !!SERVICE_KEY, GEMINI_KEY: !!GEMINI_KEY });
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PDF_MAP = {
  '69qh.signed.pdf':                                                     'Luật Hóa chất 69/2025/QH15',
  'nghi-dinh-24-2026ndcp.pdf':                                           'Nghị định 24/2026/NĐ-CP',
  'nghi_dinh_so_25.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf': 'Nghị định 25/2026/NĐ-CP',
  'nghi_dinh_so_26.2026.nd-cp_qlhc_va_hc_nguy_hiem_(1).pdf':            'Nghị định 26/2026/NĐ-CP',
};

// ── helpers ────────────────────────────────────────────────────────────────────

function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(' ');
      current = words.slice(-Math.floor(overlap / 6)).join(' ') + ' ' + s;
    } else {
      current += (current ? ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

async function embed(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini embed error: ${await res.text()}`);
  const d = await res.json();
  return d.embedding.values;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── main ───────────────────────────────────────────────────────────────────────

async function ingestFile(filename, title) {
  const filePath = path.join(ROOT, 'data', 'legal-documents', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ File not found: ${filePath}`);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const parsed = await pdfParse(buffer);

  if (!parsed.text || parsed.text.trim().length < 10) {
    console.error(`  ✗ No text in PDF (scanned image?): ${filename}`);
    return;
  }

  console.log(`  Extracted ${parsed.text.length.toLocaleString()} chars`);

  // Upsert document record
  let docId;
  const { data: existing } = await supabase
    .from('knowledge_documents')
    .select('id')
    .eq('title', title)
    .maybeSingle();

  if (existing) {
    docId = existing.id;
    await supabase.from('knowledge_chunks').delete().eq('document_id', docId);
    await supabase.from('knowledge_documents')
      .update({ status: 'processing', chunk_count: 0, storage_path: filename })
      .eq('id', docId);
    console.log(`  Reusing existing doc ID: ${docId}`);
  } else {
    const { data: newDoc, error } = await supabase
      .from('knowledge_documents')
      .insert({ title, file_name: filename, file_type: 'pdf', file_size: buffer.length, storage_path: filename, status: 'processing' })
      .select().single();
    if (error) { console.error('  ✗ DB insert error:', error.message); return; }
    docId = newDoc.id;
    console.log(`  Created new doc ID: ${docId}`);
  }

  const chunks = chunkText(parsed.text);
  console.log(`  Chunked into ${chunks.length} segments`);

  // Embed and insert chunks
  const inserts = [];
  let errors = 0;
  for (let i = 0; i < chunks.length; i++) {
    try {
      const vec = await embed(chunks[i]);
      inserts.push({
        document_id: docId,
        chunk_index: i,
        content: chunks[i],
        embedding: `[${vec.join(',')}]`,
        metadata: { chunk_index: i, total_chunks: chunks.length },
      });
      if ((i + 1) % 20 === 0 || i === chunks.length - 1) {
        process.stdout.write(`\r  Embedded ${i + 1}/${chunks.length} chunks...`);
      }
      // Small delay to avoid rate limiting
      if (i % 50 === 49) await sleep(1000);
    } catch (e) {
      errors++;
      console.error(`\n  ✗ Embed error chunk ${i}:`, e.message);
      await sleep(2000);
    }
  }
  console.log(''); // newline after progress

  // Insert in batches of 50
  for (let b = 0; b < inserts.length; b += 50) {
    const batch = inserts.slice(b, b + 50);
    const { error } = await supabase.from('knowledge_chunks').insert(batch);
    if (error) console.error(`  ✗ Insert batch ${b} error:`, error.message);
  }

  await supabase.from('knowledge_documents')
    .update({ status: 'ready', chunk_count: inserts.length })
    .eq('id', docId);

  console.log(`  ✓ Done: ${inserts.length} chunks inserted (${errors} errors)`);
}

// ── entry ──────────────────────────────────────────────────────────────────────

const targetFile = process.argv[2]; // optional: pass specific filename

const entries = targetFile
  ? Object.entries(PDF_MAP).filter(([f]) => f.includes(targetFile))
  : Object.entries(PDF_MAP);

console.log(`\n🚀 Starting ingest of ${entries.length} file(s)...\n`);

for (const [filename, title] of entries) {
  console.log(`\n📄 [${title}]`);
  await ingestFile(filename, title);
}

// Final summary
const { data: docs } = await supabase
  .from('knowledge_documents')
  .select('title, chunk_count, status');

console.log('\n\n=== Final State ===');
let totalChunks = 0;
for (const d of (docs || [])) {
  totalChunks += d.chunk_count || 0;
  const icon = d.chunk_count > 0 ? '✅' : '❌';
  console.log(`${icon} ${d.title}: ${d.chunk_count} chunks [${d.status}]`);
}
console.log(`\nTotal chunks in DB: ${totalChunks}`);
