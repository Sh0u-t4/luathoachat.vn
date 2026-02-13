import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, sessionId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null;

    const { data: downloadLog, error: logError } = await supabase
      .from('document_downloads')
      .insert({
        document_id: documentId,
        session_id: sessionId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging download:', logError);
      return NextResponse.json(
        { error: 'Failed to log download' },
        { status: 500 }
      );
    }

    const { error: countError } = await supabase.rpc('increment_download_count', {
      doc_id: documentId,
    });

    if (countError) {
      console.error('Error incrementing counter:', countError);
    }

    return NextResponse.json({
      success: true,
      downloadId: downloadLog.id,
    });
  } catch (error) {
    console.error('Track download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
