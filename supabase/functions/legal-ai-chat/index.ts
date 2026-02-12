import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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

async function getN8nWebhookUrl(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "n8n_webhook_url")
    .maybeSingle();

  return data?.value || "";
}

function extractN8nResponseText(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data) && data.length > 0) {
    return extractN8nResponseText(data[0]);
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.output === "string") return obj.output;
    if (typeof obj.response === "string") return obj.response;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.message === "string") return obj.message;
    if (obj.data && typeof obj.data === "object") {
      return extractN8nResponseText(obj.data);
    }
  }
  return JSON.stringify(data);
}

async function callN8nAgent(
  webhookUrl: string,
  query: string,
  sessionId: string
): Promise<string> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sendMessage",
      chatInput: query,
      sessionId,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`n8n error (${response.status}): ${errText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  let raw: unknown;
  if (contentType.includes("application/json")) {
    raw = await response.json();
  } else {
    raw = await response.text();
  }

  return extractN8nResponseText(raw);
}

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

const SYSTEM_PROMPT = `# VAI TRO
Ban la Tro ly Phap ly AI chuyen sau ve Luat Hoa chat Viet Nam 2026 cua LuatHoaChat.vn.
Nhiem vu: Tu van phap ly dua tren Luat 69/2025/QH15 va cac Nghi dinh 24, 25, 26/2026/ND-CP.

# QUY TAC
1. CHI SU DUNG thong tin trong Context ben duoi
2. TRICH DAN NGUON sau moi y: [Nguon: Nghi dinh X/2026/ND-CP, Dieu Y, Khoan Z]
3. Neu khong co thong tin, tra loi: "Xin loi, noi dung nay chua co trong co so du lieu."
4. Van phong: Chuyen nghiep, chinh xac, ro rang

# CAU TRUC TRA LOI
1. Phan loai hoa chat (neu co)
2. Yeu cau phap ly (giay phep, khai bao)
3. Yeu cau an toan (luu tru, ung pho su co)
4. Muc phat vi pham (neu co)
5. Luu y dac biet

Moi phan PHAI co trich dan [Nguon: ...].`;

interface RAGContext {
  content: string;
  document_code: string;
  article_number: number | null;
  clause_number: number | null;
  point_letter: string | null;
  similarity: number;
}

async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function searchRelevantContext(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[]
): Promise<RAGContext[]> {
  const { data, error } = await supabase.rpc("search_legal_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    content: item.content as string,
    document_code: item.document_code as string,
    article_number: item.article_number as number | null,
    clause_number: item.clause_number as number | null,
    point_letter: (item.point_letter as string) || null,
    similarity: item.similarity as number,
  }));
}

function buildPromptWithContext(
  userQuery: string,
  contexts: RAGContext[]
): string {
  let prompt = SYSTEM_PROMPT + "\n\n";

  if (contexts.length > 0) {
    prompt += "# CONTEXT - Thong tin phap ly lien quan:\n\n";
    contexts.forEach((ctx, index) => {
      prompt += `## [${index + 1}] ${ctx.document_code}`;
      if (ctx.article_number) prompt += `, Dieu ${ctx.article_number}`;
      if (ctx.clause_number) prompt += `, Khoan ${ctx.clause_number}`;
      prompt += ` (${(ctx.similarity * 100).toFixed(1)}%)\n\n`;
      prompt += `${ctx.content}\n\n---\n\n`;
    });
  } else {
    prompt += "# CONTEXT: Khong tim thay thong tin lien quan.\n\n";
  }

  prompt += `# CAU HOI:\n${userQuery}\n\nTra loi dua tren Context.`;
  return prompt;
}

async function fallbackRAG(
  supabase: ReturnType<typeof createClient>,
  query: string
): Promise<{ responseText: string; contexts: RAGContext[] }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const queryEmbedding = await createEmbedding(query);
  const contexts = await searchRelevantContext(supabase, queryEmbedding);
  const prompt = buildPromptWithContext(query, contexts);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  return {
    responseText: data.choices[0].message.content,
    contexts,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const meta = extractRequestMeta(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return jsonResponse({ error: "Query is required" }, 400);
    }

    console.log(`[legal-ai-chat] Query: "${query}"`);

    const n8nUrl = await getN8nWebhookUrl(supabase);

    if (n8nUrl) {
      console.log("[legal-ai-chat] Routing to n8n agent...");

      const sessionId = crypto.randomUUID();
      const responseText = await callN8nAgent(n8nUrl, query, sessionId);
      const responseTimeMs = Date.now() - startTime;

      console.log(`[legal-ai-chat] n8n response in ${responseTimeMs}ms`);

      await logToAnalytics(supabase, {
        sessionId,
        query,
        response: responseText,
        source: "n8n",
        timeMs: responseTimeMs,
        success: true,
        meta,
      });

      return jsonResponse({
        summary: responseText,
        detailed: "",
        citations: [],
        detected_chemicals: [],
        response_time_ms: responseTimeMs,
      });
    }

    console.log("[legal-ai-chat] n8n not configured, using RAG fallback...");

    const { responseText, contexts } = await fallbackRAG(supabase, query);
    const responseTimeMs = Date.now() - startTime;

    await logToAnalytics(supabase, {
      sessionId: crypto.randomUUID(),
      query,
      response: responseText,
      source: "rag_fallback",
      timeMs: responseTimeMs,
      success: true,
      meta,
      extraMetadata: {
        contexts_count: contexts.length,
        top_documents: contexts.map((c) => c.document_code),
      },
    });

    return jsonResponse({
      summary: responseText,
      detailed: responseText,
      citations: contexts.map((c) => ({
        document: c.document_code,
        article: c.article_number,
        clause: c.clause_number,
        point: c.point_letter,
        content: c.content,
      })),
      detected_chemicals: [],
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    console.error("[legal-ai-chat] Error:", error);

    const responseTimeMs = Date.now() - startTime;
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await logToAnalytics(supabase, {
        sessionId: crypto.randomUUID(),
        query: "unknown",
        response: "",
        source: "error",
        timeMs: responseTimeMs,
        success: false,
        error: errorMsg,
        meta,
      });
    } catch {
      console.error("[legal-ai-chat] Failed to log error to analytics");
    }

    return jsonResponse(
      {
        summary:
          "Xin loi, da co loi xay ra khi xu ly cau hoi. Vui long thu lai sau.",
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
