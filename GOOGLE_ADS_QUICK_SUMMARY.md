# ⚡ Google Ads Setup - Tóm tắt nhanh

## ✅ ĐÃ HOÀN THÀNH

### 1. **Google Tag (gtag.js)** ✅
- Đã cài đặt trong `app/layout.tsx`
- Conversion ID: `AW-17948518438`
- Xuất hiện trên **TẤT CẢ** các trang

### 2. **Conversion Tracking Components** ✅
- File: `components/google-conversion-tracker.tsx`
- Hỗ trợ manual và auto tracking

### 3. **Page View Conversion** ✅
- Trang chủ track lượt xem trang
- Label: `owf2CIj7jfcbEKbQwu5C`

### 4. **Sign Up Conversion** ✅
- Track khi đăng ký thành công
- File: `app/dang-ky/page.tsx`

### 5. **Login Conversion** ✅
- Track khi đăng nhập thành công
- File: `app/dang-nhap/page.tsx`

---

## ⏳ CẦN LÀM TIẾP

### Bước 1: Tạo Conversion Actions trong Google Ads
1. Vào https://ads.google.com
2. **Tools & Settings** > **Conversions** > **+ New conversion action**
3. Tạo các actions:
   - ✅ **Lượt xem trang** (đã có: `owf2CIj7jfcbEKbQwu5C`)
   - ⏳ **Đăng ký tài khoản** (Goal: Sign-up)
   - ⏳ **Đăng nhập** (Goal: Custom)
   - ⏳ **Gửi form liên hệ** (Goal: Submit lead form)
   - ⏳ **Tải MSDS** (Goal: Download)

### Bước 2: Copy Conversion Labels
Mỗi action sẽ có một **Conversion Label** (dạng: `AbC123dEfG456`)

### Bước 3: Cập nhật Labels vào Code
**File cần sửa:** `components/google-conversion-tracker.tsx`

```typescript
export const CONVERSION_LABELS = {
  PAGE_VIEW: 'owf2CIj7jfcbEKbQwu5C', // ✅ Đã có

  // ⏳ Cần cập nhật các labels này:
  SIGN_UP: 'PASTE_YOUR_SIGN_UP_LABEL_HERE',
  LOGIN: 'PASTE_YOUR_LOGIN_LABEL_HERE',
  CONTACT_SUBMIT: 'PASTE_YOUR_CONTACT_LABEL_HERE',
  MSDS_DOWNLOAD: 'PASTE_YOUR_DOWNLOAD_LABEL_HERE',
};
```

### Bước 4: Deploy & Test
```bash
git add .
git commit -m "Add Google Ads conversion tracking"
git push
```

### Bước 5: Verify
- Sử dụng **Google Tag Assistant** extension
- Kiểm tra Console logs: `[Google Ads] Conversion tracked`
- Monitor trong Google Ads > Conversions (sau 24-48h)

---

## 📋 QUICK CHECKLIST

- [x] Google Tag installed on all pages
- [x] Page View conversion tracking (Homepage)
- [x] Sign Up conversion tracking
- [x] Login conversion tracking
- [ ] Create conversion actions in Google Ads UI
- [ ] Copy and update conversion labels
- [ ] Deploy to production
- [ ] Test conversions
- [ ] Monitor results (24-48h)

---

## 📞 SUPPORT LINKS

- **Tạo Conversion Actions:** https://support.google.com/google-ads/answer/6331314
- **Tag Assistant Extension:** https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk
- **Google Ads Dashboard:** https://ads.google.com

---

**📖 Xem hướng dẫn chi tiết:** `GOOGLE_ADS_CONVERSION_SETUP.md`
