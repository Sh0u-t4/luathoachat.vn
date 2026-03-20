import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering — prevents static data collection at build time
export const dynamic = 'force-dynamic';

// Lazy-init so env vars are available at runtime, not build time
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DEFAULT_CONFIGS = [
  { key: 'ai_system_prompt', value: 'Ban la Tro ly Phap ly AI chuyen sau ve Luat Hoa chat Viet Nam 2026 cua LuatHoaChat.vn.', description: 'System prompt cho AI' },
  { key: 'ai_match_threshold', value: '0.6', description: 'Ngưỡng similarity tối thiểu để lấy chunk (0.0 - 1.0)' },
  { key: 'ai_match_count', value: '5', description: 'Số chunks tối đa lấy từ Knowledge Base' },
  { key: 'ai_temperature', value: '0.3', description: 'Nhiệt độ AI (0 = chính xác, 1 = sáng tạo)' },
  { key: 'ai_max_tokens', value: '3000', description: 'Số token tối đa trong câu trả lời' },
  { key: 'ai_model', value: 'gemini-2.5-pro', description: 'Model AI được sử dụng' },
];

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('system_config')
      .select('key, value, description')
      .in('key', DEFAULT_CONFIGS.map(c => c.key));

    if (error) throw error;

    // Merge with defaults for any missing keys
    const result = DEFAULT_CONFIGS.map(def => {
      const found = (data || []).find((d: {key: string; value: string; description: string}) => d.key === def.key);
      return found || def;
    });

    return NextResponse.json({ configs: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { configs } = await request.json();

    for (const config of configs) {
      await getSupabase()
        .from('system_config')
        .upsert({ key: config.key, value: config.value, description: config.description }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
