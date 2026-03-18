import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/knowledge/reprocess-all
 * Finds all documents with 0 chunks (status=ready or status=error)
 * and re-triggers the process endpoint for each one.
 * 
 * Body: { force?: boolean } — if true, reprocess ALL docs regardless of chunk_count
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    // Find documents that need reprocessing
    let query = supabaseAdmin
      .from('knowledge_documents')
      .select('id, title, file_type, storage_path, status, chunk_count')
      .order('created_at', { ascending: true });

    if (!force) {
      // Only find docs with 0 chunks or error status
      query = query.or('chunk_count.eq.0,status.eq.error');
    }

    const { data: docs, error: fetchErr } = await query;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json({ message: 'No documents need reprocessing', count: 0 });
    }

    console.log(`[reprocess-all] Found ${docs.length} documents to reprocess`);

    const results = [];
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    for (const doc of docs) {
      console.log(`[reprocess-all] Queueing: ${doc.title} (${doc.id})`);

      // Reset status to processing and clear existing chunks
      await supabaseAdmin
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', doc.id);

      await supabaseAdmin
        .from('knowledge_documents')
        .update({ status: 'processing', chunk_count: 0, error_message: null })
        .eq('id', doc.id);

      // Trigger process endpoint
      try {
        const processRes = await fetch(`${baseUrl}/api/knowledge/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass service role key for internal call auth
            'x-internal-key': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          },
          body: JSON.stringify({
            document_id: doc.id,
            file_type: doc.file_type,
            storage_path: doc.storage_path,
          }),
        });

        const result = await processRes.json();
        results.push({
          id: doc.id,
          title: doc.title,
          success: processRes.ok,
          chunks_created: result.chunks_created ?? 0,
          error: result.error ?? null,
        });

        console.log(`[reprocess-all] ${doc.title}: ${result.chunks_created ?? 0} chunks created`);

        // Wait 2 seconds between documents to avoid overwhelming Gemini API
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        results.push({ id: doc.id, title: doc.title, success: false, error: msg });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + (r.chunks_created || 0), 0);

    return NextResponse.json({
      success: true,
      processed: docs.length,
      succeeded,
      failed: docs.length - succeeded,
      total_chunks_created: totalChunks,
      results,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reprocess-all] Fatal:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
