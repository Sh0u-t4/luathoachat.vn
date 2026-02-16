# 🎯 Hướng dẫn Cài đặt Google Ads Conversion Tracking

## ✅ CÁC BƯỚC ĐÃ HOÀN THÀNH

### 1. **Google Tag (gtag.js) đã được cài đặt** ✅
- File: `app/layout.tsx` (dòng 207-224)
- Conversion ID: `AW-17948518438`
- Google Tag xuất hiện trên **TẤT CẢ** các trang của website

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17948518438"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-17948518438');
</script>
```

### 2. **Conversion Event Components đã được tạo** ✅
- File: `components/google-conversion-tracker.tsx`
- Hỗ trợ tracking conversion tự động và manual

### 3. **Page View Conversion đã được cài đặt** ✅
- **Trang chủ** (`app/page.tsx`): Track lượt xem trang
- Conversion Label: `owf2CIj7jfcbEKbQwu5C`

### 4. **Sign Up Conversion đã được cài đặt** ✅
- **Trang đăng ký** (`app/dang-ky/page.tsx`): Track khi đăng ký thành công
- Trigger: Sau khi user đăng ký thành công

### 5. **Login Conversion đã được cài đặt** ✅
- **Trang đăng nhập** (`app/dang-nhap/page.tsx`): Track khi đăng nhập thành công
- Trigger: Sau khi user đăng nhập thành công

---

## 📋 CÁC BƯỚC CÒN LẠI (CẦN THỰC HIỆN)

### Bước 1: Tạo thêm Conversion Actions trong Google Ads

Hiện tại chỉ có 1 conversion action: **"Lượt xem trang"** (`owf2CIj7jfcbEKbQwu5C`)

Bạn cần tạo thêm các conversion actions sau:

#### **1.1. Tạo Conversion Action cho "Đăng ký"**
1. Truy cập: https://ads.google.com
2. Vào **Tools & Settings** (biểu tượng cờ lê) > **Conversions**
3. Click **+ New conversion action**
4. Chọn **Website**
5. Điền thông tin:
   - **Goal**: Sign-up
   - **Conversion name**: "Đăng ký tài khoản"
   - **Value**: 1.0 VND (hoặc giá trị ước tính của 1 lead)
   - **Count**: One (chỉ đếm 1 lần mỗi user)
   - **Conversion window**: 30 days
   - **Attribution model**: Last click
6. Chọn **Tag setup**: Use Google tag
7. **Copy Conversion Label** (dạng: `AbC123dEfG456`)
8. Cập nhật vào code:

**File cần sửa:** `components/google-conversion-tracker.tsx`
```typescript
export const CONVERSION_LABELS = {
  PAGE_VIEW: 'owf2CIj7jfcbEKbQwu5C',

  // Thay thế label này bằng label thực tế từ Google Ads
  SIGN_UP: 'AbC123dEfG456', // ← Dán label mới vào đây

  LOGIN: 'LOGIN_LABEL',
  CONTACT_SUBMIT: 'CONTACT_LABEL',
  MSDS_DOWNLOAD: 'DOWNLOAD_LABEL',
};
```

#### **1.2. Tạo Conversion Action cho "Đăng nhập"**
Lặp lại các bước tương tự như trên với:
- **Goal**: Custom > "Đăng nhập"
- **Conversion name**: "Đăng nhập thành công"
- **Value**: 0.5 VND
- Copy label và cập nhật vào `LOGIN: 'YOUR_LABEL_HERE'`

#### **1.3. Tạo Conversion Action cho "Submit Form Liên hệ"**
- **Goal**: Submit lead form
- **Conversion name**: "Gửi form liên hệ"
- **Value**: 2.0 VND
- Copy label và cập nhật vào `CONTACT_SUBMIT: 'YOUR_LABEL_HERE'`

#### **1.4. Tạo Conversion Action cho "Tải MSDS"**
- **Goal**: Download
- **Conversion name**: "Tải tài liệu MSDS"
- **Value**: 0.5 VND
- Copy label và cập nhật vào `MSDS_DOWNLOAD: 'YOUR_LABEL_HERE'`

---

### Bước 2: Verify Google Tag đã hoạt động

#### **Sử dụng Google Tag Assistant:**
1. Cài extension: [Tag Assistant Legacy (by Google)](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Truy cập website: `https://luathoachat.vn`
3. Click vào extension Tag Assistant > **Enable**
4. Refresh trang
5. Kiểm tra:
   - ✅ Phải thấy **Google Ads Conversion Tracking** tag
   - ✅ Tag status: **Green** (Working)
   - ✅ Conversion ID: `AW-17948518438`

#### **Sử dụng Chrome DevTools:**
```javascript
// Mở Chrome DevTools (F12) > Console
// Gõ lệnh sau để kiểm tra gtag:
console.log(window.dataLayer);

// Kết quả mong đợi: Array chứa các events tracking
```

---

### Bước 3: Test Conversion Tracking

#### **Test Page View Conversion:**
1. Truy cập trang chủ: `https://luathoachat.vn`
2. Mở Chrome DevTools > Console
3. Phải thấy log: `[Google Ads] Conversion tracked: owf2CIj7jfcbEKbQwu5C`
4. Trong Google Ads, vào **Conversions** > **"Lượt xem trang"**
5. Sau 24-48h, phải thấy conversion tăng lên

#### **Test Sign Up Conversion:**
1. Truy cập: `https://luathoachat.vn/dang-ky`
2. Điền form và đăng ký
3. Sau khi đăng ký thành công, check Console
4. Phải thấy: `[Google Ads] Manual conversion tracked: SIGN_UP_LABEL`

#### **Test Login Conversion:**
1. Truy cập: `https://luathoachat.vn/dang-nhap`
2. Đăng nhập
3. Sau khi đăng nhập thành công, check Console
4. Phải thấy: `[Google Ads] Manual conversion tracked: LOGIN_LABEL`

---

### Bước 4: Monitor Conversions trong Google Ads

1. Truy cập: https://ads.google.com
2. Vào **Tools & Settings** > **Conversions**
3. Bạn sẽ thấy danh sách các conversion actions:
   - **Lượt xem trang** (owf2CIj7jfcbEKbQwu5C) ✅
   - **Đăng ký tài khoản** (pending setup)
   - **Đăng nhập thành công** (pending setup)
   - **Gửi form liên hệ** (pending setup)
   - **Tải tài liệu MSDS** (pending setup)

4. Mỗi conversion action sẽ hiển thị:
   - **Conversion name**
   - **Status**: Recording conversions / Not recording
   - **Conversions** (30 days): Số lượng conversions
   - **Cost per conversion**: Chi phí trung bình cho mỗi conversion

---

## 🔧 THÊM TRACKING CHO CÁC ACTIONS KHÁC

### **Tracking Form Liên hệ**

**File:** `app/lien-he/page.tsx`

Thêm sau khi submit form thành công:
```typescript
import { useGoogleConversion, CONVERSION_LABELS } from '@/components/google-conversion-tracker';

export default function ContactPage() {
  const { trackConversion } = useGoogleConversion();

  const handleSubmit = async () => {
    // ... xử lý submit form

    // Nếu submit thành công:
    trackConversion(CONVERSION_LABELS.CONTACT_SUBMIT, 2.0, 'VND');
    toast.success('Đã gửi thông tin liên hệ');
  };
}
```

### **Tracking MSDS Download**

**File:** Bất kỳ nơi nào có nút "Tải MSDS"

```typescript
import { useGoogleConversion, CONVERSION_LABELS } from '@/components/google-conversion-tracker';

const handleDownload = () => {
  const { trackConversion } = useGoogleConversion();

  // Khi user click download
  trackConversion(CONVERSION_LABELS.MSDS_DOWNLOAD, 0.5, 'VND');

  // Tiếp tục xử lý download
  window.open('/path/to/msds.pdf', '_blank');
};
```

---

## 📊 CONVERSION VALUE RECOMMENDATIONS

Gợi ý giá trị cho từng loại conversion:

| Conversion Type | Giá trị đề xuất | Lý do |
|----------------|-----------------|-------|
| **Lượt xem trang** | 1.0 VND | Người dùng quan tâm đến dịch vụ |
| **Đăng ký** | 50.0 VND | Lead mới, giá trị cao nhất |
| **Đăng nhập** | 10.0 VND | User quay lại, có khả năng cao chuyển đổi |
| **Gửi form liên hệ** | 30.0 VND | Người dùng có nhu cầu rõ ràng |
| **Tải MSDS** | 5.0 VND | Engagement, quan tâm nội dung |

**Lưu ý:** Điều chỉnh giá trị này dựa trên giá trị thực tế của doanh nghiệp bạn.

---

## ⚠️ TROUBLESHOOTING

### **Vấn đề 1: Conversion không được track**
**Nguyên nhân:**
- Google Tag chưa load kịp trước khi tracking
- Ad blocker chặn gtag.js

**Giải pháp:**
- Thêm delay 1s trước khi track (đã implement trong code)
- Test trên Incognito mode (disable extensions)

### **Vấn đề 2: Conversion hiển thị "Not recording"**
**Nguyên nhân:**
- Conversion label sai hoặc chưa được tạo trong Google Ads

**Giải pháp:**
- Double check label trong Google Ads UI
- Đảm bảo format: `AW-17948518438/YOUR_LABEL_HERE`

### **Vấn đề 3: Duplicate conversions**
**Nguyên nhân:**
- User refresh trang conversion nhiều lần

**Giải pháp:**
- Trong Google Ads, set **Count** = **One** (chỉ đếm 1 lần)

---

## 🚀 NEXT STEPS

1. ✅ Google Tag đã cài đặt
2. ⏳ **Tạo các conversion actions trong Google Ads UI** ← BẠN ĐANG Ở ĐÂY
3. ⏳ Copy conversion labels và cập nhật vào code
4. ⏳ Deploy code lên production
5. ⏳ Test các conversions
6. ⏳ Monitor kết quả sau 24-48h
7. ⏳ Optimize campaigns dựa trên conversion data

---

## 📞 HỖ TRỢ

**Google Ads Support:**
- Help Center: https://support.google.com/google-ads
- Conversion Tracking Guide: https://support.google.com/google-ads/answer/6331314

**Tag Manager Help:**
- Tag Assistant: https://support.google.com/tagassistant

---

**✅ Setup hoàn tất! Chỉ còn cần tạo conversion actions trong Google Ads và cập nhật labels.**
