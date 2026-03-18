import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractRequestMeta(req: Request) {
  return {
    userAgent: req.headers.get("user-agent") || "",
    referer: req.headers.get("referer") || "",
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "",
  };
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `# VAI TRO
Ban la Tro ly Phap ly AI chuyen sau ve Luat Hoa chat Viet Nam 2026 cua LuatHoaChat.vn.
Nhiem vu: Tu van phap ly dua tren Luat 69/2025/QH15 va cac Nghi dinh 24, 25, 26/2026/ND-CP.

# GIOI HAN DU LIEU
CHI su dung thong tin trong Context bên duoi. Tuyet doi khong su dung kien thuc ngoai ve luat cu.
Neu khong co thong tin lien quan trong Context, tra loi: "Xin loi, noi dung nay chua co trong co so du lieu hoa chat 2026."

# QUY TAC BAT BUOC
1. CHI SU DUNG thong tin trong Context bên duoi. KHONG bịa dat lieu phap.
2. TRICH DAN NGUON sau moi y: [Nguon: Ten van ban, Dieu X, Khoan Y]
3. Van phong: Chuyen nghiep, chinh xac, ro rang, dung tieng Viet
4. Neu hoa chat bi cam: Nhan manh "CAM TUYET DOI" va trich dan dieu luat cu the

# CAU TRUC TRA LOI (neu co du thong tin)
1. **Phan loai hoa chat** (thuoc Phu luc nao, bi cam/han che khong)
2. **Yeu cau phap ly** (giay phep, khai bao, dieu kien, ho so)
3. **Yeu cau an toan** (luu tru, van chuyen, ung pho su co)
4. **Muc phat vi pham** (neu co thong tin)
5. **Luu y dac biet**

Moi phan PHAI co trich dan nguon [Nguon: ...].`;

// ─── GEMINI: GENERATE ANSWER ──────────────────────────────────────────────────
async function generateAnswer(
  query: string,
  knowledgeContext: string
): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  // Build prompt with context
  let prompt = SYSTEM_PROMPT + "\n\n";

  if (knowledgeContext && knowledgeContext.trim().length > 0) {
    prompt += "# TAI LIEU PHAP LY LIEN QUAN:\n\n";
    prompt += knowledgeContext + "\n\n---\n\n";
  } else {
    prompt +=
      "# TAI LIEU: Khong tim thay thong tin lien quan trong co so du lieu.\n\n";
  }

  prompt += `# CAU HOI:\n${query}\n\nHay tra loi bang tieng Viet, chi tiet, dua tren tai lieu neu tren.`;

  // Try gemini-2.0-flash first (faster, cheaper)
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              topP: 0.8,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[legal-ai-chat] ${model} failed: ${err.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[legal-ai-chat] Generated answer with ${model}`);
        return text;
      }
    } catch (e) {
      console.warn(`[legal-ai-chat] ${model} exception:`, e);
    }
  }

  throw new Error("All Gemini models failed to generate a response");
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
async function logToAnalytics(
  supabase: ReturnType<typeof createClient>,
  entry: {
    sessionId: string;
    query: string;
    response: string;
    source: string;
    timeMs: number;
    success: boolean;
    error?: string;
    meta: { userAgent: string; referer: string; ip: string };
    extraMetadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("chat_analytics").insert({
      session_id: entry.sessionId,
      user_query: entry.query,
      ai_response: entry.response,
      response_source: entry.source,
      response_time_ms: entry.timeMs,
      is_successful: entry.success,
      error_message: entry.error || null,
      user_agent: entry.meta.userAgent || null,
      referer_url: entry.meta.referer || null,
      ip_address: entry.meta.ip || null,
      metadata: entry.extraMetadata || {},
    });
  } catch (e) {
    console.error("[chat_analytics] insert failed:", e);
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const meta = extractRequestMeta(req);
  const sessionId = crypto.randomUUID();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { query, knowledge_context } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return jsonResponse({ error: "Query is required" }, 400);
    }

    console.log(
      `[legal-ai-chat] Query: "${query.slice(0, 80)}", has_context: ${!!(knowledge_context && knowledge_context.trim())}`
    );

    // Use knowledge_context from frontend (already searched by /api/knowledge/search)
    // This avoids needing embedding models in the Edge Function
    const responseText = await generateAnswer(query, knowledge_context || "");

    const responseTimeMs = Date.now() - startTime;
    console.log(`[legal-ai-chat] Done in ${responseTimeMs}ms`);

    await logToAnalytics(supabase, {
      sessionId,
      query,
      response: responseText,
      source: "gemini_rag_keyword",
      timeMs: responseTimeMs,
      success: true,
      meta,
      extraMetadata: {
        has_context: !!(knowledge_context && knowledge_context.trim()),
        context_length: knowledge_context?.length || 0,
      },
    });

    return jsonResponse({
      summary: responseText,
      detailed: responseText,
      citations: [],
      detected_chemicals: [],
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";

    console.error("[legal-ai-chat] Error:", errorMsg);

    try {
      await logToAnalytics(supabase, {
        sessionId,
        query: "unknown",
        response: "",
        source: "error",
        timeMs: responseTimeMs,
        success: false,
        error: errorMsg,
        meta,
      });
    } catch {
      // ignore analytics error
    }

    return jsonResponse(
      {
        summary:
          "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại sau.",
        detailed: "",
        citations: [],
        detected_chemicals: [],
        response_time_ms: responseTimeMs,
        error: errorMsg,
      },
      200
    );
  }
});
