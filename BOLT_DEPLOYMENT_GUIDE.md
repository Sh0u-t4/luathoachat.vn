# 🚀 HƯỚNG DẪN DEPLOY TRÊN BOLT.NEW

## ✅ Tình Trạng Hiện Tại
- **Build Status:** ✅ SUCCESS
- **Platform:** Bolt.new Hosting
- **Framework:** Next.js 13 App Router

---

## 🔧 ĐÃ FIX
1. **Service Worker:** Tự động disable trên Bolt hosting để tránh conflict
2. **Chunk Error Handler:** Thêm protection chống infinite reload loop
3. **Google Analytics:** Đã chuyển sang dùng `next/script` component
4. **Build optimization:** Code đã clean, không còn critical errors

---

## 🌐 KIỂM TRA WEB ĐÃ DEPLOY

### Bước 1: Kiểm tra URL
Bolt.new tự động cung cấp URL dạng:
- `https://[project-name].bolt.new`
- Hoặc custom domain nếu bạn đã cấu hình

### Bước 2: Mở Developer Console
1. Truy cập URL của bạn
2. Nhấn `F12` (hoặc Right-click → Inspect)
3. Vào tab **Console**

### Bước 3: Kiểm tra các lỗi phổ biến

#### ❌ Lỗi: "Failed to fetch" hoặc "CORS error"
**Nguyên nhân:** Environment variables chưa được set

**Giải pháp:**
1. Vào Bolt.new project settings
2. Thêm environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
3. Redeploy project

#### ❌ Lỗi: "Hydration error" hoặc "Text content mismatch"
**Nguyên nhân:** Server-Client mismatch

**Giải pháp:**
- Xóa cache browser (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

#### ❌ Lỗi: "ChunkLoadError" liên tục reload
**Nguyên nhân:** Old service worker còn cache

**Giải pháp:**
1. Mở Console
2. Chạy:
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))
```
3. Hard refresh (Ctrl+F5)

#### ❌ Màn hình trắng, không có lỗi
**Nguyên nhân:** JavaScript bị block hoặc deployment chưa xong

**Giải pháp:**
1. Kiểm tra tab **Network** trong DevTools
2. Refresh lại trang (F5)
3. Đợi 1-2 phút để Bolt hoàn tất deployment

---

## 🎯 CHECKLIST TRƯỚC KHI BÁO LỖI

- [ ] Build local đã thành công (`npm run build`)
- [ ] Environment variables đã được set trên Bolt.new
- [ ] Đã xóa cache browser và hard refresh
- [ ] Đã kiểm tra Console tab (F12) xem có error gì
- [ ] Đã đợi ít nhất 2 phút sau khi deploy

---

## 📊 THÔNG TIN DEBUG

Nếu vẫn lỗi, cung cấp cho developer:

1. **URL của bạn:** [paste URL here]

2. **Screenshot Console errors:**
   - F12 → Console tab → Screenshot

3. **Network errors:**
   - F12 → Network tab → Filter "Failed" → Screenshot

4. **Browser info:**
   - Chrome/Firefox/Safari version?
   - Desktop/Mobile?

---

## 🆘 EMERGENCY FIX

Nếu web hoàn toàn không load, chạy lệnh này trong project root:

```bash
# Clear all caches and rebuild
rm -rf .next node_modules/.cache
npm run build
```

Sau đó redeploy trên Bolt.new.

---

## 🔗 CUSTOM DOMAIN (Nếu có)

Nếu bạn đã connect custom domain `luathoachat.vn`:

1. **DNS Settings:**
   - Kiểm tra DNS đã trỏ đúng chưa (dùng https://dnschecker.org)
   - Đợi 24-48h để DNS propagate

2. **SSL Certificate:**
   - Bolt tự động provision SSL
   - Nếu hiện "Not Secure", đợi thêm vài phút

3. **Redirect www → non-www:**
   - Config trong Bolt domain settings

---

**Cập nhật:** 2026-02-24
**Status:** Ready for Production ✅
