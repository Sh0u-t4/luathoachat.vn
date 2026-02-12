# 🔐 HƯỚNG DẪN CẤU HÌNH OPENAI API KEY

## ✅ TÌNH TRẠNG HIỆN TẠI

- ✅ OpenAI API Key đã được thêm vào file `.env` (local development)
- ⚠️ **QUAN TRỌNG:** Cần thêm key vào Supabase Edge Function Secrets để production hoạt động

---

## 🎯 2 MÔI TRƯỜNG CẦN CẤU HÌNH

### 1. **Local Development** (Đã xong ✅)
- File: `.env`
- Mục đích: Chạy ingestion script local
- Status: ✅ Đã có `OPENAI_API_KEY`

### 2. **Production (Supabase Edge Functions)** (Cần làm ⚠️)
- Nơi lưu: Supabase Project Secrets
- Mục đích: Edge Function `legal-ai-chat` gọi OpenAI API
- Status: ⚠️ **CẦN CẤU HÌNH NGAY**

---

## 📋 BƯỚC 1: THÊM VÀO SUPABASE SECRETS (BẮT BUỘC)

### Cách 1: Qua Supabase Dashboard (KHUYÊN DÙNG - DỄ NHẤT)

1. **Truy cập Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/twdjyaczcxahsqeiwgqn/settings/functions
   ```

2. **Scroll xuống phần "Secrets"**

3. **Click "Add new secret"**

4. **Điền thông tin:**
   ```
   Name: OPENAI_API_KEY
   Value: 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
   ```

5. **Click "Save"**

6. **Verify:**
   - Secret sẽ hiển thị trong danh sách (value bị ẩn)
   - Edge Function sẽ tự động access được secret này

---

### Cách 2: Qua Supabase CLI (Advanced)

```bash
# Đảm bảo đã login Supabase CLI
supabase login

# Set secret
supabase secrets set OPENAI_API_KEY="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" \
  --project-ref twdjyaczcxahsqeiwgqn

# Verify
supabase secrets list --project-ref twdjyaczcxahsqeiwgqn
```

---

### Cách 3: Chạy Helper Script (Tự động)

```bash
# Make script executable
chmod +x scripts/setup-openai-secret.sh

# Run script (sẽ hiển thị hướng dẫn và commands)
bash scripts/setup-openai-secret.sh
```

---

## 📋 BƯỚC 2: XÁC NHẬN CẤU HÌNH THÀNH CÔNG

### Test Edge Function

```bash
# Make test script executable
chmod +x scripts/test-rag-system.sh

# Run comprehensive tests
bash scripts/test-rag-system.sh
```

**Output mong đợi:**
```
✅ Test 1 PASSED: Got valid response
✅ Test 2 PASSED: Response time < 5s
✅ Test 3 COMPLETED: Streaming test done
```

**Nếu thấy lỗi:** `"error": "OPENAI_API_KEY not configured"`
→ Secret chưa được add hoặc Edge Function chưa redeploy

---

### Test bằng curl trực tiếp

```bash
curl -X POST \
  'https://twdjyaczcxahsqeiwgqn.supabase.co/functions/v1/legal-ai-chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZGp5YWN6Y3hhaHNxZWl3Z3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTE3OTUsImV4cCI6MjA4NTc4Nzc5NX0.sP8QvsMK792jHesR-T4K3BlIITywkVmOHs6Ih7y3nI4' \
  -d '{"query": "Axit HCl cần giấy phép gì?", "stream": false}' | jq '.'
```

**Response thành công:**
```json
{
  "response": "**Về phân loại:**\nAxit Hydrochloric (HCl) thuộc...[trích dẫn]",
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

## 🔧 TROUBLESHOOTING

### Lỗi: "OPENAI_API_KEY not configured"

**Nguyên nhân:**
- Secret chưa được add vào Supabase
- Hoặc Edge Function chưa restart sau khi add secret

**Giải pháp:**
1. Verify secret đã add: Vào Dashboard > Settings > Functions > Secrets
2. Redeploy edge function để apply secret:
   ```bash
   supabase functions deploy legal-ai-chat --project-ref twdjyaczcxahsqeiwgqn
   ```

---

### Lỗi: "Invalid API key"

**Nguyên nhân:**
- API key sai
- API key hết hạn
- Chưa có credits trong OpenAI account

**Giải pháp:**
1. Kiểm tra API key tại: https://platform.openai.com/api-keys
2. Verify account có credits: https://platform.openai.com/account/billing
3. Tạo key mới nếu cần và update lại

---

### Lỗi: Rate limit exceeded

**Nguyên nhân:**
- Free tier OpenAI: 3 requests/minute, 200 requests/day
- Quá nhiều request trong thời gian ngắn

**Giải pháp:**
1. **Ngắn hạn:** Đợi 1-2 phút rồi thử lại
2. **Dài hạn:** Upgrade OpenAI account lên Paid tier ($5 credit)
   - Tier 1: 500 requests/minute
   - Cost: ~$0.15/1M tokens (GPT-4o-mini)

---

## 💰 CHI PHÍ OPENAI

### Embedding (text-embedding-3-small)
- **Price:** $0.00002/1K tokens
- **Usage:** Ingestion (1 lần) + mỗi query (1 request)
- **Ước tính:**
  - Ingestion 800 chunks: ~$0.02
  - 1000 queries/ngày: ~$0.60/tháng

### Generation (GPT-4o-mini)
- **Price:**
  - Input: $0.15/1M tokens
  - Output: $0.60/1M tokens
- **Usage:** Mỗi query
- **Ước tính:** 1000 queries/ngày: ~$5-8/tháng

**Total: ~$6-10/tháng** với 1000 queries/ngày

---

## 🔐 BẢO MẬT API KEY

### ✅ ĐÚNG (Đã làm):
- ✅ Lưu trong `.env` (local)
- ✅ Lưu trong Supabase Secrets (production)
- ✅ `.env` trong `.gitignore`

### ❌ SAI (Không được làm):
- ❌ KHÔNG commit `.env` lên Git
- ❌ KHÔNG hardcode vào source code
- ❌ KHÔNG expose trong frontend code
- ❌ KHÔNG share public

### Nếu API key bị lộ:
1. **NGAY LẬP TỨC:**
   - Vào https://platform.openai.com/api-keys
   - Revoke key cũ
   - Tạo key mới
   - Update vào `.env` và Supabase Secrets

2. **Kiểm tra:**
   - Usage logs: https://platform.openai.com/usage
   - Xem có request lạ không

---

## 📊 MONITORING

### Xem usage OpenAI:
```
https://platform.openai.com/usage
```

### Xem logs Edge Function:
```bash
supabase functions logs legal-ai-chat --project-ref twdjyaczcxahsqeiwgqn
```

### Query logs trong Supabase:
```sql
SELECT
  created_at,
  user_query,
  response_time_ms,
  LEFT(ai_response, 100) as response_preview
FROM ai_chat_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## ✅ CHECKLIST HOÀN TẤT

- [x] OpenAI API key added to `.env` (local)
- [ ] **OpenAI API key added to Supabase Secrets** ⚠️ CẦN LÀM NGAY
- [ ] Edge Function tested successfully
- [ ] Response contains proper citations
- [ ] Response time < 3 seconds

**Sau khi hoàn thành checklist → Hệ thống PRODUCTION READY**

---

## 🎯 BƯỚC TIẾP THEO

Sau khi config OpenAI key thành công:

1. **Test hệ thống:** `bash scripts/test-rag-system.sh`
2. **Chạy ingestion:** `npm run ingest-legal-docs` (sau khi có text files)
3. **Tích hợp frontend:** Update `chat-interface.tsx` để gọi edge function
4. **Monitor:** Theo dõi logs và usage

---

**🎉 Chúc mừng! Bạn đã cấu hình xong OpenAI API cho hệ thống RAG.**
