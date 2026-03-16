import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

  if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(query);

    // Search Supabase with vector similarity
    const { data, error } = await supabaseAdmin.rpc('search_knowledge_base', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: 0.6,
      match_count: 5,
    });

    if (error) {
      console.error('[knowledge-search] RPC error:', error);
      return NextResponse.json({ context: '', chunks: [] });
    }

    const chunks = data || [];

    // Build context string for AI prompt
    const context = chunks
      .map((c: { document_title: string; content: string; similarity: number }) =>
        `[Nguồn: ${c.document_title}]\n${c.content}`)
      .join('\n\n---\n\n');

    return NextResponse.json({ context, chunks });
  } catch (error) {
    console.error('[knowledge-search] Error:', error);
    return NextResponse.json({ context: '', chunks: [] });
  }
}
