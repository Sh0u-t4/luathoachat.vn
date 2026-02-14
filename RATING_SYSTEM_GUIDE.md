# 📊 Hệ Thống Đánh Giá & Tracking - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Hệ thống đánh giá (Rating System) cho phép người dùng đánh giá chất lượng câu trả lời của AI Assistant bằng nút Like (👍) và Dislike (👎). Tất cả ratings được lưu trữ vào database và tự động cập nhật thống kê.

---

## ✅ Đã Fix Lỗi: "Invariant: headers() expects to have requestAsyncStorage"

### Nguyên nhân lỗi:
- Supabase client được khởi tạo không đúng cách trong Next.js App Router
- API routes gọi `process.env` ở top-level thay vì bên trong function

### Giải pháp đã áp dụng:

#### 1. **Sửa `/lib/supabase.ts`**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'legal-ai-chat-client',
    },
  },
});
```

#### 2. **Sửa API Routes**
Tất cả API routes (`/api/rate-message`, `/api/track-download`) đã được update:
```typescript
export async function POST(request: NextRequest) {
  // Move env vars INSIDE function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Create client with options to avoid Next.js conflicts
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

---

## 📦 Database Schema

### Bảng `message_ratings`
Lưu trữ từng rating cá nhân:
```sql
CREATE TABLE message_ratings (
  id uuid PRIMARY KEY,
  message_id uuid NOT NULL,           -- Link đến chat_messages
  session_id text NOT NULL,           -- Session của user
  user_id uuid,                       -- User ID nếu đã đăng nhập
  rating_type text CHECK (rating_type IN ('like', 'dislike')),
  feedback_text text,                 -- Feedback text (optional)
  ip_address text,                    -- IP address của user
  user_agent text,                    -- Browser info
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Bảng `chat_messages` (Updated)
Đã thêm 4 columns mới để tracking tổng hợp:
```sql
ALTER TABLE chat_messages ADD COLUMN rating_likes int DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN rating_dislikes int DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN rating_score int DEFAULT 0;  -- likes - dislikes
ALTER TABLE chat_messages ADD COLUMN last_rated_at timestamptz;
```

**Lợi ích:**
- ✅ Query nhanh hơn (không cần COUNT mỗi lần)
- ✅ Sort messages theo rating dễ dàng
- ✅ Dashboard hiển thị real-time stats

---

## 🔄 Auto-Update System (Triggers)

### Function: `update_message_rating_stats()`
Tự động chạy mỗi khi có INSERT/UPDATE/DELETE vào `message_ratings`:

```sql
CREATE TRIGGER trigger_update_message_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON message_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_message_rating_stats();
```

**Flow:**
1. User click Like/Dislike → Insert vào `message_ratings`
2. Trigger tự động COUNT likes/dislikes
3. Update `chat_messages` với stats mới
4. Admin view tự động reflect changes

---

## 📊 Admin Views & Helper Functions

### 1. View: `admin_message_ratings`
Join `chat_messages` với `message_ratings` để admin phân tích:

```sql
SELECT * FROM admin_message_ratings
ORDER BY rating_score DESC
LIMIT 10;
```

**Columns:**
- `message_id`, `session_id`, `user_id`
- `content`, `detailed_content` (nội dung câu trả lời)
- `rating_likes`, `rating_dislikes`, `rating_score`
- `total_ratings` (tổng số ratings)
- `individual_ratings` (JSON array chi tiết từng rating)
- `citations` (legal citations)
- `response_time_ms`

### 2. Function: `get_top_rated_messages()`
Lấy top messages có rating tốt nhất:

```sql
SELECT * FROM get_top_rated_messages(
  limit_count := 10,      -- Lấy 10 messages
  min_ratings := 3        -- Ít nhất 3 ratings
);
```

### 3. Function: `get_worst_rated_messages()`
Lấy messages có rating thấp nhất (để cải thiện):

```sql
SELECT * FROM get_worst_rated_messages(
  limit_count := 10,
  min_ratings := 3
);
```

### 4. Function: `get_rating_stats_summary()`
Tổng quan toàn bộ hệ thống:

```sql
SELECT * FROM get_rating_stats_summary();
```

**Returns:**
```json
{
  "total_ratings_given": 1250,
  "total_likes": 980,
  "total_dislikes": 270,
  "total_messages_rated": 456,
  "avg_rating_score": 0.78,
  "positive_rate": 78.4
}
```

---

## 🎨 Frontend Integration

### Client-Side Code (React)
```typescript
const handleRating = async (ratingType: 'like' | 'dislike') => {
  const response = await fetch('/api/rate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageId: message.id,
      sessionId: sessionId,
      userId: user?.id || null,
      ratingType: ratingType,
    }),
  });

  if (response.ok) {
    toast.success('Cảm ơn phản hồi của bạn!');
  }
};
```

### Load Existing Rating
```typescript
useEffect(() => {
  const loadRating = async () => {
    const { data } = await supabase
      .from('message_ratings')
      .select('rating_type')
      .eq('message_id', messageId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (data) {
      setUserRating(data.rating_type);
    }
  };
  loadRating();
}, [messageId, sessionId]);
```

---

## 📈 Admin Dashboard Queries

### Query 1: Messages cần cải thiện (Low ratings)
```sql
SELECT
  content,
  rating_likes,
  rating_dislikes,
  rating_score,
  (rating_likes + rating_dislikes) as total_ratings
FROM chat_messages
WHERE role = 'assistant'
  AND rating_score < -2
  AND (rating_likes + rating_dislikes) >= 3
ORDER BY rating_score ASC
LIMIT 20;
```

### Query 2: Tỷ lệ positive theo thời gian
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE rating_type = 'like') as likes,
  COUNT(*) FILTER (WHERE rating_type = 'dislike') as dislikes,
  ROUND(
    COUNT(*) FILTER (WHERE rating_type = 'like')::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as positive_rate
FROM message_ratings
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Query 3: User feedback patterns
```sql
SELECT
  session_id,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating_type = 'like') as likes,
  COUNT(*) FILTER (WHERE rating_type = 'dislike') as dislikes
FROM message_ratings
GROUP BY session_id
HAVING COUNT(*) >= 3
ORDER BY COUNT(*) DESC
LIMIT 50;
```

---

## 🔧 Troubleshooting

### Issue 1: Rating không lưu được
**Kiểm tra:**
```sql
-- Check RLS policies
SELECT * FROM message_ratings LIMIT 1;

-- Check if session_id valid
SELECT session_id, COUNT(*)
FROM message_ratings
GROUP BY session_id;
```

### Issue 2: Stats không cập nhật
**Fix:**
```sql
-- Manually trigger update for specific message
SELECT update_message_rating_stats()
FROM message_ratings
WHERE message_id = 'your-message-id'
LIMIT 1;

-- Or backfill all messages
UPDATE chat_messages m
SET
  rating_likes = (SELECT COUNT(*) FROM message_ratings r WHERE r.message_id = m.id AND r.rating_type = 'like'),
  rating_dislikes = (SELECT COUNT(*) FROM message_ratings r WHERE r.message_id = m.id AND r.rating_type = 'dislike'),
  rating_score = (SELECT COUNT(*) FILTER (WHERE rating_type = 'like') - COUNT(*) FILTER (WHERE rating_type = 'dislike') FROM message_ratings r WHERE r.message_id = m.id)
WHERE m.role = 'assistant';
```

### Issue 3: "Invariant: headers()" error vẫn còn
**Debug steps:**
1. Clear browser cache hoàn toàn
2. Restart dev server
3. Check console logs:
```javascript
console.log('[Rating] messageId:', messageId);
console.log('[Rating] sessionId:', sessionId);
```
4. Verify env vars loaded:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🚀 Next Steps

### Phase 1: Current (✅ Done)
- [x] Setup database schema
- [x] Create triggers & functions
- [x] Fix Next.js conflicts
- [x] Implement frontend rating buttons

### Phase 2: Analytics Dashboard (Pending)
- [ ] Create admin dashboard page at `/quan-tri/danh-gia`
- [ ] Visualize rating trends (Charts)
- [ ] Export rating data to CSV
- [ ] Realtime rating notifications

### Phase 3: AI Quality Improvement (Pending)
- [ ] Auto-flag messages with rating_score < -3
- [ ] Send low-rated messages to AI training pipeline
- [ ] A/B testing different prompt versions
- [ ] Feedback loop để cải thiện AI

---

## 📞 Support

Nếu cần hỗ trợ thêm về hệ thống rating, liên hệ dev team hoặc check:
- Migration file: `supabase/migrations/*_add_rating_tracking_to_chat_messages.sql`
- API routes: `app/api/rate-message/route.ts`
- Components: `components/chat/assistant-message.tsx`

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Status:** ✅ Production Ready
