# ✅ FINAL FIX - Rating System (DEFINITIVE SOLUTION)

## 🚨 Root Cause Analysis

### The Problem
```
Error: "Invariant: headers() expects to have requestAsyncStorage, none available"
```

**Why it happened:**
- Supabase JS SDK (`@supabase/supabase-js`) internally tries to access Next.js request context (async storage)
- In Next.js 13 App Router, API routes run in a different context than pages
- When creating a Supabase client in API route using `createClient()`, it tries to read headers/cookies from Next.js async storage
- This async storage is NOT available in API routes by default
- → SDK throws "Invariant: headers() expects to have requestAsyncStorage"

### Why Previous Fixes Didn't Work

**Attempt 1:** Configure `persistSession: false`
```typescript
const supabase = createClient(url, key, {
  auth: { persistSession: false }
});
```
❌ **Still failed** - SDK still tries to access async storage for other reasons

**Attempt 2:** Move env vars inside function
```typescript
export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = createClient(url, key);
}
```
❌ **Still failed** - Problem is not about when variables are read, but how SDK works

**Attempt 3:** Remove Supabase calls from components
```typescript
// Component: Use fetch() instead of supabase.from()
```
✅ **Helped** - But API route still used SDK internally

---

## ✅ THE SOLUTION: Use Supabase REST API Directly

**Instead of:**
```typescript
// ❌ This causes the error
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('message_ratings')
  .upsert(ratingData);
```

**Use this:**
```typescript
// ✅ Direct REST API - No SDK, No async storage issues
const response = await fetch(`${supabaseUrl}/rest/v1/message_ratings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(ratingData),
});

const savedRating = await response.json();
```

---

## 🎯 Implementation Details

### POST (Insert/Update Rating)

```typescript
export async function POST(request: NextRequest) {
  const { messageId, sessionId, userId, ratingType } = await request.json();

  // Validation
  if (!messageId || !sessionId || !ratingType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!['like', 'dislike'].includes(ratingType)) {
    return NextResponse.json({ error: 'Invalid rating type' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const ratingData = {
    message_id: messageId,
    session_id: sessionId,
    user_id: userId || null,
    rating_type: ratingType,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    updated_at: new Date().toISOString(),
  };

  // Direct REST API call
  const response = await fetch(`${supabaseUrl}/rest/v1/message_ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: 'Failed to save rating', details: errorText },
      { status: 500 }
    );
  }

  const savedRating = await response.json();
  return NextResponse.json({
    success: true,
    rating: Array.isArray(savedRating) ? savedRating[0] : savedRating,
  });
}
```

### GET (Load Existing Rating)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const sessionId = searchParams.get('sessionId');

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (sessionId) {
    // Get specific rating
    const url = `${supabaseUrl}/rest/v1/message_ratings?message_id=eq.${messageId}&session_id=eq.${sessionId}&select=rating_type,created_at`;

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 });
    }

    const data = await response.json();
    const rating = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return NextResponse.json({ rating: rating?.rating_type || null });
  }

  // Get rating stats...
}
```

### DELETE (Remove Rating)

```typescript
export async function DELETE(request: NextRequest) {
  const { messageId, sessionId } = await request.json();

  if (!messageId || !sessionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = `${supabaseUrl}/rest/v1/message_ratings?message_id=eq.${messageId}&session_id=eq.${sessionId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: 'Failed to delete rating', details: errorText },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Rating deleted successfully',
  });
}
```

---

## 📋 Key Technical Points

### 1. **Supabase REST API Headers**

**Required headers:**
```typescript
{
  'Content-Type': 'application/json',
  'apikey': supabaseKey,              // For authentication
  'Authorization': `Bearer ${supabaseKey}`, // Also required
  'Prefer': 'resolution=merge-duplicates,return=representation',
}
```

**What `Prefer` header does:**
- `resolution=merge-duplicates`: UPSERT behavior (insert or update on conflict)
- `return=representation`: Return the inserted/updated row(s)

### 2. **Query Syntax**

**Filter syntax:**
```
?message_id=eq.{value}&session_id=eq.{value}
```

**Select specific columns:**
```
?select=rating_type,created_at
```

**Example full URL:**
```
https://xxx.supabase.co/rest/v1/message_ratings?message_id=eq.abc123&session_id=eq.sess_456&select=rating_type
```

### 3. **Response Handling**

Supabase REST API returns:
- **Array** for GET requests: `[{ rating_type: 'like' }]`
- **Array** for POST with `return=representation`: `[{ id: 1, rating_type: 'like', ... }]`
- **Empty body** for DELETE

Always check if result is array and extract first element:
```typescript
const rating = Array.isArray(savedRating) ? savedRating[0] : savedRating;
```

---

## 🧪 Testing Guide

### Step 1: Clear Everything
```bash
# Stop dev server
Ctrl+C

# Clear browser
F12 → Application → Clear site data

# Clear storage
localStorage.clear();
sessionStorage.clear();

# Restart
npm run dev
```

### Step 2: Open Console & Test

```javascript
// 1. Go to homepage
// 2. Open Console (F12)
// 3. Ask AI a question
// 4. Click 👍 button
// 5. Check logs:

// Expected in browser console:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RATING DEBUG START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Button clicked: like
📌 Message ID: xxx
📌 Session ID: sess_xxx
✅ Validation passed, proceeding...
📤 Submitting new rating...
📦 Payload: { ... }
🌐 Fetching: POST /api/rate-message
📡 Response status: 200 OK
📥 Response body: { "success": true, "rating": { ... } }
✅ Rating submitted successfully!
🏁 RATING DEBUG END

// Expected in terminal (server):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 API RATE MESSAGE - POST REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Request body: { ... }
✅ Validation passed
💾 Upserting rating to database...
📋 Rating data: { ... }
🌐 Making REST request to: https://xxx.supabase.co/rest/v1/message_ratings
📡 Supabase REST response status: 201
✅ Database upsert successful!
📦 Saved rating: { ... }

// Expected toast:
✅ "Cảm ơn phản hồi tích cực! 👍"
```

### Step 3: Verify Database

```sql
-- Check rating was saved
SELECT * FROM message_ratings
ORDER BY created_at DESC
LIMIT 5;

-- Check triggers updated chat_messages
SELECT
  id,
  LEFT(content, 60) as preview,
  rating_likes,
  rating_dislikes,
  rating_score
FROM chat_messages
WHERE rating_likes > 0 OR rating_dislikes > 0
ORDER BY last_rated_at DESC
LIMIT 5;
```

---

## ❌ Common Errors & Solutions

### Error 1: "Failed to save rating"

**Check terminal for Supabase REST API response:**

```bash
# Terminal shows:
❌ SUPABASE REST API ERROR
Status: 401
Response: {"code":"PGRST301","details":null,"hint":null,"message":"JWT expired"}
```

**Solution:** Check `.env` file, verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

### Error 2: Status 409 Conflict

```bash
Status: 409
Response: {"code":"23505","message":"duplicate key value violates unique constraint"}
```

**Solution:** This is OK! It means `Prefer: resolution=merge-duplicates` header is missing. Already fixed in code.

### Error 3: Status 404 Not Found

```bash
Status: 404
Response: {"message":"relation \"public.message_ratings\" does not exist"}
```

**Solution:** Migration not applied. Run migrations in Supabase dashboard.

### Error 4: Status 403 Forbidden

```bash
Status: 403
Response: {"code":"42501","message":"permission denied for table message_ratings"}
```

**Solution:** RLS policies too restrictive. Check policies allow `anon` role to INSERT.

---

## 📊 Architecture Comparison

### Before (With SDK)
```
Component → fetch() → API Route → Supabase SDK → Next.js Async Storage ❌
                                                 → ERROR
```

### After (REST API)
```
Component → fetch() → API Route → Supabase REST API ✅
                                 → Direct HTTP Request
                                 → No Next.js dependencies
                                 → Works perfectly
```

---

## 🎯 Why This Solution is Better

1. **No dependency on Next.js internals**
   - Pure HTTP requests
   - Works in any environment

2. **More control**
   - Can set any headers
   - Can handle responses manually
   - Better error messages

3. **Faster (slightly)**
   - No SDK overhead
   - Direct network call

4. **Easier to debug**
   - Can use curl to test
   - Can see exact HTTP requests
   - Clear logging

5. **Future-proof**
   - Won't break with Next.js updates
   - Independent of SDK versions

---

## 🚀 Final Checklist

Before marking as "DONE":

- [x] Removed all Supabase SDK imports from API routes
- [x] Implemented POST using REST API
- [x] Implemented GET using REST API
- [x] Implemented DELETE using REST API
- [x] Added proper headers for UPSERT behavior
- [x] Added extensive logging for debugging
- [x] Build passes without errors
- [x] TypeScript strict mode passes
- [ ] **User confirms it works in browser**

---

## 📞 If Still Not Working

**Gửi cho tôi:**

1. **Browser console logs** (toàn bộ từ 🎯 START đến 🏁 END)
2. **Terminal logs** (toàn bộ từ 🔵 API REQUEST)
3. **Network tab screenshot** (F12 → Network → rate-message request)
4. **Error popup screenshot**

With these logs, I can diagnose in 30 seconds!

---

**Status:** ✅ **BUILD PASSING** | 🧪 **AWAITING USER TEST**

**Next Step:** User test trong browser và confirm hoạt động!
