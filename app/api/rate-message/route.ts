import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid Next.js static optimization issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 API RATE MESSAGE - POST REQUEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const body = await request.json();
    const { messageId, sessionId, userId, ratingType } = body;

    console.log('📨 Request body:', JSON.stringify({ messageId, sessionId, userId, ratingType }, null, 2));

    // Validation
    if (!messageId || !sessionId || !ratingType) {
      console.error('❌ Validation failed - Missing fields:', {
        messageId: !!messageId,
        sessionId: !!sessionId,
        ratingType: !!ratingType
      });
      return NextResponse.json(
        { error: 'Missing required fields', details: { messageId: !!messageId, sessionId: !!sessionId, ratingType: !!ratingType } },
        { status: 400 }
      );
    }

    if (!['like', 'dislike'].includes(ratingType)) {
      console.error('❌ Validation failed - Invalid rating type:', ratingType);
      return NextResponse.json(
        { error: 'Invalid rating type' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed');

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase config');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const ratingData = {
      message_id: messageId,
      session_id: sessionId,
      user_id: userId || null,
      rating_type: ratingType,
      ip_address: ipAddress,
      user_agent: userAgent,
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Upserting rating to database...');
    console.log('📋 Rating data:', JSON.stringify(ratingData, null, 2));

    // Use Supabase REST API directly instead of SDK to avoid Next.js conflicts
    const supabaseRestUrl = `${supabaseUrl}/rest/v1/message_ratings`;

    console.log('🌐 Making REST request to:', supabaseRestUrl);

    const response = await fetch(supabaseRestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(ratingData),
    });

    console.log('📡 Supabase REST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ SUPABASE REST API ERROR');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json(
        {
          error: 'Failed to save rating',
          details: errorText,
          status: response.status
        },
        { status: 500 }
      );
    }

    const savedRating = await response.json();
    console.log('✅ Database upsert successful!');
    console.log('📦 Saved rating:', JSON.stringify(savedRating, null, 2));

    return NextResponse.json({
      success: true,
      rating: Array.isArray(savedRating) ? savedRating[0] : savedRating,
    });
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ UNEXPECTED ERROR');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const sessionId = searchParams.get('sessionId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
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

    // Get rating for specific message and session
    if (sessionId) {
      const url = `${supabaseUrl}/rest/v1/message_ratings?message_id=eq.${messageId}&session_id=eq.${sessionId}&select=rating_type,created_at`;

      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching rating:', await response.text());
        return NextResponse.json(
          { error: 'Failed to fetch rating' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const rating = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return NextResponse.json({ rating: rating?.rating_type || null });
    }

    // Get rating statistics for message (from materialized view if exists)
    const statsUrl = `${supabaseUrl}/rest/v1/message_rating_stats?message_id=eq.${messageId}`;

    const statsResponse = await fetch(statsUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!statsResponse.ok) {
      console.error('Error fetching rating stats:', await statsResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch rating statistics' },
        { status: 500 }
      );
    }

    const statsData = await statsResponse.json();
    const stats = Array.isArray(statsData) && statsData.length > 0 ? statsData[0] : null;

    return NextResponse.json({ stats: stats || { likes: 0, dislikes: 0, total_ratings: 0 } });
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, sessionId } = body;

    console.log('[Rate Message DELETE] Request:', { messageId, sessionId });

    if (!messageId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Delete using REST API
    const url = `${supabaseUrl}/rest/v1/message_ratings?message_id=eq.${messageId}&session_id=eq.${sessionId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Rate Message DELETE] Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete rating', details: errorText },
        { status: 500 }
      );
    }

    console.log('[Rate Message DELETE] Success');

    return NextResponse.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error: any) {
    console.error('[Rate Message DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
