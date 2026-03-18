import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** Official source URLs for each document */
const OFFICIAL_SOURCES: Record<string, { url: string; label: string }> = {
  'Luật 69': {
    url: 'https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=167000',
    label: 'Luật Hóa chất số 69/2025/QH15',
  },
  'NĐ 24': {
    url: 'https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=168001',
    label: 'Nghị định 24/2026/NĐ-CP',
  },
  'NĐ 25': {
    url: 'https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=168002',
    label: 'Nghị định 25/2026/NĐ-CP',
  },
  'NĐ 26': {
    url: 'https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=168003',
    label: 'Nghị định 26/2026/NĐ-CP',
  },
};

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Normalize Vietnamese text for comparison */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\wàáâãèéêìíòóôõùúăđĩũơưạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/g, ' ')
    .trim();
}

/** Extract all Điều content blocks from HTML text */
function extractArticlesFromHTML(html: string): Map<number, string> {
  const articles = new Map<number, string>();

  // Strip HTML tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');

  // Split by article boundaries
  const articleRegex = /Điều\s+(\d+)[a-z]?\.\s+(.+?)(?=Điều\s+\d+[a-z]?\.|$)/gi;
  let match;
  while ((match = articleRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const content = match[2]?.slice(0, 1000).trim() || '';
    if (content.length > 20) articles.set(num, content);
  }

  return articles;
}

/** Compare two normalized strings, return similarity 0-1 */
function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalizeText(a).split(' ').filter(Boolean);
  const nb = normalizeText(b).split(' ').filter(Boolean);
  if (na.length === 0 || nb.length === 0) return 0;

  const setA = new Set(na);
  const setB = new Set(nb);
  let intersection = 0;
  Array.from(setA).forEach(w => { if (setB.has(w)) intersection++; });
  return intersection / Math.max(setA.size, setB.size);
}

/** Fetch content from official source */
async function fetchOfficialContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LegalContentVerifier/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'vi-VN,vi;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/content-verify
 * Body: { doc_key: "NĐ 26", custom_url?: "https://..." }
 *
 * Fetches official source, compares with indexed chunks, returns discrepancies.
 * Use as SUPPLEMENTARY verification — not to replace indexed data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doc_key, custom_url } = body;

    if (!doc_key) {
      return NextResponse.json({ error: 'doc_key required' }, { status: 400 });
    }

    const source = OFFICIAL_SOURCES[doc_key];
    if (!source && !custom_url) {
      return NextResponse.json({
        error: `No official URL configured for "${doc_key}". Pass custom_url.`,
        available_keys: Object.keys(OFFICIAL_SOURCES),
      }, { status: 400 });
    }

    const fetchUrl = custom_url || source.url;
    const supabase = getSupabase();

    // 1. Fetch indexed chunks for this document
    const { data: docs } = await supabase
      .from('knowledge_documents')
      .select('id, title')
      .ilike('title', `%${doc_key}%`);

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: `No indexed document found matching "${doc_key}"` }, { status: 404 });
    }

    const docIds = docs.map(d => d.id);
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, chunk_index, content')
      .in('document_id', docIds)
      .order('chunk_index');

    const indexedChunks = chunks || [];

    // Build indexed article map
    const indexedArticles = new Map<number, string>();
    for (const chunk of indexedChunks) {
      const articleNums = chunk.content.match(/Điều\s+(\d+)/gi) ?? [];
      for (const match of articleNums) {
        const num = parseInt(match.replace(/Điều\s+/i, ''), 10);
        if (!indexedArticles.has(num)) {
          indexedArticles.set(num, chunk.content);
        }
      }
    }

    // 2. Fetch official source
    console.log(`[content-verify] Fetching: ${fetchUrl}`);
    const html = await fetchOfficialContent(fetchUrl);

    if (!html) {
      return NextResponse.json({
        error: 'Could not fetch official source. Site may be unavailable or blocking requests.',
        fetch_url: fetchUrl,
        suggestion: 'You can paste the official text manually using the /api/admin/content-verify-manual endpoint.',
      }, { status: 503 });
    }

    // 3. Extract articles from official source
    const officialArticles = extractArticlesFromHTML(html);

    if (officialArticles.size < 3) {
      return NextResponse.json({
        error: 'Could not parse article structure from official source. HTML structure may differ.',
        hint: 'Try using custom_url with a direct plain-text or better-structured page.',
        official_text_length: html.length,
      }, { status: 422 });
    }

    // 4. Cross-reference: compare each official article vs indexed version
    const discrepancies: Array<{
      article: number;
      status: 'match' | 'mismatch' | 'missing_in_index' | 'extra_in_index';
      similarity?: number;
      official_preview?: string;
      indexed_preview?: string;
    }> = [];

    let matchCount = 0;
    let mismatchCount = 0;
    let missingInIndexCount = 0;

    for (const [artNum, officialText] of Array.from(officialArticles.entries())) {
      const indexedText = indexedArticles.get(artNum);

      if (!indexedText) {
        missingInIndexCount++;
        discrepancies.push({
          article: artNum,
          status: 'missing_in_index',
          official_preview: officialText.slice(0, 150) + '...',
        });
        continue;
      }

      const similarity = textSimilarity(officialText, indexedText);

      if (similarity >= 0.75) {
        matchCount++;
        // Only include mismatches and missing in result for conciseness
      } else {
        mismatchCount++;
        discrepancies.push({
          article: artNum,
          status: 'mismatch',
          similarity: Math.round(similarity * 100) / 100,
          official_preview: officialText.slice(0, 150) + '...',
          indexed_preview: indexedText.slice(0, 150) + '...',
        });
      }
    }

    // Check for articles in index but not in official source
    for (const artNum of Array.from(indexedArticles.keys())) {
      if (!officialArticles.has(artNum)) {
        discrepancies.push({ article: artNum, status: 'extra_in_index' });
      }
    }

    // Sort by article number
    discrepancies.sort((a, b) => a.article - b.article);

    const verificationScore = officialArticles.size > 0
      ? Math.round(matchCount / officialArticles.size * 100)
      : 0;

    return NextResponse.json({
      doc_key,
      document_title: docs[0].title,
      fetch_url: fetchUrl,
      summary: {
        official_articles_found: officialArticles.size,
        indexed_chunks: indexedChunks.length,
        indexed_articles: indexedArticles.size,
        match_count: matchCount,
        mismatch_count: mismatchCount,
        missing_in_index: missingInIndexCount,
        verification_score: verificationScore,
        status: verificationScore >= 80 ? 'verified'
          : verificationScore >= 50 ? 'partial'
          : 'needs_review',
      },
      discrepancies: discrepancies.slice(0, 50), // Cap output
      verified_at: new Date().toISOString(),
      note: 'This is a SUPPLEMENTARY verification. Indexed content from PDF remains the primary source. Discrepancies should be manually reviewed—official site may have updated or reformatted content.',
    });
  } catch (error) {
    console.error('[content-verify] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/admin/content-verify-manual (same endpoint, different action)
 * Allows pasting official text directly for comparison (avoids crawling issues)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { doc_key, official_text } = body;

    if (!doc_key || !official_text) {
      return NextResponse.json({ error: 'doc_key and official_text required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const officialArticles = extractArticlesFromHTML(official_text);

    const { data: docs } = await supabase
      .from('knowledge_documents')
      .select('id, title')
      .ilike('title', `%${doc_key}%`);

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: `No indexed document found matching "${doc_key}"` }, { status: 404 });
    }

    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, chunk_index, content')
      .in('document_id', docs.map(d => d.id));

    const indexedArticles = new Map<number, string>();
    for (const chunk of (chunks || [])) {
      const articleNums = chunk.content.match(/Điều\s+(\d+)/gi) ?? [];
      for (const match of articleNums) {
        const num = parseInt(match.replace(/Điều\s+/i, ''), 10);
        if (!indexedArticles.has(num)) indexedArticles.set(num, chunk.content);
      }
    }

    const discrepancies = [];
    let matchCount = 0;

    for (const [artNum, officialText] of Array.from(officialArticles.entries())) {
      const indexedText = indexedArticles.get(artNum);
      if (!indexedText) {
        discrepancies.push({ article: artNum, status: 'missing_in_index', official_preview: officialText.slice(0, 150) });
        continue;
      }
      const similarity = textSimilarity(officialText, indexedText);
      if (similarity >= 0.75) { matchCount++; }
      else {
        discrepancies.push({
          article: artNum, status: 'mismatch',
          similarity: Math.round(similarity * 100) / 100,
          official_preview: officialText.slice(0, 150),
          indexed_preview: indexedText.slice(0, 150),
        });
      }
    }

    return NextResponse.json({
      doc_key,
      mode: 'manual_paste',
      summary: {
        official_articles_parsed: officialArticles.size,
        match_count: matchCount,
        discrepancy_count: discrepancies.length,
        verification_score: officialArticles.size > 0 ? Math.round(matchCount / officialArticles.size * 100) : 0,
      },
      discrepancies: discrepancies.sort((a, b) => a.article - b.article),
      verified_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** GET: list available document keys and their configured official sources */
export async function GET() {
  return NextResponse.json({
    available_documents: Object.entries(OFFICIAL_SOURCES).map(([key, src]) => ({
      doc_key: key,
      label: src.label,
      official_url: src.url,
    })),
    usage: {
      auto_fetch: 'POST { doc_key: "NĐ 26" }',
      custom_url: 'POST { doc_key: "NĐ 26", custom_url: "https://..." }',
      manual_paste: 'PUT { doc_key: "NĐ 26", official_text: "...full text..." }',
    },
    note: 'Supplementary verification only. PDF-indexed content is the primary source.',
  });
}
