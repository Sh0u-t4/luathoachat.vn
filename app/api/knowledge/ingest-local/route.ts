import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Chunk text into segments with overlap
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(' ');
      current = words.slice(-Math.floor(overlap / 6)).join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

// Generate embedding using Gemini text-embedding-004
async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini embedding error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

// Map local filename to document title
const LOCAL_PDF_MAP: Record<string, string> = {
  '69qh.signed.pdf': 'Luật Hóa chất 69/2025/QH15',
  'nghi-dinh-24-2026ndcp.pdf': 'Nghị định 24/2026/NĐ-CP',
  'nghi_dinh_so_25.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf': 'Nghị định 25/2026/NĐ-CP',
  'nghi_dinh_so_26.2026.nd-cp_qlhc_va_hc_nguy_hiem_(1).pdf': 'Nghị định 26/2026/NĐ-CP',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    const pdfDir = path.join(process.cwd(), 'data', 'legal-documents');

    // Determine which files to process
    let filesToProcess: string[] = [];
    if (filename) {
      filesToProcess = [filename];
    } else {
      // Process all known PDFs
      filesToProcess = Object.keys(LOCAL_PDF_MAP);
    }

    const results = [];

    for (const fname of filesToProcess) {
      const filePath = path.join(pdfDir, fname);
      const title = LOCAL_PDF_MAP[fname] || fname.replace('.pdf', '');

      console.log(`[ingest-local] Processing: ${fname}`);

      if (!fs.existsSync(filePath)) {
        results.push({ file: fname, error: 'File not found' });
        continue;
      }

      try {
        // Read PDF from local disk
        const buffer = fs.readFileSync(filePath);
        const pdfParse = (await import('pdf-parse')).default ?? (await import('pdf-parse'));
        const parsed = await pdfParse(buffer);

        if (!parsed.text || parsed.text.trim().length < 10) {
          results.push({ file: fname, error: 'No text content in PDF' });
          continue;
        }

        console.log(`[ingest-local] Extracted ${parsed.text.length} chars from ${fname}`);

        // Check if document record already exists
        let documentId: string;
        const { data: existing } = await supabaseAdmin
          .from('knowledge_documents')
          .select('id')
          .eq('title', title)
          .single();

        if (existing) {
          documentId = existing.id;
          // Delete existing chunks to re-embed
          await supabaseAdmin.from('knowledge_chunks').delete().eq('document_id', documentId);
          await supabaseAdmin.from('knowledge_documents').update({ status: 'processing', chunk_count: 0, storage_path: fname }).eq('id', documentId);
        } else {
          // Create new document record
          const { data: newDoc, error: insertErr } = await supabaseAdmin
            .from('knowledge_documents')
            .insert({
              title,
              file_name: fname,
              file_type: 'pdf',
              file_size: buffer.length,
              storage_path: fname,
              status: 'processing',
            })
            .select()
            .single();

          if (insertErr || !newDoc) {
            results.push({ file: fname, error: `DB insert error: ${insertErr?.message}` });
            continue;
          }
          documentId = newDoc.id;
        }

        // Chunk the text
        const chunks = chunkText(parsed.text);
        console.log(`[ingest-local] Created ${chunks.length} chunks for ${fname}`);

        if (chunks.length === 0) {
          await supabaseAdmin.from('knowledge_documents').update({ status: 'error', error_message: 'No chunks created' }).eq('id', documentId);
          results.push({ file: fname, error: 'No chunks created' });
          continue;
        }

        // Generate embeddings and insert (batch of 10 at a time)
        const chunkInserts = [];
        let embeddingErrors = 0;

        for (let i = 0; i < chunks.length; i++) {
          try {
            const embedding = await generateEmbedding(chunks[i]);
            chunkInserts.push({
              document_id: documentId,
              chunk_index: i,
              content: chunks[i],
              embedding: `[${embedding.join(',')}]`,
              metadata: { chunk_index: i, total_chunks: chunks.length, source_file: fname },
            });

            if (i % 10 === 0) {
              console.log(`[ingest-local] Embedded ${i + 1}/${chunks.length} chunks`);
            }
          } catch (embErr) {
            embeddingErrors++;
            console.error(`[ingest-local] Embedding error chunk ${i}:`, embErr);
          }
        }

        // Batch insert all chunks
        if (chunkInserts.length > 0) {
          // Insert in batches of 50
          const BATCH = 50;
          for (let b = 0; b < chunkInserts.length; b += BATCH) {
            const batch = chunkInserts.slice(b, b + BATCH);
            const { error: insertError } = await supabaseAdmin.from('knowledge_chunks').insert(batch);
            if (insertError) {
              console.error(`[ingest-local] Insert error:`, insertError);
            }
          }
        }

        // Update document status
        await supabaseAdmin
          .from('knowledge_documents')
          .update({ status: 'ready', chunk_count: chunkInserts.length })
          .eq('id', documentId);

        results.push({
          file: fname,
          title,
          document_id: documentId,
          chunks_created: chunkInserts.length,
          embedding_errors: embeddingErrors,
        });

        console.log(`[ingest-local] Done: ${fname} → ${chunkInserts.length} chunks`);

      } catch (fileErr) {
        const msg = fileErr instanceof Error ? fileErr.message : 'Unknown error';
        console.error(`[ingest-local] Error processing ${fname}:`, msg);
        results.push({ file: fname, error: msg });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ingest-local] Fatal error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
