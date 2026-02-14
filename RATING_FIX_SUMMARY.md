# 🔧 Tóm Tắt Fix Lỗi Rating System

## ❌ Lỗi Ban Đầu
```
Không thể gửi đánh giá
Invariant: headers() expects to have requestAsyncStorage, none available.
```

---

## 🔍 Nguyên Nhân Gốc Rễ

### Problem 1: Direct Supabase Client Calls trong React Component
Component `assistant-message.tsx` đang gọi **Supabase client trực tiếp** ở nhiều nơi:

```typescript
// ❌ WRONG - Gây lỗi trong Next.js App Router
const { data, error } = await supabase
  .from('message_ratings')
  .select('rating_type')
  .eq('message_id', message.id)
  .maybeSingle();

// ❌ WRONG - Gây conflict với Next.js async storage
const { data: { user } } = await supabase.auth.getUser();
```

**Tại sao lỗi?**
- Next.js App Router sử dụng React Server Components architecture
- Supabase client cố gắng access `requestAsyncStorage` để persist sessions
- Client components không có access đến server-side async storage
- → Conflict và throw error "Invariant: headers()"

### Problem 2: Top-Level Environment Variables
```typescript
// ❌ WRONG - Top level trong API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
}
```

**Tại sao lỗi?**
- Module-level code chạy khi import, không phải khi runtime
- Có thể gây timing issues với Next.js edge runtime
- Best practice: Move vào trong function body

---

## ✅ Giải Pháp Đã Áp Dụng

### Fix 1: Refactor Component - Chỉ Dùng Fetch API

**Before:**
```typescript
// ❌ Direct Supabase call
const { data, error } = await supabase
  .from('message_ratings')
  .select('rating_type')
  .eq('message_id', message.id)
  .maybeSingle();
```

**After:**
```typescript
// ✅ Use API route
const response = await fetch(
  `/api/rate-message?messageId=${message.id}&sessionId=${sessionId}`,
  { method: 'GET' }
);

if (response.ok) {
  const result = await response.json();
  setUserRating(result.rating);
}
```

### Fix 2: Remove All Supabase Imports từ Component

**Before:**
```typescript
import { supabase } from '@/lib/supabase'; // ❌
```

**After:**
```typescript
// ✅ Removed - Use fetch API instead
```

### Fix 3: API Route Improvements

#### A. Move Env Vars Inside Function
```typescript
export async function POST(request: NextRequest) {
  // ✅ Inside function body
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,    // ✅ Disable session persistence
      autoRefreshToken: false,  // ✅ Disable auto refresh
    },
  });
}
```

#### B. Add DELETE Method
```typescript
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { messageId, sessionId } = body;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase
    .from('message_ratings')
    .delete()
    .eq('message_id', messageId)
    .eq('session_id', sessionId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

#### C. Fix GET Method Response
```typescript
// ✅ Return only rating_type, not entire object
return NextResponse.json({ rating: data?.rating_type || null });
```

---

## 📐 Kiến Trúc Mới (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  USER INTERFACE (React Component)                           │
│  - assistant-message.tsx                                     │
│  - Chỉ dùng fetch() API                                      │
│  - Không gọi Supabase trực tiếp                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP Request
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  API LAYER (Next.js API Routes)                             │
│  - /api/rate-message (GET, POST, DELETE)                    │
│  - Handle Supabase operations                                │
│  - Stateless client config                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Supabase SDK
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (Supabase PostgreSQL)                             │
│  - message_ratings table                                     │
│  - Auto-update triggers                                      │
│  - RLS policies                                              │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ No more Next.js conflicts
- ✅ Easier to test and debug
- ✅ Consistent error handling
- ✅ Better security (API routes validate inputs)

---

## 🧪 Testing Flow

### 1. Load Existing Rating
```
Component Mount
    → useEffect runs
    → fetch('/api/rate-message?messageId=xxx&sessionId=yyy')
    → API route queries database
    → Return { rating: 'like' | 'dislike' | null }
    → Component displays correct button state
```

### 2. Submit New Rating
```
User clicks 👍 button
    → handleRating('like')
    → fetch('/api/rate-message', { method: 'POST', body: {...} })
    → API route upserts to database
    → Trigger auto-updates chat_messages stats
    → Return { success: true, rating: {...} }
    → Component shows success toast
    → Button state changes to active
```

### 3. Remove Rating (Click Same Button Again)
```
User clicks 👍 again (already liked)
    → handleRating('like')
    → Detects userRating === 'like'
    → fetch('/api/rate-message', { method: 'DELETE', body: {...} })
    → API route deletes from database
    → Trigger auto-updates chat_messages stats
    → Return { success: true }
    → Component shows "Đã xóa đánh giá"
    → Button state changes to inactive
```

---

## 🔍 Debug Checklist

Nếu vẫn gặp lỗi, check theo thứ tự:

### ✅ 1. Clear Browser Cache
```bash
# Chrome DevTools
F12 → Application → Clear Storage → Clear Site Data
# Or
Ctrl+Shift+Delete → Clear Cached Images and Files
```

### ✅ 2. Verify Session ID
```typescript
// Open Console (F12)
console.log('SessionId:', sessionId);
// Should see: sess_1234567890_xxxxx
// NOT: "no-session" or undefined
```

### ✅ 3. Check API Logs
```typescript
// Look for these in console:
[Rating] Loading existing rating for: {...}
[Rating] Submitting rating: {...}
[Rate Message] Request: {...}
[Rate Message] Success: {...}
```

### ✅ 4. Verify Database
```sql
-- Check if rating was saved
SELECT * FROM message_ratings
ORDER BY created_at DESC
LIMIT 5;

-- Check if stats were updated
SELECT
  id,
  content,
  rating_likes,
  rating_dislikes,
  rating_score
FROM chat_messages
WHERE role = 'assistant'
ORDER BY last_rated_at DESC NULLS LAST
LIMIT 5;
```

### ✅ 5. Check Network Tab
```
DevTools → Network → Filter: "rate-message"
- Status should be 200 OK
- Response should show { "success": true }
- If 500 error, check API logs
```

---

## 📊 Verification Queries

### Query 1: Recent Ratings
```sql
SELECT
  mr.id,
  mr.rating_type,
  mr.session_id,
  LEFT(cm.content, 50) as message_preview,
  mr.created_at
FROM message_ratings mr
JOIN chat_messages cm ON cm.id = mr.message_id
ORDER BY mr.created_at DESC
LIMIT 10;
```

### Query 2: Messages with Stats
```sql
SELECT
  id,
  LEFT(content, 60) as message_preview,
  rating_likes,
  rating_dislikes,
  rating_score,
  (rating_likes + rating_dislikes) as total_ratings,
  last_rated_at
FROM chat_messages
WHERE role = 'assistant'
  AND (rating_likes + rating_dislikes) > 0
ORDER BY rating_score DESC;
```

### Query 3: Rating Distribution
```sql
SELECT
  rating_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM message_ratings
GROUP BY rating_type;
```

---

## 🎯 Changes Summary

| File | Changes | Status |
|------|---------|--------|
| `components/chat/assistant-message.tsx` | Remove Supabase imports, use fetch API | ✅ Fixed |
| `app/api/rate-message/route.ts` | Add DELETE method, fix GET response | ✅ Enhanced |
| `app/api/track-download/route.ts` | Move env vars inside function | ✅ Fixed |
| `lib/supabase.ts` | Add proper client config | ✅ Fixed |
| Database | Add rating tracking columns & triggers | ✅ Migrated |

---

## 🚀 Production Checklist

Before deploying to production:

- [x] Build passes without errors
- [x] TypeScript strict mode passes
- [x] All Supabase direct calls removed from components
- [x] API routes use stateless client config
- [x] Database triggers working correctly
- [x] RLS policies protect data
- [ ] Test in production-like environment
- [ ] Monitor error logs for 24h after deploy
- [ ] Set up alerts for rating failures

---

## 📝 Lessons Learned

### ✅ DO:
1. **Always use API routes** for database operations in Next.js App Router
2. **Stateless Supabase clients** in API routes (`persistSession: false`)
3. **Move env vars inside functions** in API routes
4. **Clear separation** between UI and data layers
5. **Proper error handling** at every layer

### ❌ DON'T:
1. **Never call Supabase directly** from client components
2. **Never use `supabase.auth.getUser()`** in components
3. **Never initialize Supabase** at module level with defaults
4. **Never assume** environment variables are always available
5. **Never skip** proper TypeScript typing

---

**Last Updated:** 2026-02-14
**Status:** ✅ **FIXED & TESTED**
**Build:** ✅ **PASSING**
**Ready for:** Production Deployment
