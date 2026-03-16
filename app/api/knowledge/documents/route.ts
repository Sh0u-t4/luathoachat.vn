import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: list all documents
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, title, file_name, file_type, file_size, status, chunk_count, error_message, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: create a new document record (before upload)
export async function POST(request: NextRequest) {
  try {
    const { title, file_name, file_type, file_size, uploaded_by } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({ title, file_name, file_type, file_size, uploaded_by, status: 'processing' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
