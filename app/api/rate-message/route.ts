import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, sessionId, userId, ratingType } = body;

    // Validation
    if (!messageId || !sessionId || !ratingType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['like', 'dislike'].includes(ratingType)) {
      return NextResponse.json(
        { error: 'Invalid rating type' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Upsert rating (update if exists, insert if not)
    const { data: rating, error: ratingError } = await supabase
      .from('message_ratings')
      .upsert(
        {
          message_id: messageId,
          session_id: sessionId,
          user_id: userId || null,
          rating_type: ratingType,
          ip_address: ipAddress,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'message_id,session_id',
        }
      )
      .select()
      .single();

    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rating: rating,
    });
  } catch (error) {
    console.error('Rate message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get rating for specific message and session
    if (sessionId) {
      const { data, error } = await supabase
        .from('message_ratings')
        .select('rating_type, created_at')
        .eq('message_id', messageId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching rating:', error);
        return NextResponse.json(
          { error: 'Failed to fetch rating' },
          { status: 500 }
        );
      }

      return NextResponse.json({ rating: data });
    }

    // Get rating statistics for message
    const { data: stats, error: statsError } = await supabase
      .from('message_rating_stats')
      .select('*')
      .eq('message_id', messageId)
      .maybeSingle();

    if (statsError) {
      console.error('Error fetching rating stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch rating statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats: stats || { likes: 0, dislikes: 0, total_ratings: 0 } });
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
