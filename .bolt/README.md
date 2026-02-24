# 🚀 BOLT.NEW DEPLOYMENT GUIDE

## ✅ PROJECT STATUS
- **Framework:** Next.js 13 App Router
- **Build Status:** ✅ PASSING
- **Hosting:** Bolt.new Native
- **Ready to Deploy:** YES

---

## 🔴 FIX ĐÃ ÁP DỤNG

### Lỗi: "Something went wrong while creating your site on Netlify"
✅ **ĐÃ FIX** - Removed `netlify.toml` file

Bolt.new phát hiện file `netlify.toml` và cố deploy qua Netlify adapter thay vì native hosting, dẫn đến lỗi.

**Giải pháp:** File đã được xóa hoàn toàn.

---

## 📋 BƯỚC DEPLOY NGAY

### 1️⃣ Set Environment Variables
Trong Bolt.new UI:
- Click **Settings** (icon ⚙️)
- Chọn **Environment Variables**
- Add các biến sau:

```
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc
```

### 2️⃣ Deploy
- Click nút **Deploy**
- Đợi 1-2 phút
- Done! ✅

### 3️⃣ Verify
Mở URL được cung cấp (dạng `https://xxx.bolt.new`) và kiểm tra:
- ✅ Trang chủ load
- ✅ Chat AI hoạt động
- ✅ F12 Console không có lỗi màu đỏ

---

## 🔧 NẾU VẪN LỖI

### Lỗi: Build Failed
```bash
# Check build log trong Bolt console
# Thường là do thiếu env variables
```

### Lỗi: Web trắng trang
1. F12 → Console tab
2. Tìm error màu đỏ
3. Thường là: "Failed to fetch" → Thiếu SUPABASE_URL

**Fix:** Add environment variables (bước 1)

### Lỗi: ChunkLoadError
1. F12 → Console
2. Paste và Enter:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📞 DEBUG CHECKLIST

- [ ] Environment variables đã add chưa?
- [ ] Build local có pass không? (`npm run build`)
- [ ] Đã đợi đủ 2 phút sau khi deploy chưa?
- [ ] F12 Console có error gì không?
- [ ] Hard refresh (Ctrl+Shift+R) chưa?

---

## 🌐 CUSTOM DOMAIN (Nâng cao)

Nếu muốn dùng `luathoachat.vn`:
1. Bolt Settings → Domains → Add domain
2. Copy DNS records
3. Config tại nhà cung cấp domain
4. Đợi 24-48h

---

**Files quan trọng:**
- `.bolt/config.json` - Bolt native config
- `next.config.js` - Next.js settings
- `package.json` - Dependencies

**Files đã xóa:**
- ❌ `netlify.toml` - Gây conflict với Bolt

---

**Status:** ✅ Ready for Production
**Updated:** 2026-02-24
