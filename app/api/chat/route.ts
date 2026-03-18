import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

// ── System instruction ──────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `Bạn là Trợ lý Pháp lý AI của LuatHoaChat.vn, chuyên về Luật Hóa chất Việt Nam (Luật 69/2025, Nghị định 24, 25, 26/2026).
PHẠM VI: Chỉ có dữ liệu về Luật 69/2025 và NĐ 24, 25, 26/2026. Không có dữ liệu về Thông tư, Quyết định hay văn bản khác.

═══════════════════════════════════════════════════════════
BƯỚC 1 — PHÂN LOẠI CÂU HỎI
═══════════════════════════════════════════════════════════
Xác định loại: tra_cuu_don | liet_ke | so_sanh | phuc_hop | quy_trinh | off_topic

═══════════════════════════════════════════════════════════
BƯỚC 2 — ÁP DỤNG FORMAT TƯƠNG ỨNG
═══════════════════════════════════════════════════════════

**tra_cuu_don:** Trả lời trực tiếp, tối đa 3 câu + [Nguồn: ...].

**liet_ke:** Numbered list đầy đủ. KHÔNG bỏ sót điều kiện nào.
1. **Tên điều kiện:** Nội dung. [Nguồn: ...]
2. ...

**so_sanh:** BẮT BUỘC dùng bảng Markdown. Không bỏ trống — nếu thiếu → "Chưa quy định cụ thể".
| Tiêu chí | Đối tượng A | Đối tượng B |
|---|---|---|
| TC1 | ≤30 từ | ≤30 từ |
**Nhận xét:** 2-3 điểm khác biệt chính.

**phuc_hop:** Chia trường hợp rõ ràng:
**Trường hợp 1 — [Mô tả]:** [Nội dung + nguồn]
**Trường hợp 2 — [Mô tả]:** [Nội dung + nguồn]
→ **Kết luận:** [Hành động cần làm]

**quy_trinh:** Step-by-step với thời gian/chi phí nếu có:
**Bước 1 →** [Hành động] (Hồ sơ: ...)
**Bước 2 →** [Hành động] (Thời gian: ...)

**off_topic:** "Câu hỏi nằm ngoài phạm vi tư vấn hóa chất. Bạn có thể hỏi về [2-3 gợi ý liên quan]."

═══════════════════════════════════════════════════════════
QUY TẮC TRÍCH DẪN
═══════════════════════════════════════════════════════════
• Chỉ ghi Điều/Khoản khi đoạn trích có ghi rõ số đó.
• Không xác định được → chỉ ghi [Nguồn: Tên văn bản].
• TUYỆT ĐỐI không viết "Điều chưa xác định" hay placeholder.

═══════════════════════════════════════════════════════════
BƯỚC 3 — XỬ LÝ EDGE CASES
═══════════════════════════════════════════════════════════

**Sai tên văn bản:** Nếu user hỏi về "NĐ 25" nhưng nội dung liên quan đến "NĐ 26":
→ Trả lời theo đúng văn bản liên quan + ghi chú: "Lưu ý: Nội dung này được quy định tại **NĐ 26/2026**, không phải NĐ 25/2026. NĐ 25 quy định về [X], NĐ 26 quy định về [Y]."

**Thông tin mâu thuẫn trong câu hỏi:** Nếu câu hỏi chứa điều kiện mâu thuẫn nhau:
→ Chỉ ra mâu thuẫn: "Câu hỏi có điểm mâu thuẫn: [A] và [B] không thể đồng thời xảy ra. Bạn muốn hỏi theo trường hợp nào?"

**Ngoài phạm vi dữ liệu:** Nếu câu hỏi liên quan đến Thông tư, Quyết định, hoặc văn bản khác:
→ "Câu hỏi này liên quan đến [Thông tư X], hiện tôi chỉ có dữ liệu về Luật 69/2025 và NĐ 24/25/26. Theo các văn bản này, [trả lời phần có thể]. Để tra cứu [Thông tư X], bạn có thể tham khảo thuvienphapluat.vn."

**Điều khoản chuyển tiếp:** Khi trả lời về GCN/giấy phép cũ đang còn hiệu lực:
→ Highlight: "⚠️ **Điều khoản chuyển tiếp:** [Nội dung] có hiệu lực từ [ngày]. GCN/giấy phép đã cấp theo quy định cũ [tiếp tục hiệu lực / hết hiệu lực từ ngày...]. [Nguồn: ...]"

═══════════════════════════════════════════════════════════
BƯỚC 4 — TỰ KIỂM TRA TRƯỚC KHI OUTPUT
═══════════════════════════════════════════════════════════
☑ Câu hỏi nhiều phần → đã trả lời ĐỦ từng phần?
☑ Yêu cầu liệt kê → đã liệt kê TẤT CẢ items (không bỏ sót)?
☑ Mọi thông tin pháp lý đều có [Nguồn: Điều X, Khoản Y]?
☑ Không có nguồn nào ghi "chưa xác định" hay placeholder?
☑ Response kết thúc hoàn chỉnh (không bị cắt giữa chừng)?
☑ Đúng format cho loại câu hỏi đã phân loại?
Nếu KHÔNG đạt → bổ sung trước khi kết thúc.

QUAN TRỌNG: Hoàn thành toàn bộ, ưu tiên kết thúc câu hoàn chỉnh. KHÔNG dùng lời chào mở đầu.`;

// ── Multi-query generator ───────────────────────────────────────────────────
/** For complex/comparison questions, generate 2-3 focused sub-queries */
async function generateSubQueries(query: string, type: string): Promise<string[]> {
  if (!GEMINI_API_KEY) return [query];
  if (type !== 'complex' && type !== 'compare') return [query];

  try {
    const prompt = type === 'compare'
      ? `Câu hỏi so sánh: "${query}"\nTách thành 2-3 sub-query đơn để tìm kiếm từng đối tượng riêng. Chỉ liệt kê sub-queries, mỗi dòng 1 câu, không giải thích thêm:`
      : `Câu hỏi phức hợp: "${query}"\nTách thành 2-3 sub-query đơn để tìm kiếm từng điều kiện riêng. Chỉ liệt kê sub-queries, mỗi dòng 1 câu, không giải thích thêm:`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    });

    if (!res.ok) return [query];
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const lines = text.split('\n').map((l: string) => l.replace(/^[-•\d.]\s*/, '').trim()).filter((l: string) => l.length > 10);
    return lines.length >= 2 ? [query, ...lines.slice(0, 2)] : [query];
  } catch {
    return [query];
  }
}

// ── Question classifier ─────────────────────────────────────────────────────
type QuestionType = 'simple' | 'list' | 'compare' | 'complex' | 'process';

interface QuestionProfile {
  type: QuestionType;
  maxTokens: number;
  contextLimit: number;
  topK: number;            // How many chunks to retrieve
  useMultiQuery: boolean;  // Whether to do multi-query retrieval
}

function classifyQuestion(query: string): QuestionProfile {
  const q = query.toLowerCase();

  if (/so (sánh|sanh)|khác (nhau|biệt)|phân biệt|vs\b|versus|giữa.*và.*khác|so với/i.test(q)) {
    return { type: 'compare', maxTokens: 6000, contextLimit: 12000, topK: 10, useMultiQuery: true };
  }

  if (/(đồng thời|kết hợp|cùng lúc|cả.*lẫn|nhiều loại|bao gồm cả|mà còn|vừa.*vừa)/i.test(q) ||
    (q.match(/và/g) || []).length >= 2) {
    return { type: 'complex', maxTokens: 5000, contextLimit: 10000, topK: 12, useMultiQuery: true };
  }

  if (/(thủ tục|quy trình|hồ sơ|bước|steps?|nộp.*đâu|xin cấp|đăng ký|cấp phép)/i.test(q)) {
    return { type: 'process', maxTokens: 4000, contextLimit: 8000, topK: 8, useMultiQuery: false };
  }

  if (/(liệt kê|liệt ke|các điều kiện|điều kiện để|danh sách|cần những gì|yêu cầu|gồm những)/i.test(q)) {
    return { type: 'list', maxTokens: 4096, contextLimit: 9000, topK: 8, useMultiQuery: false };
  }

  if (/(là gì|có phải|có không|xin chào|chào|hello|hi\b)/i.test(q) && q.length < 80) {
    return { type: 'simple', maxTokens: 1500, contextLimit: 4000, topK: 3, useMultiQuery: false };
  }

  return { type: 'list', maxTokens: 3500, contextLimit: 7000, topK: 6, useMultiQuery: false };
}

// ── Context builder ─────────────────────────────────────────────────────────
function extractArticleHint(text: string): string {
  const m = text.match(/Điều\s+(\d+[a-z]?)/i);
  return m ? ` | ${m[0]}` : '';
}

function buildContext(
  chunks: Array<{ content: string; document_title?: string }>,
  charLimit: number
): string {
  if (!chunks || chunks.length === 0) return '';

  const sections = chunks.map((c) => {
    const title = c.document_title || 'Văn bản pháp luật';
    const articleHint = extractArticleHint(c.content);
    return `[Nguồn: ${title}${articleHint}]\n${c.content.trim()}`;
  }).join('\n\n---\n\n');

  return sections.length > charLimit ? sections.slice(0, charLimit) + '\n...[Đoạn trích rút gọn]' : sections;
}

// ── Truncation detector ─────────────────────────────────────────────────────
function isResponseTruncated(text: string): boolean {
  if (!text || text.length < 50) return false;
  const trimmed = text.trimEnd();
  return !/[.!?。）\]）。]$/.test(trimmed) && trimmed.length > 150;
}

// ── Gemini call helper ──────────────────────────────────────────────────────
async function callGemini(
  systemInstruction: string,
  userMessage: string,
  maxTokens: number
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: maxTokens, topP: 0.9, topK: 40 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`[api/chat] Gemini failed (${res.status}): ${err.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

// ── Search helper (internal call to search route) ───────────────────────────
async function searchChunks(
  query: string,
  topK: number,
  baseUrl: string
): Promise<Array<{ content: string; document_title: string }>> {
  try {
    const res = await fetch(`${baseUrl}/api/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.chunks || []) as Array<{ content: string; document_title: string }>;
  } catch {
    return [];
  }
}

/** Deduplicate chunks by content fingerprint */
function deduplicateChunks(
  chunks: Array<{ content: string; document_title: string }>
): typeof chunks {
  const seen = new Set<string>();
  return chunks.filter((c) => {
    const key = c.content.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, knowledge_context, chunks: inputChunks } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // 1. Classify question
    const profile = classifyQuestion(query);
    console.log(`[api/chat] type=${profile.type} maxTokens=${profile.maxTokens} topK=${profile.topK} multiQuery=${profile.useMultiQuery}`);

    // 2. Multi-query retrieval for complex/compare questions
    let allChunks: Array<{ content: string; document_title: string }> = inputChunks || [];

    if (profile.useMultiQuery && request.url) {
      const baseUrl = new URL(request.url).origin;
      const subQueries = await generateSubQueries(query, profile.type);
      console.log(`[api/chat] Multi-query: ${subQueries.length} queries:`, subQueries.map((q: string) => q.slice(0, 60)));

      const subResults = await Promise.all(
        subQueries.map((q: string) => searchChunks(q, Math.ceil(profile.topK / subQueries.length) + 2, baseUrl))
      );

      const merged = subResults.flat();
      allChunks = deduplicateChunks([...allChunks, ...merged]);
      console.log(`[api/chat] Multi-query merged ${allChunks.length} unique chunks`);
    }

    // 3. Build trimmed context with metadata hints
    const useChunks = allChunks.length > 0 ? allChunks : [];
    let context = buildContext(useChunks, profile.contextLimit);

    // Fallback to raw knowledge_context if no structured chunks
    if (!context && knowledge_context) {
      context = knowledge_context.length > profile.contextLimit
        ? knowledge_context.slice(0, profile.contextLimit) + '\n...[rút gọn]'
        : knowledge_context;
    }

    const hasContext = context.length > 0;

    const userMessage = hasContext
      ? `# TÀI LIỆU PHÁP LÝ LIÊN QUAN:\n\n${context}\n\n---\n\n# CÂU HỎI (Loại: ${profile.type}):\n${query}`
      : `# TÀI LIỆU PHÁP LÝ: Không tìm thấy thông tin liên quan.\n\n# CÂU HỎI (Loại: ${profile.type}):\n${query}`;

    // 4. Primary Gemini call
    let text = await callGemini(SYSTEM_INSTRUCTION, userMessage, profile.maxTokens);

    if (!text) {
      return NextResponse.json({
        summary: 'Xin lỗi, không thể kết nối AI. Vui lòng thử lại.',
        detailed: '', citations: [], detected_chemicals: [],
        response_time_ms: Date.now() - startTime, error: 'model_failed',
      }, { status: 200 });
    }

    // 5. Truncation detection + continuation
    if (isResponseTruncated(text)) {
      console.warn(`[api/chat] Truncated (${text.length} chars), attempting continuation...`);

      const continuation = await callGemini(
        'Bạn là trợ lý pháp lý. Tiếp tục hoàn thành câu trả lời bị cắt. Chỉ viết phần còn thiếu, không lặp lại.',
        `${userMessage}\n\n# CÂU TRẢ LỜI CẦN TIẾP TỤC:\n${text}\n\n# YÊU CẦU: Tiếp tục ngay từ điểm bị ngắt.`,
        Math.min(2048, profile.maxTokens)
      );

      if (continuation && continuation.trim().length > 20) {
        text = text + '\n' + continuation;
        console.log(`[api/chat] Continuation: +${continuation.length} chars`);
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`[api/chat] Done ${responseTime}ms | type=${profile.type} | chars=${text.length} | chunks=${allChunks.length}`);

    return NextResponse.json({
      summary: text,
      detailed: text,
      citations: [],
      detected_chemicals: [],
      response_time_ms: responseTime,
      model_used: 'gemini-2.5-flash',
      has_context: hasContext,
      question_type: profile.type,
      chunks_used: allChunks.length,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat] Error:', msg);
    return NextResponse.json({
      summary: 'Xin lỗi, đã có lỗi kỹ thuật. Vui lòng thử lại.',
      detailed: '', citations: [], detected_chemicals: [], error: msg,
    }, { status: 200 });
  }
}
