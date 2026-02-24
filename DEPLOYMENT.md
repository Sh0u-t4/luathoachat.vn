# 🚀 HƯỚNG DẪN DEPLOYMENT

## ⚡ BOLT.NEW HOSTING (RECOMMENDED)

### ✅ Tình Trạng
- **Platform:** Bolt.new Native Hosting
- **Status:** ✅ Ready to Deploy
- **Build:** ✅ Passing

### 🔧 Cấu hình đã setup:
1. ✅ Đã disable Netlify adapter (file `netlify.toml` đã được rename)
2. ✅ Service Worker tự động skip trên Bolt
3. ✅ Chunk error handler có protection
4. ✅ Build optimization hoàn tất

### 📋 BƯỚC DEPLOY:

#### 1. Kiểm tra Environment Variables
Vào **Settings** trong Bolt.new UI, thêm:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc

# Optional (nếu có)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
```

#### 2. Deploy
- Click nút **Deploy** trong Bolt.new
- Đợi 1-2 phút
- Bolt sẽ tự động:
  - Chạy `npm install`
  - Chạy `npm run build`
  - Deploy lên CDN

#### 3. Verify Deployment
Web của bạn sẽ có URL dạng:
```
https://[project-id].bolt.new
```

Mở URL và kiểm tra:
- ✅ Trang chủ load được
- ✅ Chat AI hoạt động
- ✅ Không có lỗi trong Console (F12)

---

## 🔴 TROUBLESHOOTING

### Lỗi: "Something went wrong while creating your site on Netlify"

**Nguyên nhân:** Bolt đang cố deploy qua Netlify adapter thay vì native hosting

**Giải pháp:**
```bash
# Đã fix - File netlify.toml đã được disable
# Nếu vẫn lỗi, xóa file hoàn toàn:
rm netlify.toml.backup
```

### Lỗi: "Build failed"

**Kiểm tra:**
1. Build local có pass không?
   ```bash
   npm run build
   ```

2. Xem log chi tiết trong Bolt deployment console

3. Đảm bảo `package.json` có đầy đủ dependencies

### Lỗi: Web load nhưng trắng trang

**Nguyên nhân:** Environment variables chưa set

**Giải pháp:**
1. Vào Bolt Settings → Environment Variables
2. Thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

### Lỗi: "ChunkLoadError" liên tục

**Giải pháp:**
1. Mở Console (F12)
2. Chạy:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
   location.reload();
   ```

---

## 🌐 CUSTOM DOMAIN (Optional)

Nếu muốn dùng domain riêng (vd: `luathoachat.vn`):

### Bước 1: Trong Bolt.new
1. Vào Settings → Domains
2. Add Custom Domain: `luathoachat.vn`
3. Copy DNS records

### Bước 2: Tại nhà cung cấp domain (VD: GoDaddy, Cloudflare)
1. Vào DNS Settings
2. Thêm A Record:
   ```
   Type: A
   Name: @
   Value: [IP from Bolt]
   ```
3. Thêm CNAME:
   ```
   Type: CNAME
   Name: www
   Value: [domain from Bolt]
   ```

### Bước 3: Chờ DNS propagate
- Thời gian: 5 phút - 48 giờ
- Kiểm tra: https://dnschecker.org

---

## 📊 ALTERNATIVE: VERCEL DEPLOYMENT

Nếu muốn deploy lên Vercel thay vì Bolt:

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Set Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🔧 FILES REFERENCE

### ✅ Files cần thiết cho Bolt:
- `package.json` - Dependencies
- `next.config.js` - Next.js config
- `.bolt/config.json` - Bolt native hosting config

### ❌ Files KHÔNG cần (đã disable):
- `netlify.toml.backup` - Netlify config (renamed)
- `vercel.json` - Không tồn tại

### 🔐 Files bí mật (KHÔNG commit):
- `.env` - Local development
- `.env.local` - Local overrides

---

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi:

1. **Check build log:**
   ```bash
   npm run build 2>&1 | tee build.log
   ```

2. **Check runtime errors:**
   - F12 → Console tab
   - Screenshot và gửi lỗi

3. **Emergency reset:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

---

**Cập nhật:** 2026-02-24
**Status:** ✅ Production Ready
**Platform:** Bolt.new Native Hosting
