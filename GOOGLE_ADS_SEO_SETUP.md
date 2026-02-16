# 🚀 Hướng dẫn Cấu hình Google Ads & SEO

## ✅ Các File Đã Được Tạo

### 1. **robots.txt** (`/public/robots.txt`)
File này cho phép Google và các bot khác crawl website:
- ✅ Cho phép tất cả các bot truy cập
- ✅ Cấu hình đặc biệt cho Google Ads Bot
- ✅ Chặn các đường dẫn nội bộ (`/api/`, `/_next/`)
- ✅ Khai báo sitemap location

**URL truy cập:** `https://luathoachat.vn/robots.txt`

### 2. **sitemap.xml** (`/public/sitemap.xml`)
Danh sách tất cả các trang quan trọng của website:
- Trang chủ (Priority: 1.0)
- Tra cứu Hóa chất (Priority: 0.9)
- Khai báo, Kiểm tra, Giấy phép, Liên hệ
- Các trang đăng nhập/đăng ký

**URL truy cập:** `https://luathoachat.vn/sitemap.xml`

### 3. **ads.txt** (`/public/ads.txt`)
File xác thực các nhà cung cấp quảng cáo được phép:
- ⚠️ **QUAN TRỌNG:** Cần cập nhật Publisher ID từ Google AdSense

**URL truy cập:** `https://luathoachat.vn/ads.txt`

---

## 📋 Checklist Triển khai

### Bước 1: Deploy lên Production
```bash
# Các file đã có sẵn trong /public/, chỉ cần deploy
git add .
git commit -m "Add robots.txt, sitemap.xml, ads.txt for Google Ads"
git push
```

### Bước 2: Xác minh trên Google Search Console
1. Truy cập: https://search.google.com/search-console
2. Chọn property: `luathoachat.vn`
3. Vào **Cài đặt > robots.txt**
4. Kiểm tra file: `https://luathoachat.vn/robots.txt`
5. Nếu thấy nội dung → ✅ **Thành công!**

### Bước 3: Submit Sitemap
1. Trong Google Search Console
2. Vào **Sitemaps** (menu bên trái)
3. Nhập: `sitemap.xml`
4. Click **SUBMIT**
5. Chờ 24-48h để Google index

### Bước 4: Cấu hình Google AdSense (Nếu dùng AdSense)
1. Truy cập: https://www.google.com/adsense
2. Đăng nhập và vào **Account > Settings**
3. Tìm **Publisher ID** (dạng: `pub-1234567890123456`)
4. **Cập nhật file `ads.txt`:**
   ```bash
   # Mở file: /public/ads.txt
   # Thay thế dòng này:
   google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0

   # Bằng Publisher ID thực tế:
   google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
   ```
5. Deploy lại website
6. Vào AdSense > **Sites** > Kiểm tra trạng thái `ads.txt`

### Bước 5: Cấu hình Google Ads (Nếu chạy Google Ads)
1. Truy cập: https://ads.google.com
2. Tạo campaign mới
3. Chọn **Search** hoặc **Display**
4. Landing page: `https://luathoachat.vn`
5. Google sẽ tự động crawl qua `robots.txt` và `ads.txt`

---

## 🔍 Kiểm tra Hoạt động

### Test robots.txt:
```bash
# Cách 1: Truy cập trực tiếp
https://luathoachat.vn/robots.txt

# Cách 2: Test bằng Google Search Console
https://search.google.com/search-console -> Cài đặt -> robots.txt
```

### Test sitemap.xml:
```bash
# Truy cập trực tiếp
https://luathoachat.vn/sitemap.xml

# Hoặc kiểm tra trong Google Search Console
Sitemaps -> Xem chi tiết
```

### Test ads.txt:
```bash
# Truy cập trực tiếp
https://luathoachat.vn/ads.txt

# Hoặc kiểm tra trong Google AdSense
Sites -> Xem trạng thái ads.txt
```

---

## 📊 Nội dung File robots.txt

```txt
# Cho phép tất cả các bot
User-agent: *
Allow: /

# Cho phép Google Ads Bot
User-agent: AdsBot-Google
Allow: /

User-agent: AdsBot-Google-Mobile
Allow: /

# Chặn một số đường dẫn nội bộ
Disallow: /api/
Disallow: /_next/

# Sitemap
Sitemap: https://luathoachat.vn/sitemap.xml
```

**Ý nghĩa:**
- ✅ `Allow: /` → Cho phép crawl toàn bộ website
- ✅ `AdsBot-Google` → Đặc biệt cho Google Ads
- 🚫 `Disallow: /api/` → Chặn các API endpoints nội bộ
- 📍 `Sitemap:` → Chỉ đường cho bot tìm sitemap

---

## ⚡ Lưu ý Quan trọng

### 1. **File ads.txt**
- ⚠️ **BẮT BUỘC** phải cập nhật Publisher ID thực tế
- Nếu không dùng Google AdSense → Có thể xóa file này
- Nếu dùng nhiều ad network → Thêm các dòng tương ứng

### 2. **Thời gian Index**
- Google cần **24-48 giờ** để crawl và index
- Sitemap có thể mất **1-2 tuần** để hoàn tất
- Kiểm tra tiến độ trong Google Search Console

### 3. **URL Canonical**
- Đảm bảo website chỉ có 1 version:
  - ✅ `https://luathoachat.vn`
  - ❌ `http://luathoachat.vn` (redirect về HTTPS)
  - ❌ `www.luathoachat.vn` (redirect về non-www)

### 4. **Page Speed**
- Google Ads đánh giá cao tốc độ trang
- Kiểm tra: https://pagespeed.web.dev/
- Mục tiêu: **Điểm số > 80** cho Mobile

---

## 🎯 Các Bước Tiếp Theo

1. ✅ **Deploy** các file lên production
2. ✅ **Verify** trên Google Search Console
3. ✅ **Submit sitemap** trong Search Console
4. ✅ **Cập nhật ads.txt** với Publisher ID thực tế
5. ✅ **Chạy Google Ads campaign**
6. ✅ **Theo dõi hiệu suất** trong 7-14 ngày đầu

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
- Google Search Console Help: https://support.google.com/webmasters
- Google Ads Help: https://support.google.com/google-ads
- AdSense Help: https://support.google.com/adsense

---

**✅ Setup hoàn tất! Website đã sẵn sàng cho Google Ads và SEO.**
