# 🧪 Hướng Dẫn Test Thủ Công Rating System

## ✅ Các lỗi đã được fix:
- ❌ "Invariant: headers() expects to have requestAsyncStorage" → ✅ FIXED
- ❌ Direct Supabase calls trong component → ✅ REFACTORED
- ❌ Top-level env vars trong API routes → ✅ MOVED

---

## 📝 Quy Trình Test (5 phút)

### Bước 1: Clear Cache Hoàn Toàn (QUAN TRỌNG!)

**Chrome/Edge:**
```
1. Nhấn F12 (mở DevTools)
2. Tab "Application"
3. "Storage" → "Clear site data"
4. Check tất cả boxes
5. Click "Clear site data"
6. Đóng DevTools
7. Nhấn Ctrl+Shift+R (hard reload)
```

**Firefox:**
```
1. Nhấn Ctrl+Shift+Delete
2. Chọn "Everything"
3. Check "Cookies" và "Cache"
4. Click "Clear Now"
5. Reload trang: Ctrl+Shift+R
```

**Safari:**
```
1. Develop → Empty Caches
2. Option+Command+R (hard reload)
```

### Bước 2: Mở Console để Debug

```
1. Nhấn F12
2. Tab "Console"
3. Filter: [Rating]
4. Giữ console mở trong suốt quá trình test
```

### Bước 3: Vào Trang Chat

```
1. Truy cập: http://localhost:3000
2. Wait cho trang load hoàn toàn
3. Check console log: "[ChatContext] Initialized sessionId: sess_..."
4. Nếu không thấy → F5 reload lại
```

### Bước 4: Gửi Câu Hỏi

```
1. Gõ câu hỏi: "Axit HCl cần giấy phép gì?"
2. Click "Gửi" hoặc Enter
3. Đợi AI trả lời (3-5 giây)
4. Kiểm tra có xuất hiện nút 👍 👎 không
```

### Bước 5: Test Click LIKE (👍)

**Expected behavior:**
```
✅ Console logs xuất hiện:
   [Rating] Starting rating process: { messageId: "...", sessionId: "sess_...", ratingType: "like" }
   [Rating] Submitting rating: { ... }
   [Rate Message] Request: { ... }
   [Rate Message] Upserting rating: { ... }
   [Rate Message] Success: { ... }

✅ Toast notification xuất hiện:
   "Cảm ơn phản hồi tích cực! 👍"

✅ Button state thay đổi:
   - 👍 button: Màu xanh (active)
   - 👎 button: Màu xám (inactive)
```

**Nếu lỗi:**
```
❌ Console shows error:
   Screenshot error + Copy toàn bộ text → Gửi cho tôi

❌ Toast shows "Không thể gửi đánh giá":
   - Check Network tab (F12 → Network)
   - Filter: "rate-message"
   - Click request → Preview → Copy response → Gửi cho tôi
```

### Bước 6: Test Click LIKE Lần Nữa (Remove Rating)

**Expected behavior:**
```
✅ Console logs:
   [Rating] Starting rating process: { ... ratingType: "like" }
   [Rate Message DELETE] Request: { ... }
   [Rate Message DELETE] Success

✅ Toast notification:
   "Đã xóa đánh giá"

✅ Button state:
   - 👍 button: Màu xám (inactive)
   - 👎 button: Màu xám (inactive)
```

### Bước 7: Test Click DISLIKE (👎)

**Expected behavior:**
```
✅ Console logs:
   [Rating] Starting rating process: { ... ratingType: "dislike" }
   [Rate Message] Success: { ... }

✅ Toast notification:
   "Cảm ơn phản hồi của bạn! 👎"

✅ Button state:
   - 👍 button: Màu xám (inactive)
   - 👎 button: Màu đỏ/xám tối (active)
```

### Bước 8: Verify Database (Admin Only)

**Option A: Supabase Dashboard**
```
1. Login Supabase dashboard
2. Go to "Table Editor"
3. Select "message_ratings"
4. Check if new rows appear with your sessionId
5. Verify rating_type = "like" or "dislike"
```

**Option B: SQL Query**
```sql
-- Xem ratings mới nhất
SELECT
  mr.id,
  mr.rating_type,
  mr.session_id,
  LEFT(cm.content, 60) as message_preview,
  mr.created_at
FROM message_ratings mr
LEFT JOIN chat_messages cm ON cm.id = mr.message_id
ORDER BY mr.created_at DESC
LIMIT 10;

-- Xem messages có stats
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
LIMIT 10;
```

---

## 🔍 Troubleshooting Guide

### Issue 1: "Không thể gửi đánh giá" vẫn xuất hiện

**Debug Steps:**
```javascript
// 1. Check console logs
// Tìm dòng có [Rating] hoặc [Rate Message]
// Copy toàn bộ error stack trace

// 2. Check Network tab
F12 → Network → Filter: "rate-message"
// Click request → Headers → Copy Request Headers
// Click request → Preview → Copy Response

// 3. Verify sessionId
console.log(localStorage.getItem('chat_session_token'));
// Should show: "sess_1234567890_xxxxx"
// NOT: null or undefined
```

**Possible causes:**
```
❌ SessionId chưa được khởi tạo
   Fix: Reload trang (F5)

❌ API route không hoạt động
   Fix: Check terminal logs, restart dev server

❌ Database connection issue
   Fix: Verify .env file có SUPABASE_URL và SUPABASE_ANON_KEY

❌ RLS policies block request
   Fix: Check Supabase logs, verify policies allow anon access
```

### Issue 2: Button không đổi màu sau khi click

**Possible causes:**
```
❌ React state không update
   Check console: [Rating] Success log có xuất hiện không?

❌ CSS issue
   Check Elements tab: Button có class "active" không?

❌ Multiple clicks too fast
   Wait 1 second giữa các clicks
```

### Issue 3: Rating không lưu vào database

**Verify API endpoint:**
```bash
# Test POST request
curl -X POST http://localhost:3000/api/rate-message \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-msg-123",
    "sessionId": "test-sess-456",
    "ratingType": "like"
  }'

# Expected response:
# { "success": true, "rating": { ... } }
```

**Check database directly:**
```sql
-- Count total ratings
SELECT COUNT(*) FROM message_ratings;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'message_ratings';
```

### Issue 4: "Session chưa được khởi tạo"

**Fix:**
```javascript
// 1. Clear localStorage
localStorage.clear();

// 2. Reload page
window.location.reload();

// 3. Check if new session created
console.log(localStorage.getItem('chat_session_token'));
```

---

## 📊 Test Checklist

Copy checklist này và check off khi test:

```
Test Environment:
[ ] Dev server đang chạy (npm run dev)
[ ] Browser cache đã clear
[ ] Console (F12) đã mở
[ ] Network tab đã mở

Basic Functionality:
[ ] Trang load không có error
[ ] SessionId được tạo trong console
[ ] Chat input hoạt động
[ ] AI trả lời message
[ ] Nút 👍 👎 xuất hiện

Rating LIKE:
[ ] Click 👍 thành công
[ ] Toast "Cảm ơn..." xuất hiện
[ ] Button đổi thành active state
[ ] Console logs [Rating] Success
[ ] Network request 200 OK

Rating DISLIKE:
[ ] Click 👎 thành công
[ ] Toast xuất hiện
[ ] Button đổi thành active state
[ ] Console logs Success
[ ] Network request 200 OK

Remove Rating:
[ ] Click 👍 lần 2 (đang active)
[ ] Toast "Đã xóa" xuất hiện
[ ] Button về inactive state
[ ] Network DELETE request 200 OK

Database Verification (Admin):
[ ] message_ratings có records mới
[ ] chat_messages có rating_likes/dislikes updated
[ ] Trigger tự động cập nhật stats
[ ] RLS policies cho phép read/write
```

---

## 🚨 Khi Nào Cần Report Lỗi?

**Report lỗi nếu:**
1. ✅ Đã clear cache hoàn toàn
2. ✅ Đã reload hard (Ctrl+Shift+R)
3. ✅ Đã restart dev server
4. ✅ Vẫn thấy error "Không thể gửi đánh giá"

**Thông tin cần cung cấp:**
```
1. Screenshot error popup
2. Console logs (filter [Rating])
3. Network tab screenshot (rate-message request)
4. Browser & version (Chrome 120, Firefox 121, etc)
5. Operating System (Windows 11, macOS 14, etc)
6. Steps to reproduce (exact clicks/actions)
```

**Format report:**
```markdown
## Bug Report

**Environment:**
- OS: Windows 11
- Browser: Chrome 120
- Dev Server: Running on localhost:3000

**Steps to Reproduce:**
1. Clear cache
2. Go to homepage
3. Ask question: "..."
4. Click 👍 button

**Expected:**
Toast "Cảm ơn..." appears

**Actual:**
Error "Không thể gửi đánh giá"

**Console Logs:**
```
[Rating] Starting rating process: ...
[Rating] Error: ...
```

**Network Response:**
```json
{
  "error": "...",
  "details": "..."
}
```

**Screenshots:**
[Attach screenshots here]
```

---

## 📞 Test Success Criteria

**✅ Test PASSED nếu:**
- All 7 test steps hoàn thành không lỗi
- Console không có error màu đỏ
- Toast notifications xuất hiện đúng
- Button states thay đổi correctly
- Database có data mới

**❌ Test FAILED nếu:**
- Bất kỳ step nào throw error
- Toast không xuất hiện
- Buttons không đổi màu
- Database không có data mới
- Console có errors

---

**Good luck testing! 🎉**

Nếu pass all tests → System is working correctly!
Nếu fail any test → Follow troubleshooting guide hoặc report bug.
