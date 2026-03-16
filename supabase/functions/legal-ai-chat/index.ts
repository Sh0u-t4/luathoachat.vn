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
Neu khong co thong tin, tra loi: "Xin loi, noi dung nay chua co trong co so du lieu hoa chat 2026."

# QUY TAC BAT BUOC
1. CHI SU DUNG thong tin trong Context bên duoi
2. TRICH DAN NGUON sau moi y: [Nguon: Ten van ban, Dieu X, Khoan Y]
3. Van phong: Chuyen nghiep, chinh xac, ro rang
4. Neu hoa chat bi cam: Nhan manh "CAM TUYET DOI" va trich dan dieu luat cu the

# CAU TRUC TRA LOI
1. **Phan loai hoa chat** (thuoc Phu luc nao, bi cam/han che khong)
2. **Yeu cau phap ly** (giay phep, khai bao, dieu kien)
3. **Yeu cau an toan** (luu tru, van chuyen, ung pho su co)
4. **Muc phat vi pham** (neu co thong tin)
5. **Luu y dac biet**

Moi phan PHAI co trich dan [Nguon: ...].`;

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface KnowledgeChunk {
  id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

// ─── GEMINI: EMBEDDING ────────────────────────────────────────────────────────
async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini embedding error: ${err}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// ─── SUPABASE: VECTOR SEARCH ──────────────────────────────────────────────────
async function searchKnowledgeBase(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
  threshold = 0.5,
  count = 6
): Promise<KnowledgeChunk[]> {
  const { data, error } = await supabase.rpc("search_knowledge_base", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_threshold: threshold,
    match_count: count,
  });

  if (error) {
    console.error("[legal-ai-chat] Vector search error:", error);
    return [];
  }

  return (data || []) as KnowledgeChunk[];
}

// ─── BUILD PROMPT ─────────────────────────────────────────────────────────────
function buildPrompt(userQuery: string, chunks: KnowledgeChunk[]): string {
  let prompt = SYSTEM_PROMPT + "\n\n";

  if (chunks.length > 0) {
    prompt += "# CONTEXT - Tai lieu phap ly lien quan:\n\n";
    chunks.forEach((chunk, i) => {
      prompt += `## [${i + 1}] ${chunk.document_title}`;
      prompt += ` (Do tuong dong: ${(chunk.similarity * 100).toFixed(1)}%)\n\n`;
      prompt += `${chunk.content}\n\n---\n\n`;
    });
  } else {
    prompt +=
      "# CONTEXT: Khong tim thay thong tin lien quan trong co so du lieu.\n\n";
  }

  prompt += `# CAU HOI CUA NGUOI DUNG:\n${userQuery}\n\nHay tra loi chi tiet dua tren Context o tren.`;
  return prompt;
}

// ─── GEMINI: GENERATE ANSWER ──────────────────────────────────────────────────
async function generateAnswer(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini generate error: ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
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
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return jsonResponse({ error: "Query is required" }, 400);
    }

    console.log(`[legal-ai-chat] Query: "${query.slice(0, 80)}..."`);

    // Step 1: Tạo embedding cho câu hỏi
    const queryEmbedding = await createEmbedding(query);
    console.log(`[legal-ai-chat] Embedding created (${queryEmbedding.length} dims)`);

    // Step 2: Tìm chunks liên quan trong knowledge base
    const chunks = await searchKnowledgeBase(supabase, queryEmbedding);
    console.log(`[legal-ai-chat] Found ${chunks.length} relevant chunks`);

    // Step 3: Build prompt + gọi Gemini để tạo câu trả lời
    const prompt = buildPrompt(query, chunks);
    const responseText = await generateAnswer(prompt);

    const responseTimeMs = Date.now() - startTime;
    console.log(`[legal-ai-chat] Response generated in ${responseTimeMs}ms`);

    // Step 4: Log analytics
    await logToAnalytics(supabase, {
      sessionId,
      query,
      response: responseText,
      source: "gemini_rag",
      timeMs: responseTimeMs,
      success: true,
      meta,
      extraMetadata: {
        chunks_found: chunks.length,
        top_documents: chunks.map((c) => c.document_title),
        embedding_dim: queryEmbedding.length,
      },
    });

    // Step 5: Trả về response
    return jsonResponse({
      summary: responseText,
      detailed: responseText,
      citations: chunks.map((c) => ({
        document: c.document_title,
        document_id: c.document_id,
        chunk_index: c.chunk_index,
        similarity: c.similarity,
        content: c.content,
      })),
      detected_chemicals: [],
      response_time_ms: responseTimeMs,
      chunks_used: chunks.length,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";

    console.error("[legal-ai-chat] Error:", errorMsg);

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
