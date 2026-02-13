# Hướng Dẫn Tích Hợp N8N với LuatHoaChat.vn

## Tổng quan

Edge Function **`n8n-legal-chat`** cung cấp API endpoint để tích hợp chatbot AI vào workflows của n8n hoặc bất kỳ automation platform nào khác.

### Tính năng chính:
- ✅ **RAG-powered Chat**: Trả lời dựa trên cơ sở dữ liệu pháp luật Việt Nam 2026
- ✅ **API Key Authentication**: Bảo mật và quản lý rate limiting
- ✅ **Vector Search**: Tìm kiếm ngữ cảnh pháp lý liên quan với OpenAI embeddings
- ✅ **Chat Logs**: Lưu trữ toàn bộ lịch sử chat để phân tích
- ✅ **Health Check**: Monitoring endpoint

---

## I. Cấu Trúc Hệ Thống

### 1. Edge Function Endpoint

```
POST https://[your-project].supabase.co/functions/v1/n8n-legal-chat
```

### 2. Database Tables

#### `n8n_api_keys`
Quản lý API keys và rate limiting:

| Field | Type | Description |
|-------|------|-------------|
| `api_key` | text | API key để authenticate |
| `name` | text | Tên gợi nhớ của key |
| `is_active` | boolean | Key có đang active không |
| `rate_limit_per_hour` | integer | Giới hạn request/giờ |
| `usage_count` | integer | Số lần đã dùng trong giờ hiện tại |
| `last_used_at` | timestamptz | Thời gian sử dụng cuối |

#### `n8n_chat_logs`
Lưu trữ toàn bộ chat history:

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | text | ID của session chat |
| `api_key` | text | API key được dùng |
| `user_query` | text | Câu hỏi của user |
| `ai_response` | text | Câu trả lời của AI |
| `contexts_found` | integer | Số context RAG tìm được |
| `response_time_ms` | integer | Thời gian phản hồi (ms) |
| `metadata` | jsonb | Metadata (contexts, model, etc.) |

---

## II. Cách Sử Dụng

### 1. Lấy API Key

Hiện tại đã có một demo API key được tạo sẵn:

```bash
# Truy vấn để lấy API key demo
SELECT api_key FROM n8n_api_keys WHERE name LIKE '%Demo%';
```

**Kết quả mẫu:**
```
demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f
```

> **Lưu ý:** Trong production, admin nên tạo API key riêng cho từng integration.

### 2. Test với cURL

#### Health Check
```bash
curl -X GET 'https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/n8n-legal-chat'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "n8n-legal-chat",
    "version": "2.0.0",
    "capabilities": ["chat", "search", "health"],
    "models": {
      "embedding": "text-embedding-3-small",
      "chat": "gpt-4o-mini"
    },
    "timestamp": "2026-02-13T03:30:00.000Z"
  }
}
```

#### Chat Request
```bash
curl -X POST 'https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/n8n-legal-chat' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f' \
  -d '{
    "action": "chat",
    "query": "Hóa chất tiền chất là gì?",
    "session_id": "test-session-001",
    "top_k": 5
  }' | jq '.'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hóa chất tiền chất là...",
    "session_id": "test-session-001",
    "contexts": [
      {
        "document_code": "ND-26/2026/ND-CP",
        "article_number": 4,
        "clause_number": 1,
        "content": "...",
        "similarity": 0.85
      }
    ],
    "metadata": {
      "contexts_found": 3,
      "response_time_ms": 1250,
      "model": "gpt-4o-mini"
    }
  }
}
```

#### Search Request (RAG Only)
```bash
curl -X POST 'https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/n8n-legal-chat' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f' \
  -d '{
    "action": "search",
    "query": "giấy phép hóa chất",
    "top_k": 10
  }' | jq '.'
```

---

## III. Tích Hợp với N8N

### Workflow Example

#### Node 1: Webhook Trigger
- Nhận câu hỏi từ user qua webhook
- Output: `{{ $json.body.question }}`

#### Node 2: HTTP Request
- **Method:** POST
- **URL:** `https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/n8n-legal-chat`
- **Authentication:** None (sử dụng header)
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "x-api-key": "demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f"
  }
  ```
- **Body:**
  ```json
  {
    "action": "chat",
    "query": "{{ $json.body.question }}",
    "session_id": "{{ $json.body.session_id }}",
    "top_k": 5
  }
  ```

#### Node 3: Code/Transform
- Xử lý response và extract data
- Format output để gửi về user

#### Node 4: Send Response
- Gửi câu trả lời qua email, SMS, Zalo, hoặc webhook

---

## IV. Request Parameters

### Chat Action
```typescript
{
  "action": "chat",           // Required: "chat" | "search" | "health"
  "query": string,            // Required: Câu hỏi của user
  "session_id"?: string,      // Optional: Session ID (auto-generated if not provided)
  "top_k"?: number,           // Optional: Số context RAG (1-20, default: 5)
  "apiKey"?: string           // Optional: Có thể gửi qua body thay vì header
}
```

### Search Action
```typescript
{
  "action": "search",
  "query": string,
  "top_k"?: number
}
```

### Authentication
API key có thể gửi theo 3 cách:
1. Header: `x-api-key: YOUR_API_KEY`
2. Header: `X-Api-Key: YOUR_API_KEY`
3. Body: `{ "apiKey": "YOUR_API_KEY" }`

---

## V. Error Handling

### Common Errors

#### 401 - Missing API Key
```json
{
  "error": true,
  "message": "API key required. Set x-api-key header or apiKey in body."
}
```

#### 403 - Invalid or Rate Limited
```json
{
  "error": true,
  "message": "Invalid or rate-limited API key."
}
```

#### 400 - Missing Query
```json
{
  "error": true,
  "message": "Field 'query' is required and must be a non-empty string."
}
```

#### 500 - Internal Error
```json
{
  "error": true,
  "message": "OpenAI embedding error: ..."
}
```

---

## VI. Rate Limiting

- **Default:** 100 requests/hour per API key
- **Demo Key:** 1000 requests/hour
- Rate limit reset mỗi giờ
- Counter tự động reset sau 1 giờ từ `last_used_at`

### Monitoring Usage
```sql
SELECT
  api_key,
  name,
  usage_count,
  rate_limit_per_hour,
  last_used_at
FROM n8n_api_keys
WHERE is_active = true;
```

---

## VII. Admin Dashboard

### Tạo API Key mới
```sql
INSERT INTO n8n_api_keys (api_key, name, is_active, rate_limit_per_hour)
VALUES (
  'n8n_key_' || gen_random_uuid()::text,
  'Production N8N Workflow',
  true,
  500
);
```

### Vô hiệu hóa API Key
```sql
UPDATE n8n_api_keys
SET is_active = false
WHERE api_key = 'demo_n8n_key_...';
```

### Xem Chat Logs
```sql
SELECT
  session_id,
  user_query,
  contexts_found,
  response_time_ms,
  created_at
FROM n8n_chat_logs
ORDER BY created_at DESC
LIMIT 100;
```

### Thống kê sử dụng
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  AVG(response_time_ms) as avg_response_time,
  AVG(contexts_found) as avg_contexts
FROM n8n_chat_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## VIII. Best Practices

### 1. Security
- ✅ Không commit API key vào code
- ✅ Sử dụng environment variables trong n8n
- ✅ Rotate API keys định kỳ
- ✅ Monitor usage và detect anomalies

### 2. Performance
- ✅ Cache responses nếu câu hỏi lặp lại
- ✅ Sử dụng `top_k` phù hợp (3-5 là tối ưu)
- ✅ Implement retry logic cho network errors

### 3. Error Handling
- ✅ Luôn check `success` field trong response
- ✅ Implement fallback message khi AI không có câu trả lời
- ✅ Log errors để debug

---

## IX. Roadmap

### Planned Features:
- [ ] Streaming responses
- [ ] Multi-turn conversations với context memory
- [ ] Custom system prompts per API key
- [ ] Webhook callbacks cho async processing
- [ ] Analytics dashboard trong admin panel

---

## X. Support

Nếu gặp vấn đề:
1. Kiểm tra Edge Function logs trong Supabase Dashboard
2. Verify API key còn active: `SELECT * FROM n8n_api_keys WHERE api_key = 'YOUR_KEY'`
3. Check OpenAI API key: `SELECT value FROM system_config WHERE key = 'openai_api_key'`

---

**Demo API Key (Testing Only):**
```
demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f
```

**Endpoint:**
```
https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/n8n-legal-chat
```
