# 🚀 HƯỚNG DẪN FIX LỖI NETLIFY DEPLOYMENT

## ❌ Vấn đề gặp phải
Lỗi ID: `2592bae6ba874341Bf0f152849ad376c:ecu:XbWcBpkOv6Jl2:636465B5:861925f`

**Nguyên nhân:**
1. Cấu hình Netlify chưa tối ưu cho Next.js 13
2. Thiếu `output: 'standalone'` trong `next.config.js`
3. Environment variables chưa được set đúng trên Netlify Dashboard

---

## ✅ Các thay đổi đã thực hiện

### 1. **Cập nhật `next.config.js`**
- Thêm `output: 'standalone'` để tối ưu cho Netlify
- Thêm TypeScript và ESLint build checks
- Giữ nguyên các tối ưu về caching và security headers

### 2. **Cập nhật `netlify.toml`**
- Sửa build command: `npm run build`
- Thêm functions configuration với `esbuild` bundler
- Document rõ Environment Variables cần thiết

---

## 📋 CHECKLIST DEPLOYMENT

### Bước 1: Xóa cache Netlify (QUAN TRỌNG!)
```bash
# Trong Netlify Dashboard
Site Settings → Build & Deploy → Clear cache and retry deploy
```

### Bước 2: Kiểm tra Environment Variables
Vào **Netlify Dashboard → Site settings → Environment variables** và thêm:

**REQUIRED (BẮT BUỘC):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**OPTIONAL (Tùy chọn):**
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
OPENAI_API_KEY=sk-... (nếu dùng AI features)
```

### Bước 3: Kiểm tra Node Version
Netlify mặc định dùng Node 18.x. Đảm bảo project tương thích:

**Cách kiểm tra:**
- Vào `Site Settings → Build & Deploy → Environment`
- Set `NODE_VERSION=18` (hoặc để mặc định)

### Bước 4: Deploy lại
```bash
# Option 1: Deploy từ Git (RECOMMENDED)
git add .
git commit -m "fix: update Netlify deployment config"
git push origin main

# Option 2: Manual deploy (Testing)
npm run build
# Drag & drop folder .next vào Netlify manual deploy
```

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Module not found"
**Giải pháp:**
```bash
# Clear dependencies và reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lỗi: "Next.js plugin error"
**Giải pháp:**
1. Đảm bảo `@netlify/plugin-nextjs` version `^5.15.8` trong `package.json`
2. Clear Netlify build cache
3. Retry deployment

### Lỗi: "Environment variables not found"
**Giải pháp:**
- Kiểm tra lại tên biến có prefix `NEXT_PUBLIC_` chưa
- Restart deployment sau khi thêm env vars
- Đảm bảo không có khoảng trắng thừa trong values

### Lỗi: "Build timeout"
**Giải pháp:**
1. Upgrade Netlify plan (nếu free plan bị giới hạn)
2. Tối ưu dependencies (remove unused packages)
3. Thử deploy với `NODE_ENV=production`

---

## 📊 Kiểm tra sau Deploy

### 1. Functional Tests
- [ ] Homepage load thành công
- [ ] Chat AI hoạt động (nếu có OpenAI key)
- [ ] Authentication flow (Login/Register)
- [ ] Database queries (Supabase connection)

### 2. Performance Tests
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### 3. Security Tests
- [ ] Environment variables không lộ trong client-side
- [ ] HTTPS enabled
- [ ] Security headers được set đúng

---

## 🎯 Next Steps sau khi Deploy thành công

1. **Setup Custom Domain** (nếu chưa có)
   - `Site Settings → Domain management → Add custom domain`

2. **Enable Continuous Deployment**
   - `Site Settings → Build & Deploy → Build hooks`

3. **Setup Monitoring**
   - Netlify Analytics
   - Sentry (error tracking)
   - Uptime monitoring

4. **Performance Optimization**
   - Enable Image CDN
   - Setup Edge Functions caching
   - Analyze bundle size

---

## 📞 Liên hệ hỗ trợ

Nếu vẫn gặp lỗi sau khi thực hiện các bước trên:

1. **Check Netlify Deploy Logs:**
   ```
   Deploys → Click vào deploy failed → Xem full logs
   ```

2. **Copy Error ID và search:**
   - Netlify Community Forum
   - GitHub Issues của `@netlify/plugin-nextjs`

3. **Report với thông tin:**
   - Error ID
   - Full deploy logs
   - Node version
   - Next.js version

---

**Cập nhật:** 2025-02-24
**Status:** ✅ Config đã được fix và tối ưu
