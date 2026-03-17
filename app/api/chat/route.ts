import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System instruction (Gemini systemInstruction field — separate from the user turn)
const SYSTEM_INSTRUCTION = `Bạn là Trợ lý Pháp lý AI chuyên về Luật Hóa chất Việt Nam 2026 của LuatHoaChat.vn.

NGUYÊN TẮC BẮT BUỘC:
1. CHỈ trả lời dựa trên thông tin trong phần "TÀI LIỆU PHÁP LÝ" được cung cấp.
2. KHÔNG bịa đặt điều luật, không dùng kiến thức ngoài tài liệu.
3. TRÍCH DẪN NGUỒN sau mỗi ý chính: [Nguồn: Tên văn bản, Điều X, Khoản Y]
4. Nếu không có tài liệu liên quan → trả lời: "Xin lỗi, nội dung này chưa có trong cơ sở dữ liệu Luật Hóa chất 2026."
5. Trả lời bằng tiếng Việt, chuyên nghiệp, rõ ràng.

CẤU TRÚC TRẢ LỜI (khi có đủ thông tin):
- **Phân loại pháp lý**: thuộc nhóm/phụ lục nào, bị cấm hay hạn chế
- **Yêu cầu pháp lý**: giấy phép, khai báo, điều kiện, hồ sơ
- **Yêu cầu an toàn**: lưu trữ, vận chuyển, ứng phó sự cố  
- **Mức phạt vi phạm**: nếu có trong tài liệu
- **Lưu ý đặc biệt**: các điểm quan trọng cần chú ý`;

export async function POST(request: NextRequest) {
  try {
    const { query, knowledge_context } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Build the user message with context embedded
    const hasContext = knowledge_context && knowledge_context.trim().length > 0;

    const userMessage = hasContext
      ? `# TÀI LIỆU PHÁP LÝ LIÊN QUAN:\n\n${knowledge_context}\n\n---\n\n# CÂU HỎI CỦA NGƯỜI DÙNG:\n${query}`
      : `# TÀI LIỆU PHÁP LÝ: Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.\n\n# CÂU HỎI CỦA NGƯỜI DÙNG:\n${query}`;

    const startTime = Date.now();

    // Gemini API with proper system instruction    // Use gemini-2.5-flash (2.0 and 1.5 are deprecated/unavailable for this API key)
    const models = ['gemini-2.5-flash'];

    for (const model of models) {
      try {
        const requestBody = {
          // System instruction is separate from user conversation
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          // User message contains context + question
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.15,       // Thấp hơn = chính xác hơn, ít sáng tạo hơn
            maxOutputTokens: 2048,
            topP: 0.9,
            topK: 40,
          },
        };

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[api/chat] ${model} failed (${res.status}): ${errText.slice(0, 200)}`);
          continue;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          const responseTime = Date.now() - startTime;
          console.log(`[api/chat] ${model} answered in ${responseTime}ms, context_chars=${knowledge_context?.length || 0}`);

          return NextResponse.json({
            summary: text,
            detailed: text,
            citations: [],
            detected_chemicals: [],
            response_time_ms: responseTime,
            model_used: model,
            has_context: hasContext,
          });
        }
      } catch (e) {
        console.warn(`[api/chat] ${model} exception:`, e);
      }
    }

    return NextResponse.json(
      {
        summary: 'Xin lỗi, không thể kết nối đến AI. Vui lòng thử lại sau.',
        detailed: '',
        citations: [],
        detected_chemicals: [],
        response_time_ms: Date.now() - startTime,
        error: 'all_models_failed',
      },
      { status: 200 } // Return 200 so frontend shows the error message gracefully
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat] Error:', msg);
    return NextResponse.json({
      summary: 'Xin lỗi, đã có lỗi kỹ thuật. Vui lòng thử lại.',
      detailed: '',
      citations: [],
      detected_chemicals: [],
      error: msg,
    }, { status: 200 });
  }
}
