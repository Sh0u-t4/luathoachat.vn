# ✅ CHECKLIST DEPLOYMENT VERCEL

## Trạng thái hiện tại

### ✅ Code đã sẵn sàng
- Build local thành công
- Giao diện trên Vercel đã đúng
- Environment variables đã được cấu hình

### 📋 Xác nhận lần cuối

## BƯỚC 1: Kiểm tra Git Status

```bash
# Kiểm tra có thay đổi nào chưa commit không
git status

# Nếu có file chưa commit (màu đỏ):
git add .
git commit -m "Fix: Supabase client fallback for production build"
```

## BƯỚC 2: Đẩy code lên repository

```bash
# Push code mới nhất
git push origin main

# Hoặc nếu branch khác:
git push origin <branch-name>
```

## BƯỚC 3: Xác nhận deployment trên Vercel

1. Truy cập: https://vercel.com/dashboard
2. Vào project của bạn
3. Tab **"Deployments"**
4. Xem deployment mới nhất (phải có commit message mới nhất)

### Nếu không tự động deploy:

**Option A: Manual Redeploy**
```
Deployments → Click vào deployment → Menu "..." → Redeploy
```

**Option B: Trigger bằng commit rỗng**
```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push
```

## BƯỚC 4: Kiểm tra Environment Variables

Đảm bảo đã có đủ 2 biến:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Cả 2 phải tick:
- ✅ Production
- ✅ Preview
- ✅ Development

## BƯỚC 5: Xác nhận giao diện giống nhau

### Test trên local:
```bash
npm run build
npm start
# Mở http://localhost:3000
```

### Test trên Vercel:
```
Mở URL production của bạn
```

### Checklist giao diện:

- ✅ Header: Logo + Menu (Trang chủ, Kiểm tra, Hướng dẫn, Liên hệ, VI, Đăng nhập, Dùng thử Miễn phí)
- ✅ Hero Section:
  - ✅ Background: Gradient dark (slate-900 → slate-800)
  - ✅ Title: "Trợ lý AI Hỗ trợ Tuân thủ Luật Hóa Chất & Môi trường Việt Nam"
  - ✅ Subtitle: "Tra cứu Danh mục..."
  - ✅ Search bar: Background trắng, icon Search bên trái, nút "Tìm kiếm" xanh cyan bên phải
  - ✅ Badge: "Dữ liệu cập nhật ngày 17/01/2026" (vàng amber)
  - ✅ Suggestions: 3 gợi ý (pills trắng trong suốt)
  - ✅ Feature cards: 2 cards phía dưới (Tra cứu Danh mục 2026, Khai báo nhập khẩu AI)

- ✅ Chat Section: Chat interface bên dưới
- ✅ Stats Section: Thống kê
- ✅ Features Section: Chi tiết tính năng
- ✅ Footer: Thông tin công ty

## BƯỚC 6: Test tính năng

### Test trên Production (Vercel URL):

1. **Search:**
   - Nhập query vào search bar
   - Click "Tìm kiếm"
   - Chat phải scroll xuống và hiển thị kết quả

2. **Download buttons:**
   - Click "Luật 69/2025/QH15"
   - Phải download PDF

3. **Dropdown menus:**
   - Click "Nghị định" → Hiển thị danh sách 3 nghị định
   - Click "Thông tư" → Hiển thị danh sách thông tư

4. **Suggestions:**
   - Click một suggestion
   - Chat phải nhận và trả lời

5. **Auth pages:**
   - `/dang-ky` - Trang đăng ký
   - `/dang-nhap` - Trang đăng nhập
   - `/quen-mat-khau` - Quên mật khẩu (KHÔNG còn lỗi supabaseUrl)

## BƯỚC 7: Kiểm tra Performance

### Vercel Deployment Logs:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
✓ Finalizing page optimization
```

### Lighthouse Score (Chrome DevTools):

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

## TÓM TẮT

### Files quan trọng đã update:

1. **lib/supabase.ts** - Đã thêm fallback để không crash khi build
2. **components/landing/hero-section.tsx** - Giao diện hero (đã đúng)
3. **app/page.tsx** - Main page (đã đúng)

### Environment Variables trên Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Deployment Command:

```bash
# Build command (Vercel tự động chạy)
npm run build

# Start command (Production)
npm start
```

## NẾU GẶP VẤN ĐỀ

### Lỗi: Giao diện khác nhau

**Nguyên nhân:** Code chưa được push/deploy

**Giải pháp:**
```bash
git status          # Xem file nào thay đổi
git add .
git commit -m "Sync production with local"
git push
```

### Lỗi: Build failed

**Nguyên nhân:** Environment variables chưa đủ

**Giải pháp:**
1. Settings → Environment Variables
2. Thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Save → Redeploy

### Lỗi: supabaseUrl is required

**Nguyên nhân:** Environment variables không load

**Giải pháp:**
1. Clear Build Cache (Settings → General)
2. Redeploy

### Lỗi: 404 trên các route

**Nguyên nhân:** Build cache cũ

**Giải pháp:**
1. Deployments → Click deployment → Redeploy
2. Hoặc: Settings → Clear Build Cache

## FINAL CHECK

Sau khi deploy xong, check 3 điều này:

1. ✅ **URL Production:** App chạy mượt mà
2. ✅ **No Console Errors:** Mở DevTools, không có lỗi đỏ
3. ✅ **All Features Work:** Search, Download, Auth đều OK

---

**Status:** ✅ Code sẵn sàng deploy
**Next Action:** Push code (nếu chưa) → Verify Vercel deployment
**Estimated Time:** 2-5 phút
