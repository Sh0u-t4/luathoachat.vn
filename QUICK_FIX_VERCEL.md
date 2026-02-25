# 🚨 KHẮC PHỤC NGAY LỖI VERCEL - 2 PHÚT

## VẤN ĐỀ
```
Error: supabaseUrl is required
```

## NGUYÊN NHÂN
Bạn chưa thêm Environment Variables vào Vercel!

---

## GIẢI PHÁP (2 BƯỚC - 2 PHÚT)

### BƯỚC 1: Vào Vercel Dashboard

1. Truy cập: **https://vercel.com/dashboard**
2. Click vào **project của bạn**
3. Click tab **"Settings"** (ở top menu)
4. Click **"Environment Variables"** (sidebar trái)

### BƯỚC 2: Thêm 2 biến này

**Biến 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://kahzohzwrypqlakpvhxd.supabase.co
```
- ✅ Tick: Production
- ✅ Tick: Preview
- ✅ Tick: Development

**Biến 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjUxMTQsImV4cCI6MjA4NjUwMTExNH0.2DO_cLFJ4Td5mAsmkFwb3-LTsoybyeAt2eUPvqRPLyA
```
- ✅ Tick: Production
- ✅ Tick: Preview
- ✅ Tick: Development

### BƯỚC 3: Save và Redeploy

1. Click **"Save"**
2. Vercel sẽ hỏi: "Redeploy to apply changes?" → Click **"Redeploy"**

---

## HOẶC: REDEPLOY BẰNG GIT PUSH

Nếu bạn đã push code mới:

```bash
# Tạo commit rỗng để trigger build mới
git commit --allow-empty -m "Redeploy with env vars"
git push
```

---

## SAU 2-3 PHÚT

✅ Build sẽ thành công
✅ App sẽ chạy hoàn hảo
✅ Không còn lỗi `supabaseUrl is required`

---

## KIỂM TRA

Truy cập app của bạn:
- Homepage: OK
- Chat: OK
- Đăng ký/Đăng nhập: OK
- Quên mật khẩu: OK (không còn lỗi)

---

## NẾU VẪN LỖI

1. **Clear Build Cache:**
   - Settings → General → Clear Build Cache
   - Sau đó Redeploy

2. **Kiểm tra env vars:**
   - Settings → Environment Variables
   - Đảm bảo cả 2 biến đã được thêm
   - Đảm bảo đã tick cả 3 environments

3. **Xem deployment logs:**
   - Deployments → Click deployment mới nhất
   - Xem logs để tìm lỗi khác

---

**Thế thôi! App của bạn sẽ chạy ngay!** 🚀
