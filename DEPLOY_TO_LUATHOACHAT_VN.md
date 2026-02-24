# ⚡ QUICK DEPLOY: luathoachat.vn

## 🎯 MỤC TIÊU
Deploy project lên domain `luathoachat.vn` qua Bolt.new hosting

---

## ✅ STATUS CHECK

**Build Status:** ✅ PASSING
**Framework:** Next.js 13
**Hosting Platform:** Bolt.new
**Target Domain:** `luathoachat.vn`

---

## 🚀 3 BƯỚC ĐƠN GIẢN

### BƯỚC 1: Deploy lên Bolt (2 phút)

1. **Add Environment Variables** trong Bolt Settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc
   ```

2. **Click "Deploy"** button
   - Đợi 1-2 phút
   - Nhận URL: `https://xxx.bolt.new`
   - Test URL này trước khi setup domain

---

### BƯỚC 2: Add Custom Domain trong Bolt (1 phút)

1. Vào **Settings** → **Domains**
2. Click **Add Domain**
3. Nhập: `luathoachat.vn` và `www.luathoachat.vn`
4. **Copy DNS records** (Bolt sẽ hiển thị):
   ```
   A Record:
   Name: @
   Value: [IP từ Bolt]

   CNAME Record:
   Name: www
   Value: [xxx.bolt.new]
   ```

---

### BƯỚC 3: Config DNS tại Domain Provider (5 phút)

#### Nếu dùng **GoDaddy:**
1. My Products → `luathoachat.vn` → Manage DNS
2. Add A Record: `@` → `[IP từ Bolt]`
3. Add CNAME: `www` → `[xxx.bolt.new]`
4. Save

#### Nếu dùng **Cloudflare:**
1. Dashboard → `luathoachat.vn` → DNS
2. Add A Record: `@` → `[IP từ Bolt]` (Proxied: ON)
3. Add CNAME: `www` → `[xxx.bolt.new]` (Proxied: ON)
4. Save

#### Nếu dùng **Tên Miền Việt:**
1. Quản lý domain → DNS
2. Thêm A: `@` → `[IP từ Bolt]`
3. Thêm CNAME: `www` → `[xxx.bolt.new]`
4. Lưu

---

## ⏱️ ĐỢI DNS PROPAGATE

**Thời gian:** 5 phút - 2 giờ

**Kiểm tra:**
- Tool: https://dnschecker.org
- Nhập: `luathoachat.vn`
- Chờ tất cả server hiển thị màu xanh

**Command line:**
```bash
# Check DNS
nslookup luathoachat.vn

# Hoặc
dig luathoachat.vn
```

---

## ✅ VERIFY

Sau khi DNS propagate:

1. **Mở:** `https://luathoachat.vn`
2. **Check:**
   - ✅ Khóa xanh 🔒 (SSL)
   - ✅ Trang load
   - ✅ Chat hoạt động
   - ✅ F12 Console không có lỗi

3. **Test redirects:**
   ```
   http://luathoachat.vn → https://luathoachat.vn ✅
   www.luathoachat.vn → https://luathoachat.vn ✅
   ```

---

## 🔥 TROUBLESHOOTING

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| "Site can't be reached" | DNS chưa propagate | Đợi 1-2 giờ, clear DNS cache |
| "Not secure" warning | SSL chưa issue | Đợi 15 phút sau DNS propagate |
| Web trắng | Thiếu env variables | Add variables trong Bolt Settings |
| CSS không load | Cache cũ | Hard refresh: Ctrl+Shift+R |

---

## 📞 LINKS QUAN TRỌNG

- **DNS Checker:** https://dnschecker.org
- **SSL Check:** https://www.ssllabs.com/ssltest/
- **PageSpeed:** https://pagespeed.web.dev
- **Bolt Support:** https://bolt.new/support
- **Full Guide:** Xem file `BOLT_CUSTOM_DOMAIN_GUIDE.md`

---

## 🎯 NEXT STEPS (Sau khi deploy)

1. **Google Search Console:**
   - Add property: `https://luathoachat.vn`
   - Submit sitemap: `/sitemap.xml`

2. **Analytics:**
   - Verify Google Analytics tracking
   - Check conversion tracking

3. **Monitoring:**
   - Setup UptimeRobot.com
   - Monitor daily performance

4. **Backup:**
   - Export Supabase database
   - Document admin credentials

---

**Estimated Total Time:** 10-15 phút + DNS waiting time

🚀 **Ready to launch!**
