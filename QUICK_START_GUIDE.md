# 🚀 HƯỚNG DẪN NHANH - KÍCH HOẠT HỆ THỐNG RAG

## ⚡ TÓM TẮT 3 PHÚT

Hệ thống RAG đã được code xong. Để kích hoạt, cần thực hiện **3 bước:**

1. **Cấu hình OpenAI API Key** (1 phút)
2. **Chuẩn bị dữ liệu văn bản** (5 phút)
3. **Chạy Ingestion Script** (2 phút)

---

## 📋 BƯỚC 1: CẤU HÌNH OPENAI API KEY

### A. Lấy API Key từ OpenAI

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập (hoặc đăng ký nếu chưa có)
3. Click **"Create new secret key"**
4. Copy key (format: `sk-proj-...`)

### B. Thêm vào Supabase Secrets

**Cách 1: Qua Dashboard (Khuyên dùng)**
```
1. Vào Supabase Dashboard
2. Chọn Project của bạn
3. Settings > Edge Functions > Secrets
4. Add new secret:
   - Name: OPENAI_API_KEY
   - Value: sk-proj-... (paste key vừa copy)
5. Save
```

**Cách 2: Qua Supabase CLI**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

---

## 📋 BƯỚC 2: CHUẨN BỊ DỮ LIỆU VĂN BẢN

### Tình trạng hiện tại:
- ✅ Có 4 file PDF trong `data/legal-documents/`
- ❌ Chưa extract thành text files

### Công cụ gợi ý: pdf2txt (Python)

```bash
# Cài đặt tool
pip install pdfminer.six

# Tạo thư mục output
mkdir -p data/legal-documents/extracted-text

# Extract từng file
pdf2txt.py data/legal-documents/69qh.signed.pdf > data/legal-documents/extracted-text/69qh.txt

pdf2txt.py data/legal-documents/nghi_dinh_so_24.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf > data/legal-documents/extracted-text/nghi_dinh_so_24.txt

pdf2txt.py data/legal-documents/nghi_dinh_so_25.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf > data/legal-documents/extracted-text/nghi_dinh_so_25.txt

pdf2txt.py data/legal-documents/nghi_dinh_so_26.2026.nd-cp_qlhc_va_hc_nguy_hiem_\(1\).pdf > data/legal-documents/extracted-text/nghi_dinh_so_26.txt
```

**Lưu ý tên file:**
- `69qh.txt` → Luật 69/2025/QH15
- `nghi_dinh_so_24.txt` → ND 24/2026
- `nghi_dinh_so_25.txt` → ND 25/2026
- `nghi_dinh_so_26.txt` → ND 26/2026

### Kiểm tra kết quả:
```bash
ls -lh data/legal-documents/extracted-text/
# Expected: 4 files .txt, mỗi file ~100-500KB
```

---

## 📋 BƯỚC 3: CHẠY INGESTION SCRIPT

### A. Cài đặt dependencies

```bash
npm install
# Cài thêm: openai, tsx (đã có trong package.json)
```

### B. Set environment variables

```bash
# Lấy từ Supabase Dashboard > Settings > API
export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"

# Lấy từ Supabase Dashboard > Settings > API > service_role key (NOT anon key!)
export SUPABASE_SERVICE_KEY="eyJhbGciOiJI..."

# OpenAI API Key (đã tạo ở Bước 1)
export OPENAI_API_KEY="sk-proj-..."
```

### C. Chạy script

```bash
npm run ingest-legal-docs
```

**Output mong đợi:**
```
🚀 Starting Legal Document Ingestion with Semantic Chunking...

Document IDs loaded: {...}
Found 4 text files

📄 Processing: 69qh.txt
  ✓ Created 156 chunks
📄 Processing: nghi_dinh_so_24.txt
  ✓ Created 89 chunks
📄 Processing: nghi_dinh_so_25.txt
  ✓ Created 134 chunks
📄 Processing: nghi_dinh_so_26.txt
  ✓ Created 112 chunks

📊 Total chunks: 491

Generating embeddings for 491 chunks...
Processed 100/491 chunks
Processed 200/491 chunks
...
Processed 491/491 chunks

Inserting 491 chunks into Supabase...
Inserted 50/491 chunks
...
Inserted 491/491 chunks

✅ Ingestion completed successfully!
```

**Thời gian:** ~2-3 phút
**Chi phí:** ~$0.02 USD (OpenAI embedding API)

---

## ✅ XÁC NHẬN HỆ THỐNG HOẠT ĐỘNG

### 1. Kiểm tra database

```sql
-- Vào Supabase Dashboard > SQL Editor
SELECT COUNT(*) FROM legal_knowledge_chunks;
-- Expected: 400-600 chunks

SELECT COUNT(*) FROM legal_knowledge_chunks WHERE embedding IS NOT NULL;
-- Expected: Same as above (tất cả chunks phải có embedding)

-- Xem sample data
SELECT
  document_code,
  article_number,
  clause_number,
  LEFT(content, 100) as content_preview
FROM legal_knowledge_chunks
LIMIT 10;
```

### 2. Test Edge Function

```bash
# Test bằng curl
curl -X POST \
  'https://xxx.supabase.co/functions/v1/legal-ai-chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"query": "Axit HCl cần giấy phép gì?", "stream": false}'
```

**Expected response:**
```json
{
  "response": "**Axit Hydrochloric (HCl)** thuộc Phụ lục I...[với trích dẫn nguồn]",
  "contexts": [
    {
      "document": "24/2026/NĐ-CP",
      "article": 15,
      "similarity": 0.89
    }
  ],
  "response_time_ms": 2341
}
```

---

## 🎯 TÍCH HỢP VỚI FRONTEND

### File cần update: `components/chat/chat-interface.tsx`

**Thay đổi API endpoint:**

```typescript
// TÌM đoạn code gọi API (hiện tại):
const response = await fetch('/api/chat', { ... });

// THAY BẰNG:
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/legal-ai-chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      query: userMessage,
      stream: true, // Enable streaming
    }),
  }
);

// Xử lý streaming response
if (response.body) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    accumulatedText += text;

    // Update UI ngay lập tức (streaming effect)
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.content = accumulatedText;
      } else {
        newMessages.push({ role: 'assistant', content: accumulatedText });
      }
      return newMessages;
    });
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Lỗi: "OPENAI_API_KEY not configured"
**Nguyên nhân:** Chưa set secret trong Supabase
**Giải pháp:** Làm lại Bước 1B

### Lỗi: "search_legal_knowledge function not found"
**Nguyên nhân:** Migration chưa chạy
**Giải pháp:**
```bash
# Kiểm tra migrations đã chạy chưa
supabase migration list

# Chạy lại migration
supabase db reset
```

### Lỗi: "No chunks found"
**Nguyên nhân:** Chưa chạy ingestion script
**Giải pháp:** Làm lại Bước 3

### Lỗi: "OpenAI rate limit exceeded"
**Nguyên nhân:** Gọi API quá nhanh
**Giải pháp:**
- Free tier OpenAI: 3 requests/minute
- Upgrade lên Paid tier: 3500 requests/minute

### Câu trả lời AI không chính xác
**Nguyên nhân:** Similarity threshold quá thấp
**Giải pháp:** Tăng threshold trong `searchRelevantContext()`:
```typescript
// File: supabase/functions/legal-ai-chat/index.ts
// Dòng ~90
const { data, error } = await supabase.rpc("search_legal_knowledge", {
  query_embedding: queryEmbedding,
  match_threshold: 0.8, // Tăng từ 0.7 lên 0.8
  match_count: 5,
});
```

---

## 📊 MONITORING & METRICS

### Dashboard Query - Hiệu suất hệ thống

```sql
-- Query này vào Supabase Dashboard > SQL Editor
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_queries,
  AVG(response_time_ms) as avg_response_time,
  MAX(response_time_ms) as max_response_time,
  MIN(response_time_ms) as min_response_time
FROM ai_chat_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top Queries (để cải thiện)

```sql
SELECT
  user_query,
  COUNT(*) as frequency,
  AVG(response_time_ms) as avg_time
FROM ai_chat_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_query
ORDER BY frequency DESC
LIMIT 20;
```

---

## 🎉 HOÀN TẤT

Sau khi hoàn thành 3 bước trên, hệ thống RAG đã **PRODUCTION READY**.

**Các tính năng đã hoạt động:**
- ✅ Semantic search với vector similarity
- ✅ Trích dẫn nguồn chính xác (Điều, Khoản)
- ✅ Streaming response (UX mượt mà)
- ✅ Response time < 3 giây
- ✅ Auto-scaling với Supabase Edge Functions

**Bước kế tiếp (optional):**
- Thêm rate limiting cho user
- Thêm analytics dashboard
- A/B testing different prompts
- Fine-tune embedding model cho legal domain

---

## 📞 LƯU Ý QUAN TRỌNG

### Chi phí vận hành dự kiến:

**OpenAI Costs:**
- Embedding: $0.00002/1K tokens
- GPT-4o-mini: $0.15/1M tokens (input), $0.60/1M tokens (output)
- Dự kiến: ~$5-10/tháng với 1000 queries/ngày

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Nếu vượt: ~$25/tháng (Pro plan)

**Total:** ~$10-35/tháng

### Backup quan trọng:

```bash
# Backup chunks (trước khi deploy production)
supabase db dump -f backup_legal_chunks.sql --table legal_knowledge_chunks

# Restore nếu cần
supabase db restore backup_legal_chunks.sql
```

---

**Chúc mừng! Bạn đã triển khai thành công hệ thống RAG cho tư vấn pháp lý. 🎉**
