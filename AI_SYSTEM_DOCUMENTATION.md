# HỆ THỐNG TƯ VẤN PHÁP LÝ AI - LUẬT HÓA CHẤT 2026

## 📋 TỔNG QUAN

Hệ thống AI tư vấn pháp lý chuyên sâu về **Luật Hóa chất Việt Nam 2026** được xây dựng theo kiến trúc **RAG (Retrieval-Augmented Generation)** với Knowledge Base chứa 4 văn bản luật chính thức.

### Văn bản pháp luật trong hệ thống:
1. **Luật Hóa chất 69/2025/QH15** (hiệu lực 01/01/2026)
2. **Nghị định 24/2026/NĐ-CP** - Danh mục hóa chất (Phụ lục I, II, III, IV)
3. **Nghị định 25/2026/NĐ-CP** - Phát triển công nghiệp & An toàn
4. **Nghị định 26/2026/NĐ-CP** - Quản lý hoạt động hóa chất

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  (Chat Interface with Real-time AI Response)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 13 App Router)                │
│  • Chat Context Provider (chat-context.tsx)                  │
│  • Chat Interface Component (chat-interface.tsx)             │
│  • Legal Citation Component (legal-citation.tsx)             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           SUPABASE EDGE FUNCTION (Deno Runtime)              │
│  • Function: legal-ai-chat                                   │
│  • Location: supabase/functions/legal-ai-chat/index.ts       │
│                                                               │
│  PROCESSING STEPS:                                           │
│  1. Extract keywords from query (chemicals, activities)      │
│  2. Search chemicals_2026 table by Vietnamese/English name   │
│  3. Search legal_articles by keywords & applies_to           │
│  4. Generate structured response with citations              │
│  5. Log to ai_chat_logs for analytics                        │
└────────────────────┬────────────────────────────────────────┘
                     │ PostgreSQL Queries
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                  │
│                                                               │
│  TABLES:                                                      │
│  • legal_documents_2026 (4 văn bản luật)                     │
│  • legal_articles (Các điều luật chi tiết)                   │
│  • chemicals_2026 (Danh mục hóa chất theo NĐ 24)             │
│  • ai_chat_logs (Lịch sử chat để cải thiện AI)               │
│                                                               │
│  INDEXES:                                                     │
│  • Full-text search on content, keywords                     │
│  • GIN indexes for arrays (keywords, applies_to)             │
│  • B-tree indexes for CAS number, appendix lookup            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA

### 1. `legal_documents_2026`
Lưu trữ 4 văn bản luật chính.

**Cấu trúc:**
```sql
- id: uuid (PK)
- document_code: text (UNIQUE) -- LUAT_69, ND_24, ND_25, ND_26
- document_name: text
- document_type: text -- 'law' | 'decree' | 'circular'
- issuing_authority: text
- issue_date: date
- effective_date: date
- summary: text
- full_text_url: text
```

### 2. `legal_articles`
Lưu từng điều luật chi tiết để tra cứu chính xác.

**Cấu trúc:**
```sql
- id: uuid (PK)
- document_id: uuid (FK → legal_documents_2026)
- article_number: integer
- article_title: text
- clause_number: integer (nullable)
- point_letter: text (nullable) -- 'a', 'b', 'c'...
- content: text
- applies_to: text[] -- ['production', 'import', 'export', 'storage']
- chemical_category: text[] -- ['appendix_i', 'appendix_ii', ...]
- penalty_min: numeric (nullable)
- penalty_max: numeric (nullable)
- keywords: text[] -- Từ khóa để tra cứu
```

**Ví dụ record:**
```json
{
  "article_number": 6,
  "article_title": "Khai báo hóa chất nhập khẩu",
  "clause_number": 1,
  "content": "Tổ chức nhập khẩu hóa chất phải thực hiện khai báo...",
  "applies_to": ["import"],
  "chemical_category": ["appendix_i", "appendix_ii"],
  "penalty_min": 20,
  "penalty_max": 50,
  "keywords": ["khai báo", "nhập khẩu", "thông quan"]
}
```

### 3. `chemicals_2026`
Danh mục hóa chất theo Nghị định 24/2026.

**Cấu trúc:**
```sql
- id: uuid (PK)
- cas_number: text (UNIQUE)
- vietnamese_name: text
- english_name: text
- formula: text
- decree_24_appendix: text -- 'I', 'II', 'III', 'IV'
- appendix_category: text -- 'basic', 'banned', 'restricted', 'precursor'
- requires_incident_plan: boolean
- threshold_mass_kg: numeric
- license_type: text
- import_declaration_required: boolean
- special_control: boolean
- hazard_class: text -- GHS classification
- un_number: text
- storage_requirements: text
- legal_reference: text
- penalty_range: text
```

**Ví dụ record (Methanol):**
```json
{
  "cas_number": "67-56-1",
  "vietnamese_name": "Methanol",
  "english_name": "Methyl Alcohol",
  "formula": "CH3OH",
  "decree_24_appendix": "III",
  "appendix_category": "precursor",
  "requires_incident_plan": true,
  "threshold_mass_kg": 200,
  "license_type": "precursor",
  "special_control": true,
  "hazard_class": "Độc cấp tính 3, Dễ cháy cấp 2",
  "un_number": "UN1230",
  "storage_requirements": "Báo cáo HÀNG TUẦN, Camera AI 24/7...",
  "penalty_range": "300-500 triệu VNĐ + TRUY CỨU HÌNH SỰ"
}
```

### 4. `ai_chat_logs`
Lưu lịch sử chat để phân tích và cải thiện AI.

**Cấu trúc:**
```sql
- id: uuid (PK)
- session_token: text
- user_query: text
- detected_chemicals: text[]
- articles_referenced: uuid[]
- ai_response: text
- response_time_ms: integer
- user_feedback: text -- 'helpful', 'not_helpful', 'unclear'
- created_at: timestamptz
```

---

## 🧠 QUY TRÌNH XỬ LÝ AI (RAG PIPELINE)

### Bước 1: Query Analysis
```typescript
function extractChemicalKeywords(query: string): string[]
function extractActivityType(query: string): string[]
```
- Phân tích câu hỏi để trích xuất tên hóa chất và loại hoạt động
- Ví dụ: "Axit HCl nhập khẩu cần giấy phép gì?"
  → Chemicals: ['axit', 'hcl']
  → Activities: ['import']

### Bước 2: Database Retrieval
```typescript
// Tra cứu hóa chất
const chemicals = await supabase
  .from('chemicals_2026')
  .select('*')
  .or('vietnamese_name.ilike.%axit%,english_name.ilike.%hcl%')
  .limit(3);

// Tra cứu điều luật liên quan
const articles = await supabase
  .from('legal_articles')
  .select('*')
  .overlaps('keywords', ['khai báo', 'nhập khẩu'])
  .overlaps('applies_to', ['import'])
  .limit(10);
```

### Bước 3: Response Generation
```typescript
function generateResponse(
  chemicals: Chemical2026[],
  articles: LegalArticle[],
  query: string
): { summary: string; detailed: string; citations: Citation[] }
```

**Output Structure:**
```json
{
  "summary": "Tóm tắt ngắn gọn (200-300 từ)",
  "detailed": "Chi tiết đầy đủ với cấu trúc:\n## 1. PHÂN LOẠI\n## 2. YÊU CẦU PHÁP LÝ\n## 3. LƯU TRỮ\n## 4. MỨC PHẠT\n## 5. CĂN CỨ PHÁP LÝ",
  "citations": [
    {
      "document": "Nghị định 26/2026/NĐ-CP",
      "article": 6,
      "clause": 1,
      "content": "Tổ chức nhập khẩu hóa chất phải..."
    }
  ],
  "detected_chemicals": ["Axit Hydrochloric"],
  "response_time_ms": 450
}
```

### Bước 4: Logging
```typescript
await supabase.from('ai_chat_logs').insert({
  session_token: crypto.randomUUID(),
  user_query: query,
  detected_chemicals: chemicals.map(c => c.vietnamese_name),
  articles_referenced: articles.map(a => a.id),
  ai_response: response.summary,
  response_time_ms: responseTime
});
```

---

## 📱 FRONTEND COMPONENTS

### 1. Chat Context (`chat-context.tsx`)
- Quản lý state của chat (messages, typing, unlocked content)
- Gọi Edge Function qua HTTP POST
- Xử lý lỗi và hiển thị error messages

### 2. Chat Interface (`chat-interface.tsx`)
- Hiển thị danh sách messages
- Render detected chemicals dưới dạng badges
- Hiển thị citations qua `LegalCitation` component
- Blur detailed content cho lead generation

### 3. Legal Citation Component (`legal-citation.tsx`)
- Hiển thị trích dẫn pháp lý với icon và styling chuyên nghiệp
- Format: [Văn bản, Điều X, Khoản Y, Điểm Z]
- Hover effect để tăng tương tác

---

## 🎯 CHẤT LƯỢNG & CHUẨN MỰC

### 1. Citation-First Approach
Mọi khẳng định pháp lý đều phải có trích dẫn nguồn:
```
[Nguồn: Nghị định 26/2026/NĐ-CP, Điều 11, Khoản 3]
```

### 2. Knowledge Boundary
AI **CHỈ** trả lời dựa trên 4 văn bản luật có trong database. Nếu không có thông tin:
```
"Xin lỗi, nội dung này chưa được quy định cụ thể trong bộ Luật Hóa chất 2025
và các Nghị định hướng dẫn thi hành năm 2026 hiện có trong hệ thống."
```

### 3. Multi-step Reasoning
1. **Định danh chất:** Tra cứu trong Nghị định 24 → Xác định Phụ lục
2. **Tra cứu quy định:** Dựa vào phân loại → Tìm nghĩa vụ pháp lý
3. **Tổng hợp & Trích nguồn:** Soạn câu trả lời có cấu trúc + citations

### 4. Professional Tone
- Dùng từ ngữ pháp lý chính xác: "Tổ chức/Cá nhân", "Cơ sở hóa chất"
- Cảnh báo rủi ro mạnh mẽ: "⚠️ CẤM TUYỆT ĐỐI", "TRUY CỨU HÌNH SỰ"
- Cấu trúc rõ ràng: Đánh số, phân đoạn, in đậm

---

## 🚀 DEPLOYMENT

### Edge Function đã deployed:
```
Function: legal-ai-chat
URL: https://[your-project].supabase.co/functions/v1/legal-ai-chat
Method: POST
Auth: Bearer Token (SUPABASE_ANON_KEY)
```

### Request Format:
```json
POST /functions/v1/legal-ai-chat
{
  "query": "Methanol là tiền chất không?"
}
```

### Response Format:
```json
{
  "summary": "Methanol (CH3OH) là TIỀN CHẤT CÔNG NGHIỆP...",
  "detailed": "## 1. PHÂN LOẠI VÀ MỨC ĐỘ NGUY HIỂM...",
  "citations": [...],
  "detected_chemicals": ["Methanol"],
  "response_time_ms": 450
}
```

---

## 📊 ANALYTICS & IMPROVEMENT

### Tracking Metrics (qua `ai_chat_logs`):
- Số lượng queries theo loại hóa chất
- Tốc độ phản hồi trung bình
- Hóa chất được hỏi nhiều nhất
- Điều luật được trích dẫn nhiều nhất

### User Feedback:
```sql
UPDATE ai_chat_logs
SET user_feedback = 'helpful' | 'not_helpful' | 'unclear'
WHERE id = [log_id];
```

---

## 🔐 SECURITY

### Row Level Security (RLS):
- **Public READ** cho `legal_documents_2026`, `legal_articles`, `chemicals_2026` (tri thức công khai)
- **Authenticated WRITE** cho `ai_chat_logs` (chỉ service role)

### CORS:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
```

---

## 📚 TÀI LIỆU THAM KHẢO

### System Prompt:
- File: `lib/ai/system-prompt.ts`
- Chứa vai trò, quy trình, và chuẩn mực trả lời của AI

### Edge Function:
- File: `supabase/functions/legal-ai-chat/index.ts`
- Logic RAG đầy đủ với keyword extraction, database retrieval, response generation

### Database Migration:
- File: `supabase/migrations/create_legal_knowledge_base_2026.sql`
- Schema definition, indexes, RLS policies

---

## 🎓 VÍ DỤ SỬ DỤNG

### Câu hỏi 1: "Axit HCl cần giấy phép gì?"
**AI Response:**
```
Axit Hydrochloric (HCl)

Phân loại: ✓ Hóa chất công nghiệp cơ bản - Phụ lục I
Số CAS: 7647-01-0 | UN: UN1789

## 1. PHÂN LOẠI VÀ MỨC ĐỘ NGUY HIỂM
- Danh mục: Phụ lục I - Hóa chất cơ bản theo Nghị định 24/2026/NĐ-CP
- GHS: Ăn mòn da cấp 1, Độc cấp tính 4

## 2. YÊU CẦU PHÁP LÝ
### Giấy phép cần có:
- Giấy phép kinh doanh hóa chất
...

[Căn cứ pháp lý]
├─ Nghị định 24/2026/NĐ-CP, Điều 9, Khoản 1
└─ Nghị định 26/2026/NĐ-CP, Điều 6, Khoản 1
```

### Câu hỏi 2: "Methanol có phải tiền chất không?"
**AI Response:**
```
Methanol (CH3OH)

Phân loại: ⚠️ TIỀN CHẤT - QUẢN LÝ ĐẶC BIỆT - Phụ lục III

⚠️ CẢNH BÁO: Hóa chất này thuộc diện KIỂM SOÁT ĐẶC BIỆT

## 2. YÊU CẦU PHÁP LÝ
- Giấy phép kinh doanh TIỀN CHẤT (Bộ Công Thương)
- Báo cáo sử dụng HÀNG TUẦN
- Kiểm kê tồn kho hàng ngày
- Hệ thống camera giám sát 24/7
...

## 4. MỨC PHẠT VI PHẠM
300-500 triệu VNĐ + TRUY CỨU HÌNH SỰ (không giấy phép)
```

---

## 🛠️ BẢO TRÌ & CẬP NHẬT

### Thêm hóa chất mới:
```sql
INSERT INTO chemicals_2026 (
  vietnamese_name, english_name, formula, decree_24_appendix, ...
) VALUES (...);
```

### Thêm điều luật mới:
```sql
INSERT INTO legal_articles (
  document_id, article_number, content, keywords, ...
) VALUES (...);
```

### Cập nhật Edge Function:
```bash
# Deploy updated function
supabase functions deploy legal-ai-chat
```

---

**📅 Last Updated:** 2026-02-04
**🏗️ Architect:** Senior Principal Engineer (CTO Mode)
**📝 Version:** 1.0.0 - Production Ready
