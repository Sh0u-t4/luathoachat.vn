import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await getSupabase()
      .from('knowledge_chunks')
      .select('id, chunk_index, content, metadata, created_at')
      .eq('document_id', params.id)
      .order('chunk_index', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ chunks: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
