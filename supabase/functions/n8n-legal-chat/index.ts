import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Api-Key",
};

interface ChatRequest {
  action: "chat" | "search" | "health";
  query?: string;
  session_id?: string;
  top_k?: number;
  stream?: boolean;
  apiKey?: string;
}

interface RAGContext {
  id: string;
  document_code: string;
  article_number: number | null;
  clause_number: number | null;
  point_letter: string | null;
  content: string;
  similarity: number;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: true, message }, status);
}

async function validateApiKey(
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("n8n_api_keys")
    .select("id, is_active, rate_limit_per_hour, usage_count, last_used_at")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return false;

  const now = new Date();
  const lastUsed = data.last_used_at ? new Date(data.last_used_at) : null;
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  if (lastUsed && lastUsed > hourAgo && data.usage_count >= data.rate_limit_per_hour) {
    return false;
  }

  const resetCount = !lastUsed || lastUsed < hourAgo;

  await supabase
    .from("n8n_api_keys")
    .update({
      usage_count: resetCount ? 1 : data.usage_count + 1,
      last_used_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", data.id);

  return true;
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
    const err = await response.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function searchKnowledgeBase(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
  topK: number
): Promise<RAGContext[]> {
  const { data, error } = await supabase.rpc("search_legal_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: 0.65,
    match_count: topK,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    document_code: item.document_code as string,
    article_number: item.article_number as number | null,
    clause_number: item.clause_number as number | null,
    point_letter: item.point_letter as string | null,
    content: item.content as string,
    similarity: item.similarity as number,
  }));
}

function buildRAGPrompt(query: string, contexts: RAGContext[]): string {
  let prompt = `# VAI TRO
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

Moi phan PHAI co trich dan [Nguon: ...].\n\n`;

  if (contexts.length > 0) {
    prompt += "# CONTEXT - Thong tin phap ly lien quan:\n\n";
    contexts.forEach((ctx, i) => {
      prompt += `## [${i + 1}] ${ctx.document_code}`;
      if (ctx.article_number) prompt += `, Dieu ${ctx.article_number}`;
      if (ctx.clause_number) prompt += `, Khoan ${ctx.clause_number}`;
      prompt += ` (${(ctx.similarity * 100).toFixed(1)}%)\n\n`;
      prompt += `${ctx.content}\n\n---\n\n`;
    });
  } else {
    prompt += "# CONTEXT: Khong tim thay thong tin lien quan.\n\n";
  }

  prompt += `# CAU HOI:\n${query}\n\nTra loi dua tren Context va tuan thu Quy tac.`;
  return prompt;
}

async function generateChatResponse(
  prompt: string,
  query: string
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

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
    const err = await response.text();
    throw new Error(`OpenAI chat error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function handleChat(
  supabase: ReturnType<typeof createClient>,
  query: string,
  sessionId: string,
  apiKeyValue: string,
  topK: number
): Promise<Response> {
  const startTime = Date.now();

  const embedding = await createEmbedding(query);
  const contexts = await searchKnowledgeBase(supabase, embedding, topK);
  const prompt = buildRAGPrompt(query, contexts);
  const aiResponse = await generateChatResponse(prompt, query);

  const responseTimeMs = Date.now() - startTime;

  await supabase.from("n8n_chat_logs").insert({
    session_id: sessionId,
    api_key: apiKeyValue,
    user_query: query,
    ai_response: aiResponse,
    contexts_found: contexts.length,
    response_time_ms: responseTimeMs,
    metadata: {
      top_k: topK,
      contexts: contexts.map((c) => ({
        document_code: c.document_code,
        article_number: c.article_number,
        clause_number: c.clause_number,
        similarity: c.similarity,
      })),
    },
  });

  return jsonResponse({
    success: true,
    data: {
      response: aiResponse,
      session_id: sessionId,
      contexts: contexts.map((c) => ({
        document_code: c.document_code,
        article_number: c.article_number,
        clause_number: c.clause_number,
        content: c.content,
        similarity: Math.round(c.similarity * 100) / 100,
      })),
      metadata: {
        contexts_found: contexts.length,
        response_time_ms: responseTimeMs,
        model: "gpt-4o-mini",
      },
    },
  });
}

async function handleSearch(
  supabase: ReturnType<typeof createClient>,
  query: string,
  topK: number
): Promise<Response> {
  const startTime = Date.now();

  const embedding = await createEmbedding(query);
  const contexts = await searchKnowledgeBase(supabase, embedding, topK);

  return jsonResponse({
    success: true,
    data: {
      query,
      results: contexts.map((c) => ({
        document_code: c.document_code,
        article_number: c.article_number,
        clause_number: c.clause_number,
        point_letter: c.point_letter,
        content: c.content,
        similarity: Math.round(c.similarity * 100) / 100,
      })),
      total: contexts.length,
      response_time_ms: Date.now() - startTime,
    },
  });
}

function handleHealth(): Response {
  return jsonResponse({
    success: true,
    data: {
      status: "healthy",
      service: "n8n-legal-chat",
      version: "2.0.0",
      capabilities: ["chat", "search", "health"],
      models: {
        embedding: "text-embedding-3-small",
        chat: "gpt-4o-mini",
      },
      timestamp: new Date().toISOString(),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "GET") {
      return handleHealth();
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body: ChatRequest = await req.json();
    const { action = "chat", query, session_id, top_k = 5 } = body;

    if (action === "health") {
      return handleHealth();
    }

    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("X-Api-Key") ||
      body.apiKey;

    if (!apiKey) {
      return errorResponse("API key required. Set x-api-key header or apiKey in body.", 401);
    }

    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return errorResponse("Invalid or rate-limited API key.", 403);
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return errorResponse("Field 'query' is required and must be a non-empty string.");
    }

    const trimmedQuery = query.trim();
    const clampedTopK = Math.min(Math.max(top_k, 1), 20);
    const resolvedSessionId = session_id || crypto.randomUUID();

    switch (action) {
      case "chat":
        return await handleChat(supabase, trimmedQuery, resolvedSessionId, apiKey, clampedTopK);
      case "search":
        return await handleSearch(supabase, trimmedQuery, clampedTopK);
      default:
        return errorResponse(`Unknown action: '${action}'. Use 'chat', 'search', or 'health'.`);
    }
  } catch (err) {
    console.error("[n8n-legal-chat] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500
    );
  }
});
