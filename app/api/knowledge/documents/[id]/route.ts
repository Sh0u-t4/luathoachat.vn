import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get storage_path before delete
    const { data: doc } = await supabaseAdmin
      .from('knowledge_documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    // Delete from storage if exists
    if (doc?.storage_path) {
      await supabaseAdmin.storage
        .from('knowledge-documents')
        .remove([doc.storage_path]);
    }

    // Delete document (cascades to chunks)
    const { error } = await supabaseAdmin
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
