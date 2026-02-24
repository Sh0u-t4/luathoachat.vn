# ⚡ QUICK FIX: Netlify Deployment Error

## 🎯 Làm ngay 3 bước này:

### 1️⃣ Clear Netlify Cache (BẮT BUỘC)
```
Vào Netlify Dashboard → Site Settings → Build & Deploy →
Click "Clear cache and retry deploy"
```

### 2️⃣ Kiểm tra Environment Variables
Vào `Site Settings → Environment variables` và đảm bảo có:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 3️⃣ Deploy lại
```bash
git add .
git commit -m "fix: netlify deployment config"
git push origin main
```

---

## ✅ Đã fix những gì?

1. **next.config.js** - Thêm `output: 'standalone'` cho Netlify
2. **netlify.toml** - Tối ưu build configuration
3. **.nvmrc** - Lock Node version 18.19.0

---

## 🔍 Nếu vẫn lỗi?

Xem file chi tiết: `NETLIFY_DEPLOYMENT_FIX.md`

Hoặc check deploy logs:
```
Netlify Dashboard → Deploys → Click vào deploy failed →
Scroll xuống xem full error logs
```

---

**Pro Tip:** Luôn clear cache trước khi deploy lại sau khi sửa config!
