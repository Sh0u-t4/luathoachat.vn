import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Expected article ranges per document (update as needed)
const EXPECTED_ARTICLES: Record<string, { start: number; end: number; alias: string[] }> = {
  'Luật 69': { start: 1, end: 120, alias: ['luật 69', 'luật hóa chất 69', '69/2025'] },
  'NĐ 24': { start: 1, end: 60, alias: ['nghị định 24', 'nđ 24', 'nd 24', '24/2026'] },
  'NĐ 25': { start: 1, end: 50, alias: ['nghị định 25', 'nđ 25', 'nd 25', '25/2026'] },
  'NĐ 26': { start: 1, end: 80, alias: ['nghị định 26', 'nđ 26', 'nd 26', '26/2026'] },
};

function detectDocumentKey(title: string): string | null {
  const t = title.toLowerCase();
  for (const [key, cfg] of Object.entries(EXPECTED_ARTICLES)) {
    if (cfg.alias.some(a => t.includes(a))) return key;
  }
  return null;
}

/** Extract all article numbers (Điều X) from text */
function extractArticles(text: string): number[] {
  const matches = text.match(/Điều\s+(\d+)/gi) ?? [];
  return matches.map(m => parseInt(m.replace(/Điều\s+/i, ''), 10)).filter(n => !isNaN(n));
}

/** Quality checks on a chunk */
function checkChunkQuality(content: string): string[] {
  const issues: string[] = [];
  if (content.length < 150) issues.push('chunk_too_short');
  if (content.length > 3000) issues.push('chunk_too_long');
  if (/\?\?\?|â€|Ã¢/.test(content)) issues.push('encoding_error');
  if (/Điều\s+$/.test(content.trim()) || content.endsWith('khoản')) issues.push('cut_mid_article');
  if ((content.match(/Điều\s+\d+/gi) ?? []).length > 8) issues.push('too_many_articles_in_chunk');
  return issues;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Fetch all documents with their chunks
    const { data: documents, error: docError } = await supabase
      .from('knowledge_documents')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: true });

    if (docError) throw docError;

    const { data: chunks, error: chunkError } = await supabase
      .from('knowledge_chunks')
      .select('id, document_id, chunk_index, content')
      .order('chunk_index', { ascending: true });

    if (chunkError) throw chunkError;

    const allChunks = chunks || [];
    const allDocs = documents || [];

    // Group chunks by document
    const chunksByDoc: Record<string, typeof allChunks> = {};
    for (const chunk of allChunks) {
      if (!chunksByDoc[chunk.document_id]) chunksByDoc[chunk.document_id] = [];
      chunksByDoc[chunk.document_id].push(chunk);
    }

    // Audit each document
    const docAudits = allDocs.map(doc => {
      const docChunks = chunksByDoc[doc.id] || [];
      const docKey = detectDocumentKey(doc.title);
      const expected = docKey ? EXPECTED_ARTICLES[docKey] : null;

      // Collect all article numbers found in this document's chunks
      const foundArticles = new Set<number>();
      const qualityIssues: Array<{ chunk_index: number; issues: string[] }> = [];
      let totalChars = 0;
      let encodingErrors = 0;

      for (const chunk of docChunks) {
        totalChars += chunk.content.length;
        const arts = extractArticles(chunk.content);
        arts.forEach(a => foundArticles.add(a));

        const issues = checkChunkQuality(chunk.content);
        if (issues.length > 0) {
          qualityIssues.push({ chunk_index: chunk.chunk_index, issues });
          if (issues.includes('encoding_error')) encodingErrors++;
        }
      }

      // Find missing articles
      const missingArticles: number[] = [];
      if (expected) {
        for (let i = expected.start; i <= expected.end; i++) {
          if (!foundArticles.has(i)) missingArticles.push(i);
        }
      }

      const coverageRate = expected
        ? Math.round((foundArticles.size / (expected.end - expected.start + 1)) * 100)
        : null;

      const avgChunkSize = docChunks.length > 0 ? Math.round(totalChars / docChunks.length) : 0;

      return {
        document_id: doc.id,
        title: doc.title,
        status: doc.status,
        doc_key: docKey,
        chunk_count: docChunks.length,
        total_chars: totalChars,
        avg_chunk_size: avgChunkSize,
        articles_found: Array.from(foundArticles).sort((a, b) => a - b),
        articles_found_count: foundArticles.size,
        expected_range: expected ? `Điều ${expected.start}–${expected.end}` : 'Chưa cấu hình',
        missing_articles: missingArticles,
        missing_count: missingArticles.length,
        coverage_rate: coverageRate,
        quality_issues: qualityIssues,
        quality_issue_count: qualityIssues.length,
        encoding_errors: encodingErrors,
        health: encodingErrors > 0 ? 'error'
          : missingArticles.length > 10 ? 'warning'
          : qualityIssues.length > 5 ? 'warning'
          : 'good',
      };
    });

    // Overall summary
    const totalChunks = allChunks.length;
    const totalDocs = allDocs.length;
    const docsWithIssues = docAudits.filter(d => d.health !== 'good').length;
    const avgCoverage = docAudits
      .filter(d => d.coverage_rate !== null)
      .reduce((s, d) => s + (d.coverage_rate ?? 0), 0) / Math.max(1, docAudits.filter(d => d.coverage_rate !== null).length);

    // Find most problematic articles across all documents
    const allMissing = docAudits.flatMap(d =>
      d.missing_articles.slice(0, 10).map(a => `${d.doc_key ?? d.title}: Điều ${a}`)
    ).slice(0, 20);

    return NextResponse.json({
      summary: {
        total_documents: totalDocs,
        total_chunks: totalChunks,
        docs_with_issues: docsWithIssues,
        avg_coverage_rate: Math.round(avgCoverage),
        overall_health: docsWithIssues === 0 ? 'good' : docsWithIssues <= 1 ? 'warning' : 'error',
      },
      documents: docAudits,
      top_missing_articles: allMissing,
      audited_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[knowledge-audit] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
