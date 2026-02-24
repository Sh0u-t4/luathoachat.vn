# ✅ CHECKLIST DEPLOY BOLT.NEW

## 🎯 TRƯỚC KHI DEPLOY

### ✅ Files đã chuẩn bị:
- [x] ❌ **Đã xóa** `netlify.toml` (gây conflict)
- [x] ✅ **Đã tạo** `.bolt/config.json` (Bolt native config)
- [x] ✅ **Build pass** local (`npm run build`)
- [x] ✅ **Service Worker** auto-disable trên Bolt
- [x] ✅ **Chunk error handler** có protection

### ⚠️ LƯU Ý QUAN TRỌNG:
> **Bolt.new TỰ ĐỘNG DETECT file `netlify.toml` và cố deploy qua Netlify.**
> File này đã được xóa để force Bolt dùng native hosting.

---

## 🚀 BƯỚC DEPLOY (3 PHÚT)

### BƯỚC 1: Set Environment Variables
Trong Bolt.new UI:
1. Click icon ⚙️ **Settings**
2. Chọn **Environment Variables**
3. Add 2 biến này:

```bash
# REQUIRED - Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc

# OPTIONAL - Analytics (nếu có)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
```

4. Click **Save**

### BƯỚC 2: Deploy
1. Click nút **🚀 Deploy** (góc trên bên phải)
2. Bolt sẽ tự động:
   - Install dependencies
   - Run build
   - Deploy to CDN
3. Đợi 1-2 phút ⏳

### BƯỚC 3: Verify
1. Bolt cung cấp URL (dạng `https://xxx.bolt.new`)
2. Click vào URL để mở web
3. Kiểm tra:
   - ✅ Trang chủ load
   - ✅ Chat AI hoạt động
   - ✅ Nhấn F12 → Console tab → Không có lỗi màu đỏ

---

## 🔴 NẾU GẶP LỖI

### ❌ Lỗi: "Something went wrong... Netlify"
**Đã fix** - File netlify.toml đã xóa

Nếu vẫn lỗi:
```bash
# Verify file không tồn tại
ls netlify.toml  # Phải báo "No such file"
```

### ❌ Lỗi: "Build Failed"
**Nguyên nhân:** Dependencies error

**Fix:**
1. Kiểm tra build log trong Bolt console
2. Thường do thiếu packages → Bolt sẽ auto-install

### ❌ Lỗi: Web trắng trang
**Nguyên nhân:** Thiếu environment variables

**Fix:**
1. F12 → Console → Tìm error "Failed to fetch"
2. Quay lại Bước 1 → Add env variables
3. Redeploy

### ❌ Lỗi: "ChunkLoadError"
**Nguyên nhân:** Browser cache cũ

**Fix:** Paste vào Console (F12) và Enter:
```javascript
localStorage.clear();
sessionStorage.clear();
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
location.reload();
```

### ❌ Lỗi: Chat AI không hoạt động
**Nguyên nhân:** Supabase Edge Function chưa deploy

**Fix:**
1. Vào Supabase Dashboard
2. Edge Functions → Verify `legal-ai-chat` đã deploy
3. Test function với curl:
```bash
curl -X POST https://kahzohzwrypqlakpvhxd.supabase.co/functions/v1/legal-ai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message":"test"}'
```

---

## 📊 DEBUG COMMANDS

### Kiểm tra build local:
```bash
npm run build
```

### Kiểm tra TypeScript errors:
```bash
npm run typecheck
```

### Clear cache và rebuild:
```bash
rm -rf .next node_modules/.cache
npm run build
```

---

## 🌐 CUSTOM DOMAIN (Tùy chọn)

Nếu muốn dùng `luathoachat.vn`:

### Trong Bolt.new:
1. Settings → Domains
2. Add Custom Domain: `luathoachat.vn`
3. Copy DNS instructions

### Tại nhà cung cấp domain:
1. Login to domain provider (GoDaddy, Cloudflare, etc.)
2. DNS Settings → Add records theo hướng dẫn của Bolt
3. Save
4. Đợi 24-48h để DNS propagate
5. Verify: https://dnschecker.org

---

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi sau khi làm theo checklist:

### Cung cấp thông tin:
1. **URL của bạn:** [paste here]
2. **Screenshot lỗi:** F12 → Console tab
3. **Build log:** Copy từ Bolt deployment console
4. **Environment variables:** Đã add đầy đủ chưa?

### Emergency contacts:
- Bolt.new Support: https://bolt.new/support
- Supabase Status: https://status.supabase.com

---

## ✅ POST-DEPLOYMENT

Sau khi deploy thành công:

### Performance:
- [ ] Test tốc độ: https://pagespeed.web.dev
- [ ] Test mobile: Device toolbar trong Chrome

### Security:
- [ ] Check SSL certificate (khóa xanh trên browser)
- [ ] Test RLS policies (thử đăng nhập với users khác)

### Analytics:
- [ ] Verify Google Analytics tracking (nếu có)
- [ ] Check Supabase Analytics dashboard

### Monitoring:
- [ ] Set up uptime monitoring: https://uptimerobot.com
- [ ] Enable Supabase database backups

---

**Build Status:** ✅ PASSING
**Ready to Deploy:** YES
**Updated:** 2026-02-24

🎉 **Chúc mừng! Bạn đã sẵn sàng deploy!**
