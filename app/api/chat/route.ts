import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System instruction (Gemini systemInstruction field — separate from the user turn)
const SYSTEM_INSTRUCTION = `Bạn là Trợ lý Pháp lý AI của LuatHoaChat.vn, chuyên về Luật Hóa chất Việt Nam (Luật 69/2025, Nghị định 24, 25, 26/2026).

NGUYÊN TẮC XỬ LÝ CÂU HỎI:

**Loại 1 — Câu hỏi pháp lý hóa chất, có tài liệu trong phần TÀI LIỆU PHÁP LÝ:**
- Ưu tiên trả lời từ tài liệu được cung cấp.
- TRÍCH DẪN NGUỒN sau mỗi ý theo định dạng cuối câu: [Nguồn: Tên văn bản, Điều X, Khoản Y]
- QUY TẮC TRÍCH DẪN QUAN TRỌNG:
  + Chỉ ghi số Điều/Khoản khi đoạn trích có ghi rõ số đó (ví dụ: "Điều 15", "khoản 2").
  + Nếu đoạn trích không nêu số điều cụ thể, chỉ ghi: [Nguồn: Tên văn bản].
  + TUYỆT ĐỐI không viết "Điều chưa xác định", "Điều không rõ", hay bất kỳ placeholder nào.
  + Tên văn bản phải dùng đúng tên trong phần TÀI LIỆU PHÁP LÝ.
- Cấu trúc: Phân loại pháp lý → Yêu cầu → An toàn → Mức phạt → Lưu ý.

**Loại 2 — CÂU HỎI SO SÁNH giữa các văn bản (NĐ 24 vs NĐ 25 vs NĐ 26...):**
- BẮT BUỘC sử dụng bảng Markdown để trình bày so sánh, theo định dạng:
  | Tiêu chí | Văn bản A | Văn bản B |
  |---|---|---|
  | Nội dung | ... | ... |
- Sau bảng, thêm phần nhận xét tổng hợp (2-3 câu) về điểm khác biệt quan trọng nhất.
- Trích dẫn nguồn từng dòng bảng nếu có thể xác định chính xác.

**Loại 3 — CÂU HỎI PHỨC HỢP (nhiều điều kiện kết hợp):**
- Phân tách rõ từng điều kiện thành danh sách con.
- Xác định ĐK nào độc lập / ĐK nào bổ sung / ĐK nào loại trừ nhau.
- Nếu câu trả lời khác nhau theo tình huống, sử dụng format: "**Trường hợp A:** ... / **Trường hợp B:** ..."
- Kết luận hành động cụ thể cần làm.

**Loại 4 — Câu hỏi pháp lý hóa chất, KHÔNG có tài liệu liên quan:**
- Trả lời dựa trên kiến thức chung về pháp luật hóa chất Việt Nam.
- Ghi chú cuối: *(Lưu ý: câu trả lời dựa trên kiến thức chung, vui lòng đối chiếu với văn bản pháp luật chính thức.)*
- KHÔNG từ chối hoàn toàn — hãy cố gắng cung cấp thông tin hữu ích nhất có thể.

**Loại 5 — Câu hỏi ngoài lĩnh vực / chào hỏi:**
- Trả lời tự nhiên, thân thiện.
- Nếu hoàn toàn không liên quan đến hóa chất/pháp luật, giải thích phạm vi hỗ trợ và gợi ý câu hỏi phù hợp.

ĐỊNH DẠNG CHUNG:
- Dùng **in đậm** cho thuật ngữ pháp lý quan trọng.
- Dùng danh sách (- hoặc 1. 2. 3.) cho các bước/yêu cầu nhiều mục.
- Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp. KHÔNG dùng lời chào/mở đầu xã giao.`;


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
            maxOutputTokens: 4096,
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
