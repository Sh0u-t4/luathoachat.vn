# KHẮC PHỤC LỖI VERCEL: supabaseUrl is required

## VẤN ĐỀ

Lỗi: `Error: supabaseUrl is required` tại page `/quen-mat-khau`

**Nguyên nhân:** Environment Variables chưa được cấu hình trên Vercel.

---

## GIẢI PHÁP: THÊM ENVIRONMENT VARIABLES

### Bước 1: Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Click vào project của bạn
3. Click tab **"Settings"**
4. Click **"Environment Variables"** ở sidebar bên trái

### Bước 2: Thêm Variables

Thêm 2 biến sau:

#### Variable 1:
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://kahzohzwrypqlakpvhxd.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2:
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjUxMTQsImV4cCI6MjA4NjUwMTExNH0.2DO_cLFJ4Td5mAsmkFwb3-LTsoybyeAt2eUPvqRPLyA
Environments: ✅ Production ✅ Preview ✅ Development
```

### Bước 3: Click "Save"

Sau khi save, Vercel sẽ hỏi bạn có muốn redeploy không.

### Bước 4: Redeploy

**Option A: Automatic (Recommended)**
- Click **"Redeploy"** trong dialog popup

**Option B: Manual**
1. Vào tab **"Deployments"**
2. Click vào deployment mới nhất
3. Click menu "..." (3 chấm)
4. Click **"Redeploy"**

**Option C: Git Push**
```bash
# Tạo commit rỗng để trigger deployment
git commit --allow-empty -m "Trigger redeploy after env vars"
git push
```

---

## KIỂM TRA SAU KHI DEPLOY

### 1. Kiểm tra Environment Variables đã load:

Trong Vercel Deployment logs, bạn sẽ thấy:
```
✓ Environment variables loaded
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Test các trang:

- ✅ `/quen-mat-khau` (không còn lỗi)
- ✅ `/dang-ky` (đăng ký hoạt động)
- ✅ `/dang-nhap` (đăng nhập hoạt động)
- ✅ `/` (homepage, chat AI hoạt động)

### 3. Kiểm tra Console:

Mở DevTools → Console, không còn error:
```
❌ Error: supabaseUrl is required  // Không còn nữa
```

---

## NẾU VẪN LỖI

### Lỗi: Variables không load

**Nguyên nhân:** Build cache cũ

**Giải pháp:**
1. Vào Settings → General
2. Scroll xuống **"Build & Development Settings"**
3. Click **"Clear Build Cache"**
4. Redeploy

### Lỗi: CORS hoặc API không kết nối

**Nguyên nhân:** Supabase URL sai hoặc domain chưa được whitelist

**Giải pháp:**
1. Kiểm tra lại URL: `https://kahzohzwrypqlakpvhxd.supabase.co`
2. Truy cập Supabase Dashboard: https://app.supabase.com
3. Chọn project → Settings → API
4. Thêm domain Vercel vào **"Site URL"**:
   ```
   https://your-app.vercel.app
   ```

### Lỗi: Build thành công nhưng runtime error

**Nguyên nhân:** Client component đang access env vars trước khi mount

**Giải pháp:** Đã fix trong `lib/supabase.ts` (có fallback)

---

## OPTIONAL: TEST LOCAL GIỐNG PRODUCTION

Để test giống production environment:

```bash
# Tạo .env.production.local
cat > .env.production.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjUxMTQsImV4cCI6MjA4NjUwMTExNH0.2DO_cLFJ4Td5mAsmkFwb3-LTsoybyeAt2eUPvqRPLyA
EOF

# Build và test
npm run build
npm start

# Open http://localhost:3000
```

---

## ADDITIONAL ENV VARS (OPTIONAL)

Nếu sau này muốn thêm Google Analytics hoặc ads:

```
Key: NEXT_PUBLIC_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX
Environments: ✅ Production

Key: NEXT_PUBLIC_GOOGLE_ADS_ID
Value: AW-XXXXXXXXXX
Environments: ✅ Production
```

---

## SCREENSHOT GUIDE

### Vercel Environment Variables Page:

```
Settings → Environment Variables

┌─────────────────────────────────────────────┐
│ Environment Variables                        │
├─────────────────────────────────────────────┤
│                                              │
│ Key: NEXT_PUBLIC_SUPABASE_URL               │
│ Value: https://kahzohzwrypqlakpvhxd...      │
│ □ Production  □ Preview  □ Development      │
│                                              │
│ [Add Another]                                │
│                                              │
│ Key: NEXT_PUBLIC_SUPABASE_ANON_KEY         │
│ Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...     │
│ □ Production  □ Preview  □ Development      │
│                                              │
│ [Save]                                       │
└─────────────────────────────────────────────┘
```

---

## TÓM TẮT

**Làm gì:**
1. ✅ Thêm `NEXT_PUBLIC_SUPABASE_URL` vào Vercel
2. ✅ Thêm `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào Vercel
3. ✅ Save và Redeploy
4. ✅ Kiểm tra app hoạt động

**Thời gian:** 2-3 phút

**Sau khi làm:** App sẽ chạy hoàn hảo, không còn lỗi `supabaseUrl is required`.

---

**Need help?** Check Vercel docs: https://vercel.com/docs/concepts/projects/environment-variables
