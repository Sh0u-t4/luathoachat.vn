import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Normalize Vietnamese diacritics to plain ASCII for better keyword matching
function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Extract meaningful keywords from a query (remove common stop words)
function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'la', 'gi', 'co', 'khong', 'nhu', 'the', 'nao', 'cua', 'va', 'trong',
    'cho', 'voi', 'theo', 'duoc', 'can', 'phai', 'de', 'khi', 'neu', 'ma',
    'thi', 'len', 'xuong', 'ra', 'vao', 'biet', 'hoi', 'xin', 'hay',
    'ban', 'toi', 'chung', 'mot', 'nhieu', 'cac', 'nhung', 'moi'
  ]);

  const normalized = normalizeVietnamese(query);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  return words.filter(w => !stopWords.has(w));
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
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
    if (!res.ok) return null;
    const data = await res.json();
    return data.embedding?.values ?? null;
  } catch {
    return null;
  }
}

type KnowledgeChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  knowledge_documents:
    | { id: string; title: string; status: string }
    | { id: string; title: string; status: string }[];
};

// Score a chunk by how many keywords it contains
function scoreChunk(content: string, keywords: string[]): number {
  const normalizedContent = normalizeVietnamese(content);
  let score = 0;
  for (const kw of keywords) {
    // Count occurrences of each keyword
    const regex = new RegExp(kw, 'g');
    const matches = normalizedContent.match(regex);
    if (matches) score += matches.length;
  }
  return score;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, top_k } = body;
    const matchCount = Math.min(Math.max(top_k ?? 6, 3), 15); // clamp 3-15
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    // ── Query expansion for critical documents ──────────────────────────────
    // Detect if query is about GHS/labeling/TT02 or toxic criteria/NĐ26 Đ2
    const needsTT02 = /nh[ãa]n|ghi nh[ãa]n|sds|phi[eế]u an to[àa]n|ghs|c[aả]nh b[aá]o|picto|bi[eể]u t[uư][ợo]ng|th[oô]ng t[uư]|tt.?02/i.test(query);
    const needsGHS26 = /ch[aấ]t đ[oộ]c|ti[eê]u ch[ií] (?:độc|phân loại)|ph[aâ]n lo[aạ]i đ[oộ]c|toxic|LD50|LC50|ghs categor/i.test(query);

    // If needed, expand the embedding query to pull in relevant documents
    const embeddingQuery = needsTT02
      ? query + ' thông tư 02 2026 nhãn hóa chất SDS phiếu an toàn'
      : needsGHS26
        ? query + ' nghị định 26 điều 2 khoản 4 chất độc tiêu chí GHS'
        : query;

    // Try vector search first
    const embedding = await generateEmbedding(embeddingQuery);

    if (embedding) {
      const { data, error } = await supabaseAdmin.rpc('search_knowledge_base', {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: 0.30,  // Đủ thấp để catch chunk có similarity trung bình
        match_count: matchCount,
      });

      // Tìm thêm chunks từ documents có title khớp với keyword câu hỏi
      const queryWords = query.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
      const titleConditions = queryWords.map((w: string) => `knowledge_documents.title.ilike.%${w}%`).join(',');
      let supplementaryChunks: { document_title: string; content: string; similarity: number; chunk_index: number }[] = [];

      if (titleConditions) {
        const { data: suppData } = await supabaseAdmin
          .from('knowledge_chunks')
          .select('content, chunk_index, knowledge_documents!inner(title, status)')
          .or(titleConditions, { foreignTable: 'knowledge_documents' })
          .limit(8);  // Tăng từ 5 → 8

        if (suppData && suppData.length > 0) {
          supplementaryChunks = (suppData as any[]).map(c => ({
            content: c.content,
            document_title: (Array.isArray(c.knowledge_documents) ? c.knowledge_documents[0]?.title : c.knowledge_documents?.title) || 'Văn bản pháp luật',
            similarity: 0.29,
            chunk_index: c.chunk_index,
          }));
        }
      }

      // ── Dedicated fetch cho TT 02/2026 khi query liên quan ───────────────
      if (needsTT02) {
        const { data: tt02Data } = await supabaseAdmin
          .from('knowledge_chunks')
          .select('content, chunk_index, knowledge_documents!inner(title, status)')
          .or('knowledge_documents.title.ilike.%02/2026%,knowledge_documents.title.ilike.%TT-BCT%,knowledge_documents.title.ilike.%thông tư%', { foreignTable: 'knowledge_documents' })
          .order('chunk_index', { ascending: true })
          .limit(8);

        if (tt02Data && tt02Data.length > 0) {
          const tt02Chunks = (tt02Data as any[]).map(c => ({
            content: c.content,
            document_title: (Array.isArray(c.knowledge_documents) ? c.knowledge_documents[0]?.title : c.knowledge_documents?.title) || 'Thông tư 02/2026/TT-BCT',
            similarity: 0.31, // Cao hơn supplementary threshold — ưu tiên include
            chunk_index: c.chunk_index,
          }));
          supplementaryChunks = [...tt02Chunks, ...supplementaryChunks];
          console.log(`[knowledge-search] Fetched ${tt02Chunks.length} TT02/2026 dedicated chunks`);
        }
      }

      // ── Dedicated fetch cho NĐ 26 Điều 2 khi query về chất độc GHS ───────
      if (needsGHS26) {
        const { data: nd26Data } = await supabaseAdmin
          .from('knowledge_chunks')
          .select('content, chunk_index, knowledge_documents!inner(title, status)')
          .ilike('knowledge_documents.title', '%26/2026%')
          .or('content.ilike.%tiêu chí%,content.ilike.%chất độc%,content.ilike.%GHS%,content.ilike.%Khoản 4%', { foreignTable: 'knowledge_chunks' })
          .order('chunk_index', { ascending: true })
          .limit(5);

        if (nd26Data && nd26Data.length > 0) {
          const nd26Chunks = (nd26Data as any[]).map(c => ({
            content: c.content,
            document_title: (Array.isArray(c.knowledge_documents) ? c.knowledge_documents[0]?.title : c.knowledge_documents?.title) || 'NĐ 26/2026',
            similarity: 0.31,
            chunk_index: c.chunk_index,
          }));
          supplementaryChunks = [...nd26Chunks, ...supplementaryChunks];
          console.log(`[knowledge-search] Fetched ${nd26Chunks.length} NĐ26 GHS-criteria dedicated chunks`);
        }
      }

      const vectorChunks = (!error && data && data.length > 0)
        ? (data as { document_title: string; content: string; similarity: number; chunk_index: number }[])
        : [];

      // Merge: vector results first, then supplementary (dedup by content)
      const seenContent = new Set(vectorChunks.map(c => c.content.slice(0, 50)));
      const uniqueSupp = supplementaryChunks.filter(c => !seenContent.has(c.content.slice(0, 50)));
      const allChunks = [...vectorChunks, ...uniqueSupp].slice(0, matchCount + 5); // Tăng buffer từ +3 → +5

      if (allChunks.length > 0) {
        const context = allChunks
          .map((c) => `[Nguồn: ${c.document_title}]\n${c.content}`)
          .join('\n\n---\n\n');
        return NextResponse.json({
          context,
          chunks: allChunks,
          search_mode: vectorChunks.length > 0 ? 'vector' : 'title_match',
          chunks_found: allChunks.length,
        });
      }
    }


    // Fallback: keyword ILIKE search with relevance ranking
    console.log('[knowledge-search] Using keyword ILIKE search');
    const keywords = extractKeywords(query);

    if (keywords.length === 0) {
      return NextResponse.json({ context: '', chunks: [], search_mode: 'none', chunks_found: 0 });
    }

    // Build OR conditions — also try with original Vietnamese diacritics
    const originalWords = query.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 6);
    const allTerms = Array.from(new Set([...keywords, ...originalWords])).slice(0, 8);
    const orConditions = allTerms.map((k: string) => `content.ilike.%${k}%`).join(',');

    let likeData: KnowledgeChunkRow[] = [];
    if (orConditions) {
      const { data, error } = await supabaseAdmin
        .from('knowledge_chunks')
        .select('id, document_id, chunk_index, content, knowledge_documents!inner(id, title, status)')
        .or(orConditions)
        .limit(20); // Fetch more, then rank and trim

      if (error) {
        console.error('[knowledge-search] ILIKE error:', error);
      } else {
        likeData = (data || []) as KnowledgeChunkRow[];
      }
    }

    if (likeData.length === 0) {
      return NextResponse.json({ context: '', chunks: [], search_mode: 'none', chunks_found: 0 });
    }

    // Rank chunks by relevance score (number of keyword matches)
    const scored = likeData.map(chunk => ({
      chunk,
      score: scoreChunk(chunk.content, keywords),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Take top chunks ranked by relevance score
    const topChunks = scored.slice(0, matchCount).map(s => s.chunk);

    // Normalize to include document_title field
    const structuredChunks = topChunks.map((c: KnowledgeChunkRow) => {
      const docs = c.knowledge_documents;
      const title = Array.isArray(docs) ? docs[0]?.title : docs?.title;
      return { content: c.content, document_title: title || 'Văn bản pháp luật', chunk_index: c.chunk_index };
    });

    const context = structuredChunks
      .map((c) => `[Nguồn: ${c.document_title}]\n${c.content}`)
      .join('\n\n---\n\n');

    console.log(`[knowledge-search] Found ${likeData.length} chunks, returning top ${structuredChunks.length} ranked by score`);

    return NextResponse.json({
      context,
      chunks: structuredChunks,
      search_mode: 'keyword',
      chunks_found: structuredChunks.length,
      keywords_used: keywords,
    });
  } catch (error) {
    console.error('[knowledge-search] Error:', error);
    return NextResponse.json({ context: '', chunks: [], search_mode: 'error', chunks_found: 0 });
  }
}
