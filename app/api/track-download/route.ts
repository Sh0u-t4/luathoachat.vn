import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null;

    // Insert download log using REST API
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/document_downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        document_id: documentId,
        session_id: sessionId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      }),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Error logging download:', errorText);
      return NextResponse.json(
        { error: 'Failed to log download' },
        { status: 500 }
      );
    }

    const downloadLog = await insertResponse.json();
    const downloadId = Array.isArray(downloadLog) ? downloadLog[0]?.id : downloadLog?.id;

    // Increment download counter using RPC
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_download_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ doc_id: documentId }),
    });

    if (!rpcResponse.ok) {
      console.error('Error incrementing counter:', await rpcResponse.text());
    }

    return NextResponse.json({
      success: true,
      downloadId,
    });
  } catch (error) {
    console.error('Track download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
