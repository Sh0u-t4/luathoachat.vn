# 🚀 NETLIFY DEPLOYMENT GUIDE

**Platform:** Netlify
**Framework:** Next.js 13 (App Router)
**Status:** ✅ Ready to Deploy

---

## 🔧 DEPLOY TRỰC TIẾP TỪ BOLT.NEW

### Bước 1: Kết nối với Netlify

1. Nhấn nút **"Update"** trong giao diện Bolt.new
2. Hệ thống sẽ tự động:
   - Build project (`npm run build`)
   - Deploy lên Netlify
   - Tạo URL preview

### Bước 2: Cấu hình Environment Variables

**QUAN TRỌNG:** Sau khi deploy lần đầu, bạn PHẢI thêm environment variables:

1. Vào Netlify Dashboard: https://app.netlify.com
2. Chọn site của bạn → **Site settings** → **Environment variables**
3. Thêm các biến sau:

```bash
# Supabase (BẮT BUỘC)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Analytics (TÙY CHỌN)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
```

4. Sau khi thêm xong, nhấn **"Trigger deploy"** để rebuild với env vars mới

---

## ⚠️ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Something went wrong while creating your site on Netlify"

**Nguyên nhân:**
- Build timeout
- Missing dependencies
- Environment variables chưa đủ

**Giải pháp:**

#### Option 1: Deploy Manual từ Git

```bash
# 1. Push code lên GitHub
git add .
git commit -m "feat: ready for deployment"
git push origin main

# 2. Import vào Netlify
# - Vào https://app.netlify.com/start
# - Chọn "Import from Git"
# - Chọn repository
# - Build settings tự động detect
```

#### Option 2: Deploy qua Netlify CLI

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod
```

### Lỗi: "22 security issues detected"

**Nguyên nhân:** Outdated dependencies

**Giải pháp:**

```bash
# 1. Kiểm tra
npm audit

# 2. Fix automatically
npm audit fix

# 3. Fix breaking changes (cẩn thận!)
npm audit fix --force

# 4. Rebuild
npm run build
```

### Lỗi: Build fails on Netlify

**Checklist:**

1. ✅ Đã chạy `npm run build` local thành công?
2. ✅ Node version khớp? (Check `package.json` → engines)
3. ✅ Dependencies đầy đủ? (Không có missing packages)
4. ✅ Environment variables đã set?

**Fix:**

Thêm file `.nvmrc` nếu chưa có:
```bash
echo "18" > .nvmrc
```

Hoặc cấu hình trong `netlify.toml`:
```toml
[build.environment]
  NODE_VERSION = "18"
```

---

## 📝 CHECKLIST TRƯỚC KHI DEPLOY

### 1. Code Quality
- [ ] `npm run build` chạy thành công
- [ ] `npm run lint` không có lỗi
- [ ] TypeScript không có type errors

### 2. Environment Variables
- [ ] Đã có `.env.example` với tất cả variables cần thiết
- [ ] Đã chuẩn bị values thực cho production
- [ ] Không commit `.env` vào Git

### 3. Configuration Files
- [ ] `netlify.toml` đúng config
- [ ] `next.config.js` đúng config
- [ ] `package.json` có đủ dependencies

### 4. Assets & Content
- [ ] Images đã optimize (hoặc set `unoptimized: true`)
- [ ] Static files trong `/public`
- [ ] PDF documents có trong project

### 5. Supabase Setup
- [ ] Database migrations đã apply
- [ ] Edge Functions đã deploy
- [ ] RLS policies đã enable
- [ ] OpenAI secret đã set (nếu dùng RAG)

---

## 🏗️ BUILD CONFIGURATION

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### next.config.js
```javascript
const nextConfig = {
  images: {
    unoptimized: true, // Bắt buộc cho Netlify free tier
  },
  reactStrictMode: true,
  swcMinify: true,
};
```

---

## 🔍 KIỂM TRA SAU KHI DEPLOY

### 1. Functional Tests

```bash
# Homepage
curl -I https://your-site.netlify.app

# API Routes
curl https://your-site.netlify.app/api/rate-message

# Static Assets
curl -I https://your-site.netlify.app/documents/laws/69-2025-QH15.pdf
```

### 2. Manual Tests

- [ ] Landing page load đúng
- [ ] Chat interface hoạt động
- [ ] Auth flow (login/register) OK
- [ ] Admin dashboard accessible (với quyền)
- [ ] Download PDFs OK
- [ ] Mobile responsive

### 3. Performance Tests

```bash
# Lighthouse CI
npx lighthouse https://your-site.netlify.app --view

# Expected scores:
# Performance: > 80
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

---

## 🔐 BẢO MẬT

### Headers Security

Netlify tự động thêm headers sau (qua `netlify.toml`):

```
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: camera=(), microphone=()
```

### Environment Variables Security

- ✅ **NEVER** commit `.env` vào Git
- ✅ Chỉ dùng `NEXT_PUBLIC_*` cho client-side vars
- ✅ Server-side secrets (như `OPENAI_API_KEY`) set trong Netlify UI
- ✅ Rotate keys định kỳ (3-6 tháng)

---

## 📊 MONITORING

### Netlify Analytics

1. Vào Site dashboard → Analytics
2. Enable Netlify Analytics ($9/month - optional)
3. Xem:
   - Page views
   - Top pages
   - Traffic sources
   - Bandwidth usage

### Supabase Analytics

1. Vào Supabase Dashboard → Database → API
2. Monitor:
   - API requests
   - Database queries
   - Edge Function invocations
   - Errors & logs

---

## 💰 COST ESTIMATION

### Netlify Free Tier
- 100 GB bandwidth/month
- 300 build minutes/month
- Custom domain
- HTTPS automatic

**Estimated:** $0/month (free tier đủ dùng)

### Supabase Free Tier
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

**Estimated:** $0-25/month

### OpenAI (if using RAG)
- Embedding: $0.02/1M tokens
- GPT-4o-mini: $0.15/1M input tokens

**Estimated:** $5-10/month (1000 queries/day)

**TOTAL: $5-35/month**

---

## 🚨 ROLLBACK STRATEGY

### Nếu deployment lỗi:

#### Option 1: Rollback via Netlify UI
1. Vào Deploys → Find last working deploy
2. Click "Publish deploy"

#### Option 2: Rollback via Git
```bash
# 1. Revert commit
git revert HEAD
git push origin main

# 2. Netlify auto redeploy
```

#### Option 3: Stop auto-deploy tạm thời
```bash
# Netlify UI: Site settings → Build & deploy → Stop builds
```

---

## 📞 SUPPORT

### Netlify Support
- Docs: https://docs.netlify.com
- Community: https://answers.netlify.com
- Status: https://www.netlifystatus.com

### Project Support
- Technical Issues: Check `NETLIFY_FIX_SUMMARY.md`
- Deployment Questions: Check `DEPLOY_NOW_CHECKLIST.md`
- Supabase Issues: Check `BACKEND_RAG_IMPLEMENTATION.md`

---

## ✅ SUCCESS CRITERIA

Deploy thành công khi:

- [x] Build completed without errors
- [x] Site accessible via HTTPS
- [x] All pages load correctly
- [x] Environment variables working
- [x] Supabase connection OK
- [x] No console errors
- [x] Mobile responsive
- [x] Security headers present
- [x] Performance score > 80

---

**Last Updated:** 2026-02-24
**Project:** LuatHoaChat.vn
**Maintainer:** Development Team
