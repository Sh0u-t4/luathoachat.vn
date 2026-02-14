# 🔍 DEBUG RATING SYSTEM - Step by Step Guide

## 🚨 Tình Trạng Hiện Tại
User báo: **"Vẫn không thể đánh giá được câu trả lời"**

## ✅ Đã Làm Gì?
1. ✅ Removed tất cả Supabase direct calls từ component
2. ✅ Refactored để dùng fetch() API
3. ✅ Fixed API routes configuration
4. ✅ Verified RLS policies (cho phép anon users)
5. ✅ Checked database constraints (UNIQUE key OK)
6. ✅ **Added extensive debug logging**

---

## 🧪 CÁC BƯỚC DEBUG (5 PHÚT)

### Bước 1: Clear Everything

**Quan trọng: Phải làm theo thứ tự này!**

```
1. Stop dev server (Ctrl+C trong terminal)

2. Clear browser cache:
   - Chrome: F12 → Application → Clear site data → Clear all
   - Or: Ctrl+Shift+Delete → Clear everything

3. Clear localStorage:
   - F12 → Console → Run:
   localStorage.clear();
   sessionStorage.clear();

4. Close all browser tabs của localhost:3000

5. Restart dev server:
   npm run dev

6. Open NEW incognito/private window:
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P

7. Open Console TRƯỚC KHI vào trang:
   F12 → Console tab
```

### Bước 2: Test với Debug Logs

**Mở Console (F12) và giữ mở trong suốt quá trình**

```javascript
// 1. Vào trang chủ: http://localhost:3000
// Check console logs xuất hiện:
// [ChatContext] Initialized sessionId: sess_...

// 2. Gõ câu hỏi: "Axit HCl cần giấy phép gì?"

// 3. Đợi AI trả lời

// 4. Click nút 👍 (LIKE)

// Quan sát console logs theo thứ tự:
```

**Expected Console Logs Sequence:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RATING DEBUG START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Button clicked: like
📌 Message ID: <uuid>
📌 Session ID: sess_...
📌 Current rating: null
📌 Is submitting: false
✅ Validation passed, proceeding...
📤 Submitting new rating...
📦 Payload: {
  "messageId": "...",
  "sessionId": "sess_...",
  "userId": null,
  "ratingType": "like"
}
🌐 Fetching: POST /api/rate-message
```

**Sau đó trong terminal (server logs):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 API RATE MESSAGE - POST REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Request body: {
  "messageId": "...",
  "sessionId": "sess_...",
  "userId": null,
  "ratingType": "like"
}
💾 Upserting rating to database...
📋 Rating data: {
  "message_id": "...",
  "session_id": "sess_...",
  "user_id": null,
  "rating_type": "like",
  "ip_address": "...",
  "user_agent": "...",
  "updated_at": "2026-02-14T..."
}
✅ Database upsert successful!
📦 Saved rating: { ... }
```

**Quay lại browser console:**

```
📡 Response status: 200 OK
📥 Response body: {
  "success": true,
  "rating": { ... }
}
✅ Rating submitted successfully!
🏁 RATING DEBUG END
```

**Và Toast notification:**
```
✅ "Cảm ơn phản hồi tích cực! 👍"
```

---

## ❌ TROUBLESHOOTING - Nếu Có Lỗi

### Scenario 1: Console shows "❌ VALIDATION FAILED: Missing message.id"

**Cause:** Message chưa có ID (chưa được save vào database)

**Fix:**
```javascript
// Check message object
console.log('Full message:', message);

// Nếu message.id là undefined → Message chưa được lưu DB
// → Check chat interface có save messages vào DB không
```

### Scenario 2: Console shows "❌ VALIDATION FAILED: Invalid sessionId"

**Cause:** SessionId chưa được khởi tạo

**Fix:**
```javascript
// Check sessionId
console.log('Session:', localStorage.getItem('chat_session_token'));

// Nếu null hoặc "no-session":
localStorage.removeItem('chat_session_token');
window.location.reload();
```

### Scenario 3: API returns "❌ DATABASE ERROR"

**Check terminal logs để xem error details:**

```bash
# Common errors:

# Error: "relation does not exist"
→ Migration chưa chạy
→ Fix: Check Supabase dashboard → Migrations

# Error: "permission denied"
→ RLS policies block request
→ Fix: Check policies, verify anon role có quyền INSERT

# Error: "violates foreign key constraint"
→ message_id không tồn tại trong chat_messages
→ Fix: Verify message đã được lưu vào DB trước

# Error: "duplicate key value"
→ Unique constraint violation
→ Fix: Đây là OK! Chỉ cần dùng upsert thay vì insert
```

### Scenario 4: Network Error / Fetch Failed

**Check Network tab (F12 → Network):**

```
1. Filter: "rate-message"
2. Click request
3. Check:
   - Status: Should be 200 OK
   - Request payload: Có messageId, sessionId không?
   - Response: {"success": true} hay error?

Common issues:
- Status 404: API route không tồn tại → Check route.ts location
- Status 500: Server error → Check terminal logs
- CORS error: Unlikely trong Next.js same-origin
- Failed to fetch: Dev server stopped → Restart npm run dev
```

### Scenario 5: Button Không Đổi Màu

**Check:**

```javascript
// After click, check state
console.log('userRating state:', userRating);

// Should change from null → 'like'

// If stuck at null:
// → State update failed
// → Check setUserRating(ratingType) được gọi chưa
// → Check có error throw trước setUserRating không
```

---

## 🔬 Direct API Testing

**Test API trực tiếp bằng curl (bypass frontend):**

```bash
# Test 1: Submit a like rating
curl -X POST http://localhost:3000/api/rate-message \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-message-123",
    "sessionId": "test-session-456",
    "userId": null,
    "ratingType": "like"
  }' | jq

# Expected output:
# {
#   "success": true,
#   "rating": { ... }
# }

# If error → Check terminal logs for database error
```

```bash
# Test 2: Load existing rating
curl "http://localhost:3000/api/rate-message?messageId=test-message-123&sessionId=test-session-456" | jq

# Expected:
# {
#   "rating": "like"
# }
```

```bash
# Test 3: Delete rating
curl -X DELETE http://localhost:3000/api/rate-message \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-message-123",
    "sessionId": "test-session-456"
  }' | jq

# Expected:
# {
#   "success": true,
#   "message": "Rating deleted successfully"
# }
```

---

## 📊 Database Verification

**Sau khi click LIKE, check database:**

```sql
-- 1. Check if rating was saved
SELECT
  id,
  message_id,
  session_id,
  rating_type,
  created_at
FROM message_ratings
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should see new row with your session_id and rating_type='like'

-- 2. Check if trigger updated chat_messages stats
SELECT
  id,
  LEFT(content, 60) as preview,
  rating_likes,
  rating_dislikes,
  rating_score,
  last_rated_at
FROM chat_messages
WHERE role = 'assistant'
  AND last_rated_at IS NOT NULL
ORDER BY last_rated_at DESC
LIMIT 5;

-- Expected: rating_likes should increase by 1

-- 3. Check RLS policies are allowing access
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'message_ratings'
ORDER BY cmd;

-- Expected: Should see policies for anon role on INSERT, UPDATE, DELETE, SELECT
```

---

## 📝 Checklist - Gửi Cho Developer

Nếu sau tất cả các bước trên vẫn lỗi, copy checklist này và điền thông tin:

```markdown
## Rating System Debug Report

### Environment
- [ ] Dev server running: YES / NO
- [ ] Browser: Chrome / Firefox / Safari / Edge
- [ ] Browser version: _______
- [ ] Cleared cache: YES / NO
- [ ] Using incognito: YES / NO
- [ ] Console open: YES / NO

### Step-by-Step Reproduction
1. [ ] Went to homepage
2. [ ] Asked question: "_________"
3. [ ] AI responded successfully
4. [ ] Clicked 👍 button
5. [ ] Error appeared: YES / NO

### Console Logs (Browser)
```
[Paste all console logs here, especially lines with:
- 🎯 RATING DEBUG START
- ❌ Any errors
- 📡 Response status
]
```

### Server Logs (Terminal)
```
[Paste terminal logs with:
- 🔵 API RATE MESSAGE
- ❌ Any errors
- 💾 Database operations
]
```

### Network Tab
- Request URL: /api/rate-message
- Method: POST
- Status: ___
- Request Payload:
```json
{Paste request body}
```
- Response:
```json
{Paste response}
```

### Database Check
```sql
-- Run this and paste result:
SELECT COUNT(*) FROM message_ratings;
-- Result: ___

SELECT id, rating_type FROM message_ratings ORDER BY created_at DESC LIMIT 3;
-- Result: ___
```

### Screenshots
- [ ] Attached screenshot of error popup
- [ ] Attached screenshot of console
- [ ] Attached screenshot of network tab
```

---

## 🎯 Success Criteria

**Test PASSED khi:**

✅ Console logs xuất hiện đầy đủ theo thứ tự
✅ No ❌ errors trong console
✅ API returns status 200 OK
✅ Toast "Cảm ơn..." xuất hiện
✅ Button đổi màu (active state)
✅ Database có record mới
✅ chat_messages.rating_likes tăng lên

**Test FAILED khi:**

❌ Bất kỳ error nào trong console
❌ API returns 4xx or 5xx status
❌ Toast không xuất hiện hoặc error toast
❌ Button không đổi màu
❌ Database không có record mới

---

## 🚀 Next Steps After Debugging

**Nếu logs cho thấy:**

1. **"Missing message.id"** → Problem in ChatInterface component (messages not saved)
2. **"Invalid sessionId"** → Problem in session initialization
3. **Database error** → Check migration, RLS, or constraints
4. **Network error** → Dev server issue or wrong API path
5. **"Rating submitted successfully" nhưng button không đổi** → React state update issue

**Gửi cho tôi:**
- Full console logs
- Terminal logs
- Database query results
- Screenshots

Tôi sẽ diagnose chính xác vấn đề dựa trên logs!

---

**Good luck debugging! 🔧**
