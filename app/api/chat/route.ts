import { NextRequest } from 'next/server';
import { detectChemicalsInQuery, buildChemicalContext } from '@/lib/chemical-db';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`;

// ── Language detection ─────────────────────────────────────────────────────
function detectLanguage(query: string): 'vi' | 'en' {
  const viDiacritics = (query.match(/[\u00C0-\u024F\u1EA0-\u1EFF]/g) || []).length;
  const ascii = (query.match(/[a-zA-Z]/g) || []).length;
  const total = query.replace(/\s/g, '').length;
  if (total === 0) return 'vi';
  if (viDiacritics === 0 && ascii / total > 0.45) return 'en';
  return 'vi';
}

// ── Scenario type detection ────────────────────────────────────────────────
type ScenarioType = 'kho_chua' | 'nhap_khau' | 'san_xuat' | 'kinh_doanh' | 'su_co' | 'none';

function detectScenario(query: string): ScenarioType {
  const q = query.toLowerCase();
  if (/kho (ch[uứ]a|lưu trữ)|warehouse|storage|bảo quản hóa chất/i.test(q)) return 'kho_chua';
  if (/nhập khẩu|import|mang vào|từ nước ngoài/i.test(q)) return 'nhap_khau';
  if (/sản xuất|nhà máy|xưởng|chế biến|manufacturing|factory/i.test(q)) return 'san_xuat';
  if (/kinh doanh|buôn bán|phân phối|bán lẻ|bán buôn|distribute|trade/i.test(q)) return 'kinh_doanh';
  if (/sự cố|rò rỉ|tràn đổ|cháy nổ|tai nạn|incident|spill|leak/i.test(q)) return 'su_co';
  return 'none';
}

/** Checklist injection for comprehensive scenario coverage */
const SCENARIO_CHECKLISTS: Record<Exclude<ScenarioType, 'none'>, string> = {
  kho_chua: `
[CHECKLIST KHO CHỨA HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện kinh doanh hóa chất (nếu hóa chất thuộc Phụ lục I)
2. Yêu cầu khoảng cách an toàn (Điều khoản khoảng cách kho đến khu dân cư)
3. Yêu cầu PCCC: thiết bị, hệ thống chữa cháy, bình CO2
4. Yêu cầu thông gió, nhiệt độ, độ ẩm kho
5. Nhân sự: người phụ trách kỹ thuật, chứng chỉ an toàn hóa chất
6. Môi trường: Báo cáo đánh giá tác động môi trường (ĐTM) nếu cần
7. Phiếu an toàn hóa chất (SDS) cho từng hoá chất lưu kho
8. Kế hoạch ứng phó sự cố hóa chất`,
  nhap_khau: `
[CHECKLIST NHẬP KHẨU HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. Hóa chất có trong danh mục cấm nhập khẩu không?
2. Hóa chất có thuộc Phụ lục I (cần khai báo/GCN) không?
3. Thủ tục khai báo hóa chất lần đầu với Bộ Công Thương
4. Hồ sơ nhập khẩu: hợp đồng, invoice, SDS, CO, CQ
5. Kiểm tra chất lượng tại cửa khẩu (nếu có yêu cầu)
6. Hóa chất kiểm soát đặc biệt: giấy phép riêng từ từng Bộ
7. Điền khai báo hải quan (mã HS code) chính xác
8. Lưu trữ hồ sơ nhập khẩu tối thiểu 5 năm`,
  san_xuat: `
[CHECKLIST SẢN XUẤT HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện sản xuất hóa chất (Phụ lục I NĐ 24)
2. Yêu cầu cơ sở vật chất: diện tích, vật liệu xây dựng, hệ thống thoát nước
3. Khoảng cách an toàn nhà máy đến khu dân cư/trường học/bệnh viện
4. Nhân sự: trình độ kỹ thuật, chứng chỉ an toàn hóa chất
5. Thiết bị PCCC: hệ thống phun nước, bình chữa cháy, đầu báo khói
6. Đánh giá tác động môi trường (ĐTM) — bắt buộc với cơ sở lớn
7. Kế hoạch ứng phó sự cố hóa chất (phòng ngừa + khắc phục)
8. Giám sát môi trường định kỳ (nước thải, khí thải, đất)`,
  kinh_doanh: `
[CHECKLIST KINH DOANH HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện kinh doanh (Phụ lục I) — từ Sở Công Thương
2. Khai báo hóa chất hàng năm (Phụ lục II) — trước 31/3 mỗi năm
3. Yêu cầu kho bãi: diện tích, khoảng cách an toàn, PCCC
4. Phiếu an toàn hóa chất (SDS) bằng tiếng Việt cho mỗi loại
5. Nhãn hóa chất đúng quy cách (tên, thành phần, cảnh báo)
6. Nhân sự phụ trách kỹ thuật có chứng chỉ an toàn hóa chất
7. Sổ theo dõi xuất nhập kho hóa chất
8. Báo cáo định kỳ theo yêu cầu của cơ quan quản lý`,
  su_co: `
[CHECKLIST SỰ CỐ HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. Nghĩa vụ thông báo sự cố ngay cho cơ quan chức năng (trong bao lâu?)
2. Biện pháp ứng phó ban đầu (cô lập, sơ tán, ngăn lan rộng)
3. Trách nhiệm pháp lý của chủ cơ sở khi xảy ra sự cố
4. Mức phạt vi phạm quy định về phòng ngừa sự cố hóa chất
5. Yêu cầu bồi thường thiệt hại cho người bị ảnh hưởng
6. Báo cáo sau sự cố và kế hoạch khắc phục
7. Trách nhiệm xử lý môi trường bị ô nhiễm`,
};

// ── System instruction ─────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `Bạn là Trợ lý Pháp lý AI của LuatHoaChat.vn, chuyên về Luật Hóa chất Việt Nam (Luật 69/2025, NĐ 24/25/26/2026).

PHẠM VI: Chỉ có dữ liệu về Luật 69/2025 và NĐ 24, 25, 26/2026.

═══ BƯỚC 1: PHÂN LOẠI CÂU HỎI ═══
Loại: tra_cuu_don | liet_ke | so_sanh | phuc_hop | quy_trinh | off_topic

═══ BƯỚC 2: FORMAT PHẢN HỒI ═══
tra_cuu_don: Trả lời trực tiếp, ≤3 câu + [Nguồn: ...].
liet_ke: Numbered list đầy đủ. KHÔNG bỏ sót.
so_sanh: BẮT BUỘC dùng bảng Markdown ≤3 cột. Tối đa 20 từ/ô.
phuc_hop: Chia trường hợp → kết luận.
quy_trinh: Step-by-step có thời gian/chi phí.
off_topic: Giải thích phạm vi + gợi ý 2-3 câu hỏi liên quan.

═══ TRÍCH DẪN ═══
• Chỉ ghi Điều/Khoản khi đoạn trích có số đó. Không suy đoán.
• TUYỆT ĐỐI không viết "Điều chưa xác định".

═══ HÓA CHẤT CỤ THỂ ═══
Nếu có DỮ LIỆU HÓA CHẤT TỪ DATABASE trong prompt → sử dụng NGAY để trả lời dứt khoát về phân loại, không giải thích chung chung.

═══ KIỂM TRA TRƯỚC KHI OUTPUT ═══
☑ Đủ từng phần? ☑ Đủ items? ☑ Có nguồn? ☑ Kết thúc hoàn chỉnh?
Nếu CÓ checklist tình huống trong prompt → bao quát TẤT CẢ mục.

KHÔNG dùng lời chào. Đi thẳng vào nội dung. Hoàn thành toàn bộ câu trả lời.`;

// ── Token budget by question type ─────────────────────────────────────────
function getTokenBudget(query: string, scenario: ScenarioType): number {
  const q = query.toLowerCase();
  const hasScenario = scenario !== 'none';
  if (/so (sánh|sanh)|so với|vs\b|khác nhau/i.test(q)) return hasScenario ? 3000 : 2500;
  if (/đồng thời|vừa.*vừa|kết hợp/i.test(q) || hasScenario) return 3000;
  if (/thủ tục|quy trình|các bước/i.test(q)) return 2500;
  if (/liệt kê|danh sách|các điều kiện/i.test(q)) return 2500;
  return 1800; // Simple lookup
}

// ── Streaming Gemini call ──────────────────────────────────────────────────
async function streamGemini(
  systemInstruction: string,
  userMessage: string,
  maxTokens: number
): Promise<ReadableStream | null> {
  if (!GEMINI_API_KEY) return null;

  const res = await fetch(`${GEMINI_STREAM_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: maxTokens,
        topP: 0.9,
        topK: 40,
      },
    }),
  });

  if (!res.ok || !res.body) {
    console.warn(`[api/chat] Gemini stream failed (${res.status})`);
    return null;
  }

  return res.body;
}

// ── Main handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, knowledge_context } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query required' }), { status: 400 });
    }
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
    }

    // 1. Detect language, scenario, chemicals
    const lang = detectLanguage(query);
    const scenario = detectScenario(query);
    const foundChemicals = detectChemicalsInQuery(query);
    const chemicalContext = buildChemicalContext(foundChemicals);
    const scenarioChecklist = scenario !== 'none' ? SCENARIO_CHECKLISTS[scenario] : '';

    const maxTokens = getTokenBudget(query, scenario);

    // 2. Build language prefix
    const langPrefix = lang === 'en'
      ? '[LANGUAGE: Respond entirely in English. Use [Source: Decree 26/2026, Article 9] for citations.]\n'
      : '';

    // 3. Build user message
    const hasContext = !!(knowledge_context && knowledge_context.trim().length > 0);
    const contextSection = hasContext
      ? `# TÀI LIỆU PHÁP LÝ:\n${knowledge_context}`
      : `# TÀI LIỆU PHÁP LÝ: Không tìm thấy thông tin liên quan.`;

    const userMessage = [
      langPrefix,
      contextSection,
      chemicalContext,  // Chemical DB facts (empty string if no chemicals detected)
      scenarioChecklist, // Scenario checklist (empty string if no scenario)
      `---\n# CÂU HỎI: ${query}`,
    ].filter(Boolean).join('\n\n');

    // 4. Stream response
    const geminiStream = await streamGemini(SYSTEM_INSTRUCTION, userMessage, maxTokens);

    if (!geminiStream) {
      return new Response(JSON.stringify({
        summary: 'Xin lỗi, không thể kết nối AI. Vui lòng thử lại.',
        detailed: '', citations: [], detected_chemicals: [],
        response_time_ms: Date.now() - startTime,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Transform Gemini SSE stream → our streaming format
    const detected = foundChemicals.map(c => c.info.canonicalName);

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = geminiStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const chunk = JSON.parse(jsonStr);
                const token: string = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (token) {
                  fullText += token;
                  // Send token as SSE
                  const payload = JSON.stringify({ token });
                  controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
                }
              } catch { /* malformed chunk, skip */ }
            }
          }

          // Send final metadata
          const responseMeta = JSON.stringify({
            done: true,
            full_text: fullText,
            response_time_ms: Date.now() - startTime,
            language: lang,
            question_type: scenario !== 'none' ? `scenario_${scenario}` : 'general',
            has_context: hasContext,
            detected_chemicals: detected,
            model_used: 'gemini-2.5-flash',
          });
          controller.enqueue(new TextEncoder().encode(`data: ${responseMeta}\n\n`));
        } catch (err) {
          console.error('[api/chat] Stream error:', err);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat] Error:', msg);
    return new Response(JSON.stringify({
      summary: 'Xin lỗi, đã có lỗi kỹ thuật. Vui lòng thử lại.',
      detailed: '', citations: [], detected_chemicals: [], error: msg,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
