# 🌐 HƯỚNG DẪN DEPLOY LUATHOACHAT.VN QUA BOLT.NEW

## 📋 TỔNG QUAN

**Domain:** `luathoachat.vn`
**Hosting:** Bolt.new (Static Hosting)
**Framework:** Next.js 13 (Static Export)
**CDN:** Bolt.new Global CDN

---

## ✅ ĐIỀU KIỆN TIÊN QUYẾT

### 1. Đã có domain `luathoachat.vn`
- Đã đăng ký domain tại nhà cung cấp (GoDaddy, Tên Miền Việt, Cloudflare, etc.)
- Có quyền truy cập DNS settings

### 2. Project đã sẵn sàng
- ✅ Build thành công (`npm run build`)
- ✅ Environment variables đã chuẩn bị
- ✅ Supabase Edge Functions đã deploy

---

## 🚀 BƯỚC 1: DEPLOY LÊN BOLT.NEW

### 1.1. Chuẩn bị Environment Variables

Vào **Settings** trong Bolt.new UI và add:

```env
# REQUIRED - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc

# OPTIONAL - Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
```

### 1.2. Deploy Project

1. Click nút **🚀 Deploy** trong Bolt.new
2. Đợi build hoàn tất (1-2 phút)
3. Nhận được URL tạm: `https://xxx-xxx-xxx.bolt.new`
4. Test URL tạm để đảm bảo app hoạt động

✅ **Checkpoint:** Web phải load được và chat AI hoạt động trước khi config custom domain.

---

## 🌐 BƯỚC 2: CẤU HÌNH CUSTOM DOMAIN

### 2.1. Trong Bolt.new Dashboard

1. Vào **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Nhập: `luathoachat.vn`
4. Nhập thêm: `www.luathoachat.vn` (subdomain)
5. Click **Add Domain**

Bolt.new sẽ cung cấp DNS records dạng:

```
Type: A
Name: @
Value: XXX.XXX.XXX.XXX (IP của Bolt CDN)

Type: CNAME
Name: www
Value: xxx.bolt.new
```

📝 **Copy các records này** - Bạn sẽ cần chúng ở bước tiếp theo.

### 2.2. Tại Nhà Cung Cấp Domain

#### Option A: GoDaddy

1. Login vào GoDaddy.com
2. My Products → Domains → Click vào `luathoachat.vn`
3. Scroll xuống **DNS Management** → Click **Manage DNS**
4. Xóa các A records cũ (nếu có)
5. Add New Record:
   ```
   Type: A
   Name: @ (hoặc để trống)
   Value: [IP từ Bolt]
   TTL: 600 seconds
   ```
6. Add CNAME Record:
   ```
   Type: CNAME
   Name: www
   Value: [xxx.bolt.new]
   TTL: 1 Hour
   ```
7. Click **Save**

#### Option B: Cloudflare

1. Login vào Cloudflare.com
2. Chọn domain `luathoachat.vn`
3. Tab **DNS** → **Records**
4. Add Record:
   ```
   Type: A
   Name: @
   IPv4 address: [IP từ Bolt]
   Proxy status: Proxied (🟠) - Recommended
   ```
5. Add Record:
   ```
   Type: CNAME
   Name: www
   Target: [xxx.bolt.new]
   Proxy status: Proxied (🟠)
   ```
6. Click **Save**

**Cloudflare Bonus Settings:**
- SSL/TLS → Full (Strict)
- Speed → Optimization → Enable Auto Minify (JS, CSS, HTML)
- Caching → Configuration → Browser Cache TTL: 4 hours

#### Option C: Tên Miền Việt

1. Login vào quản lý domain
2. Chọn `luathoachat.vn` → Quản lý DNS
3. Thêm bản ghi A:
   ```
   Host: @
   Type: A
   Value: [IP từ Bolt]
   TTL: 3600
   ```
4. Thêm bản ghi CNAME:
   ```
   Host: www
   Type: CNAME
   Value: [xxx.bolt.new]
   TTL: 3600
   ```
5. Lưu thay đổi

---

## ⏱️ BƯỚC 3: ĐỢI DNS PROPAGATE

### Timeline:
- **Tối thiểu:** 5 phút
- **Trung bình:** 1-2 giờ
- **Tối đa:** 24-48 giờ

### Kiểm tra DNS Propagation:

#### Tool 1: DNS Checker
https://dnschecker.org
- Nhập: `luathoachat.vn`
- Type: A
- Check xem IP đã đúng chưa trên các server toàn cầu

#### Tool 2: Command Line
```bash
# Check A record
nslookup luathoachat.vn
# Hoặc
dig luathoachat.vn

# Check CNAME
nslookup www.luathoachat.vn
```

Kết quả mong đợi:
```
luathoachat.vn → [IP của Bolt]
www.luathoachat.vn → [xxx.bolt.new]
```

---

## 🔐 BƯỚC 4: ENABLE SSL (TỰ ĐỘNG)

Bolt.new tự động cấp SSL certificate qua **Let's Encrypt**.

### Timeline SSL:
- Sau khi DNS propagate: 5-15 phút
- Certificate tự động renew trước khi hết hạn

### Verify SSL:
1. Mở: `https://luathoachat.vn`
2. Click vào icon khóa 🔒 trên thanh địa chỉ
3. Certificate Details → Issued by: Let's Encrypt
4. Expiry Date: ~90 ngày kể từ khi issue

---

## ✅ BƯỚC 5: VERIFY & TEST

### 5.1. Test URLs

Tất cả các URLs sau phải redirect về `https://luathoachat.vn`:

```
✅ http://luathoachat.vn → https://luathoachat.vn
✅ https://luathoachat.vn → Load OK
✅ http://www.luathoachat.vn → https://luathoachat.vn
✅ https://www.luathoachat.vn → https://luathoachat.vn
```

### 5.2. Test Functionality

- [ ] Trang chủ load đầy đủ
- [ ] Chat AI hoạt động
- [ ] Đăng nhập/Đăng ký OK
- [ ] Upload file MSDS OK
- [ ] Mobile responsive
- [ ] F12 Console không có lỗi critical

### 5.3. Performance Test

**Tool:** https://pagespeed.web.dev

Nhập: `https://luathoachat.vn`

**Mục tiêu:**
- Performance: >85 (Mobile & Desktop)
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### 5.4. Security Test

**Tool:** https://securityheaders.com

Nhập: `https://luathoachat.vn`

**Kiểm tra:**
- ✅ HTTPS enabled
- ✅ Security headers present
- ✅ No mixed content warnings

---

## 🔧 TROUBLESHOOTING

### ❌ Lỗi: "DNS_PROBE_FINISHED_NXDOMAIN"

**Nguyên nhân:** DNS chưa propagate hoặc sai config

**Fix:**
1. Kiểm tra lại DNS records tại nhà cung cấp
2. Đợi thêm 1-2 giờ
3. Clear DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### ❌ Lỗi: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Nguyên nhân:** SSL chưa được issue

**Fix:**
1. Đợi 15-30 phút sau khi DNS propagate
2. Kiểm tra trong Bolt.new → Domains → SSL Status
3. Nếu vẫn lỗi, contact Bolt support

### ❌ Lỗi: "Too Many Redirects"

**Nguyên nhân:** Conflict giữa Cloudflare SSL và Bolt SSL

**Fix (nếu dùng Cloudflare):**
1. Cloudflare → SSL/TLS
2. Chọn: **Full (Strict)**
3. Disable "Always Use HTTPS" (tạm thời)
4. Clear browser cache và retry

### ❌ Web load nhưng không có CSS/JS

**Nguyên nhân:** CORS hoặc cache issue

**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
2. Check network tab trong F12 DevTools
3. Verify `next.config.js` có headers CORS đúng

---

## 📊 POST-DEPLOYMENT OPTIMIZATION

### 1. SEO Setup

Update file `app/layout.tsx` với metadata:

```typescript
export const metadata = {
  metadataBase: new URL('https://luathoachat.vn'),
  title: 'Luật Hóa Chất - Tra Cứu & Tư Vấn Pháp Lý',
  description: 'Hệ thống AI tra cứu và tư vấn Luật Hóa Chất...',
  alternates: {
    canonical: 'https://luathoachat.vn'
  }
}
```

### 2. Google Search Console

1. https://search.google.com/search-console
2. Add Property: `https://luathoachat.vn`
3. Verify ownership (DNS TXT record hoặc HTML file)
4. Submit Sitemap: `https://luathoachat.vn/sitemap.xml`

### 3. Analytics Setup

Verify Google Analytics tracking:
```javascript
// Check trong Console (F12)
gtag('config', 'G-XXXXXXXXXX');
```

### 4. Monitoring

**Uptime Monitoring:**
- UptimeRobot: https://uptimerobot.com
- Add monitor: `https://luathoachat.vn`
- Alert via email khi downtime

**Performance Monitoring:**
- Google PageSpeed Insights: Weekly check
- Core Web Vitals: Monitor LCP, FID, CLS

---

## 🎯 CHECKLIST TỔNG HỢP

### Pre-Deployment:
- [ ] Build pass local: `npm run build`
- [ ] Env variables đã add vào Bolt
- [ ] Supabase Edge Functions đã deploy
- [ ] Test trên URL Bolt tạm (xxx.bolt.new)

### Domain Configuration:
- [ ] Add domain `luathoachat.vn` trong Bolt
- [ ] Add subdomain `www.luathoachat.vn`
- [ ] Copy DNS records từ Bolt
- [ ] Config DNS tại nhà cung cấp domain
- [ ] Verify DNS propagation (dnschecker.org)

### SSL & Security:
- [ ] SSL certificate issued (khóa xanh 🔒)
- [ ] HTTPS redirect hoạt động
- [ ] Security headers OK (securityheaders.com)
- [ ] No mixed content warnings

### Functionality:
- [ ] Trang chủ load
- [ ] Chat AI hoạt động
- [ ] Auth flow OK (đăng ký/đăng nhập)
- [ ] Mobile responsive
- [ ] Performance score >85

### Post-Launch:
- [ ] Submit sitemap to Google Search Console
- [ ] Setup uptime monitoring
- [ ] Enable analytics tracking
- [ ] Backup database (Supabase)
- [ ] Document admin credentials

---

## 📞 SUPPORT

### Bolt.new Support:
- Docs: https://docs.bolt.new
- Support: https://bolt.new/support
- Status: https://status.bolt.new

### DNS/Domain Support:
- GoDaddy: https://support.godaddy.com
- Cloudflare: https://support.cloudflare.com
- Tên Miền Việt: [contact support]

### Emergency Contacts:
- Supabase Status: https://status.supabase.com
- CDN Issues: Check Bolt status page

---

**Cập nhật:** 2026-02-24
**Status:** ✅ Ready for Custom Domain
**Domain:** luathoachat.vn
**Hosting:** Bolt.new + Global CDN

🎉 **Chúc mừng! Bạn đã sẵn sàng đưa luathoachat.vn lên production!**
