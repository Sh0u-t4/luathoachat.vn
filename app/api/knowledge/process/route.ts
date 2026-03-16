import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Chunk text into ~500 char segments with overlap
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Add overlap: take last ~overlap chars
      const words = current.split(' ');
      current = words.slice(-Math.floor(overlap / 6)).join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Filter out tiny chunks
  return chunks.filter(c => c.length > 50);
}

// Generate embedding using Gemini text-embedding-004 (768-dim)
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding error: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function POST(request: NextRequest) {
  try {
    const { document_id, text_content } = await request.json();

    if (!document_id || !text_content) {
      return NextResponse.json({ error: 'document_id and text_content required' }, { status: 400 });
    }

    // Verify document exists
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, title')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Chunk the text
    const chunks = chunkText(text_content);
    console.log(`[process] Processing ${chunks.length} chunks for doc ${document_id}`);

    // Generate embeddings and insert chunks
    const chunkInserts = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        chunkInserts.push({
          document_id,
          chunk_index: i,
          content: chunks[i],
          embedding: `[${embedding.join(',')}]`,
          metadata: { chunk_index: i, total_chunks: chunks.length },
        });
      } catch (embErr) {
        console.error(`[process] Embedding error for chunk ${i}:`, embErr);
      }
    }

    // Batch insert chunks
    if (chunkInserts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('knowledge_chunks')
        .insert(chunkInserts);

      if (insertError) {
        throw new Error(`Insert chunks failed: ${insertError.message}`);
      }
    }

    // Update document status
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: chunkInserts.length })
      .eq('id', document_id);

    return NextResponse.json({
      success: true,
      chunks_created: chunkInserts.length,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[process] Error:', errMsg);

    // Update document status to error
    try {
      const { document_id } = await request.json().catch(() => ({}));
      if (document_id) {
        await supabaseAdmin
          .from('knowledge_documents')
          .update({ status: 'error', error_message: errMsg })
          .eq('id', document_id);
      }
    } catch {}

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
