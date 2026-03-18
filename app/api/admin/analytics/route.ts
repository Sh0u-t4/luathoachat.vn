import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Fetch assistant messages with metadata (batch via single query)
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, content, role, response_time_ms, created_at, metadata')
      .eq('role', 'assistant')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    const msgs = messages || [];

    // Fetch ratings
    const { data: ratings } = await supabase
      .from('message_ratings')
      .select('rating_type, created_at')
      .gte('created_at', since);

    const ratingList = ratings || [];
    const likeCount = ratingList.filter(r => r.rating_type === 'like').length;
    const dislikeCount = ratingList.filter(r => r.rating_type === 'dislike').length;

    // ── Aggregate metrics ─────────────────────────────────────────────────
    const total = msgs.length;
    const avgLatency = total > 0
      ? Math.round(msgs.reduce((s, m) => s + (m.response_time_ms || 0), 0) / total)
      : 0;

    // Question type distribution
    const typeCounts: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};
    let completeCount = 0;
    let truncatedCount = 0;
    let totalCitations = 0;
    let zeroCitationCount = 0;

    const dailyMap: Record<string, number> = {};

    for (const m of msgs) {
      const meta = (m.metadata || {}) as Record<string, unknown>;
      const qt = String(meta.question_type || 'unknown');
      const fmt = String(meta.response_format || 'text');
      typeCounts[qt] = (typeCounts[qt] || 0) + 1;
      formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

      if (meta.response_complete === true) completeCount++;
      else if (meta.response_complete === false) truncatedCount++;

      const cit = Number(meta.citations_count || 0);
      totalCitations += cit;
      if (cit === 0) zeroCitationCount++;

      // Daily breakdown
      const day = m.created_at.slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Alert detection (4.2) ──────────────────────────────────────────────
    const alerts: Array<{ level: 'critical' | 'warning'; message: string }> = [];

    // Check truncated in last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const recentTruncated = msgs.filter(m => {
      const meta = (m.metadata || {}) as Record<string, unknown>;
      return meta.response_complete === false && m.created_at >= oneHourAgo;
    }).length;
    if (recentTruncated >= 3) {
      alerts.push({ level: 'critical', message: `🔴 ${recentTruncated} response bị cắt trong 1 giờ qua — kiểm tra max_tokens` });
    }

    // High latency
    const slowMessages = msgs.filter(m => (m.response_time_ms || 0) > 30000).length;
    if (slowMessages > 0) {
      alerts.push({ level: 'warning', message: `🟡 ${slowMessages} response có latency > 30s — kiểm tra API load` });
    }

    // High off-topic rate
    const offTopicCount = typeCounts['off_topic'] || 0;
    const offTopicRate = total > 0 ? offTopicCount / total : 0;
    if (offTopicRate > 0.2 && total >= 10) {
      alerts.push({ level: 'warning', message: `🟡 ${Math.round(offTopicRate * 100)}% câu hỏi ngoài chủ đề — review UX onboarding` });
    }

    // High zero-citation rate
    const zeroCitationRate = total > 0 ? zeroCitationCount / total : 0;
    if (zeroCitationRate > 0.3 && total >= 10) {
      alerts.push({ level: 'warning', message: `🟡 ${Math.round(zeroCitationRate * 100)}% câu trả lời thiếu citation — review RAG pipeline` });
    }

    // High negative feedback
    const totalRatings = likeCount + dislikeCount;
    const dislikeRate = totalRatings > 0 ? dislikeCount / totalRatings : 0;
    if (dislikeRate > 0.3 && totalRatings >= 5) {
      alerts.push({ level: 'critical', message: `🔴 Tỷ lệ feedback tiêu cực ${Math.round(dislikeRate * 100)}% — review chất lượng AI` });
    }

    return NextResponse.json({
      period_days: days,
      total_responses: total,
      avg_latency_ms: avgLatency,
      response_complete_rate: total > 0 ? Math.round(completeCount / total * 100) : 100,
      response_truncated_count: truncatedCount,
      feedback: {
        like: likeCount,
        dislike: dislikeCount,
        positive_rate: totalRatings > 0 ? Math.round(likeCount / totalRatings * 100) : null,
      },
      question_types: typeCounts,
      response_formats: formatCounts,
      citations: {
        total: totalCitations,
        avg_per_response: total > 0 ? Math.round(totalCitations / total * 10) / 10 : 0,
        zero_citation_count: zeroCitationCount,
        zero_citation_rate: total > 0 ? Math.round(zeroCitationCount / total * 100) : 0,
      },
      daily_activity: daily,
      alerts,
    });
  } catch (error) {
    console.error('[analytics] Error:', error);
    return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 });
  }
}
