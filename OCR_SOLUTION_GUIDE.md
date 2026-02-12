# 🔍 HƯỚNG DẪN GIẢI QUYẾT VẤN ĐỀ OCR CHO PDF SCAN

**Ngày:** 2026-02-07
**Vấn đề:** 2/4 văn bản pháp luật là PDF dạng scan (image-based), không thể trích xuất text bằng pdf-parse

---

## 📋 TÌNH TRẠNG HIỆN TẠI

### ✅ ĐÃ HOÀN THÀNH (2/4 files - 50%)
- **Nghị định 25/2026/NĐ-CP:** 121 KB text extracted ✅
- **Nghị định 26/2026/NĐ-CP:** 141 KB text extracted ✅

### ⚠️ CẦN OCR (2/4 files - 50%)
- **Luật Hóa chất 69/2025/QH15:** Chỉ có 589 bytes (thiếu ~29 trang) ❌
- **Nghị định 24/2026/NĐ-CP:** Chỉ có 1.8 KB (thiếu ~88 trang) ❌

---

## 🚀 GIẢI PHÁP 1: SỬ DỤNG SCRIPT OCR TỰ ĐỘNG (KHUYÊN DÙNG)

Tôi đã tạo script `scripts/ocr-pdf-online.js` sử dụng OCR.space API (miễn phí).

### Cách sử dụng:

```bash
# Chạy OCR cho 2 file PDF scan
npm run ocr-scanned-pdfs
```

### Đặc điểm:
- ✅ **Miễn phí:** 25,000 requests/tháng
- ✅ **Hỗ trợ tiếng Việt:** OCR Engine 2 tối ưu cho ngôn ngữ Châu Á
- ✅ **Tự động:** Chạy 1 lệnh, hoàn thành toàn bộ
- ⚠️ **Giới hạn:** Mỗi file tối đa 5 MB (free tier)

### Vấn đề với Giải pháp 1:
- File `69qh.signed.pdf` = 1.4 MB ✅ (OK)
- File `nghi-dinh-24-2026ndcp.pdf` = 3.6 MB ✅ (OK)
- **CẢ 2 FILE ĐỀU NẰM TRONG GIỚI HẠN 5MB!**

---

## 🌐 GIẢI PHÁP 2: GOOGLE DRIVE OCR (ĐƠN GIẢN NHẤT - 100% FREE)

Đây là giải pháp **DỄ NHẤT, NHANH NHẤT, MIỄN PHÍ HOÀN TOÀN** và **KHÔNG CÓ GIỚI HẠN FILE SIZE**.

### Các bước thực hiện:

#### Bước 1: Upload PDF lên Google Drive
1. Truy cập: https://drive.google.com
2. Click **"New" (Mới)** → **"File upload" (Tải file lên)**
3. Chọn file: `data/legal-documents/69qh.signed.pdf`
4. Chờ upload hoàn tất

#### Bước 2: Mở file bằng Google Docs (tự động OCR)
1. Right-click vào file PDF vừa upload
2. Chọn: **"Open with" → "Google Docs"**
3. Google sẽ tự động OCR và chuyển thành văn bản (2-5 phút cho file 29 trang)

#### Bước 3: Tải về dưới dạng Text
1. Trong Google Docs, click: **"File" → "Download" → "Plain Text (.txt)"**
2. Lưu file với tên: `69qh_luat_hoa_chat_ocr.txt`

#### Bước 4: Di chuyển file vào dự án
```bash
# Copy file text vào thư mục extracted-text
cp ~/Downloads/69qh_luat_hoa_chat_ocr.txt data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt
```

#### Bước 5: Lặp lại cho file thứ 2
- Upload `data/legal-documents/nghi-dinh-24-2026ndcp.pdf`
- Open with Google Docs
- Download as Plain Text
- Save as `nghi_dinh_24_2026.txt`

### Ưu điểm của Google Drive OCR:
- ✅ **100% miễn phí**
- ✅ **Không giới hạn kích thước file**
- ✅ **OCR chất lượng cao** (sử dụng Google Cloud Vision AI)
- ✅ **Hỗ trợ tiếng Việt tốt**
- ✅ **Không cần cài đặt gì**
- ✅ **Chạy trên trình duyệt**

---

## 🖥️ GIẢI PHÁP 3: ADOBE ACROBAT ONLINE

### Cách sử dụng:
1. Truy cập: https://www.adobe.com/acrobat/online/pdf-to-text.html
2. Upload file PDF scan
3. Adobe tự động OCR
4. Download file .txt

### Đặc điểm:
- ✅ Miễn phí (giới hạn 2 files/ngày)
- ✅ Chất lượng OCR cao
- ⚠️ Cần tạo tài khoản Adobe (miễn phí)

---

## 💻 GIẢI PHÁP 4: TESSERACT OCR (LOCAL - CHO CHUYÊN GIA)

Nếu bạn muốn chạy OCR hoàn toàn offline trên máy local:

### Cài đặt (Ubuntu/macOS):
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-vie poppler-utils

# macOS
brew install tesseract tesseract-lang poppler
```

### Chạy OCR:
```bash
# Chuyển PDF sang ảnh
cd data/legal-documents
pdftoppm -png 69qh.signed.pdf page

# OCR từng trang
for file in page-*.png; do
  tesseract "$file" "${file%.png}" -l vie
done

# Ghép các file text
cat page-*.txt > extracted-text/69qh_luat_hoa_chat.txt

# Dọn dẹp
rm page-*.png page-*.txt
```

### Đặc điểm:
- ✅ 100% offline, bảo mật cao
- ✅ Không giới hạn số lượng file
- ⚠️ Cần cài đặt phức tạp
- ⚠️ Chất lượng OCR trung bình cho tiếng Việt

---

## 🎯 KHUYẾN NGHỊ: GIẢI PHÁP NÀO TỐT NHẤT?

### Cho người dùng thông thường:
**→ DÙNG GOOGLE DRIVE OCR (Giải pháp 2)**
- Lý do: Dễ nhất, nhanh nhất, không giới hạn, chất lượng cao

### Cho developer muốn tự động hóa:
**→ DÙNG SCRIPT OCR.SPACE (Giải pháp 1)**
```bash
npm run ocr-scanned-pdfs
```
- Lý do: Tự động, có thể tích hợp vào workflow, miễn phí

### Cho môi trường doanh nghiệp (bảo mật cao):
**→ DÙNG TESSERACT LOCAL (Giải pháp 4)**
- Lý do: Không upload dữ liệu lên cloud, đảm bảo bảo mật

---

## 📊 SO SÁNH CÁC GIẢI PHÁP

| Giải pháp | Chi phí | Chất lượng OCR | Tốc độ | Độ khó | Giới hạn |
|-----------|---------|----------------|--------|--------|----------|
| **Script OCR.space** | Free | ⭐⭐⭐⭐ | Nhanh | Dễ | 5MB/file |
| **Google Drive** | Free | ⭐⭐⭐⭐⭐ | Trung bình | Rất dễ | Không |
| **Adobe Online** | Free | ⭐⭐⭐⭐⭐ | Nhanh | Dễ | 2 files/ngày |
| **Tesseract** | Free | ⭐⭐⭐ | Chậm | Khó | Không |

---

## ✅ BƯỚC TIẾP THEO SAU KHI OCR XONG

Khi đã có đầy đủ 4 file text:

### 1. Kiểm tra kết quả:
```bash
# Kiểm tra kích thước file
ls -lh data/legal-documents/extracted-text/

# File size mong đợi:
# 69qh_luat_hoa_chat.txt: ~50-100 KB (thay vì 589 bytes)
# nghi_dinh_24_2026.txt: ~150-200 KB (thay vì 1.8 KB)
```

### 2. Chạy ingestion vào RAG database:
```bash
npm run ingest-legal-docs
```

### 3. Test hệ thống RAG:
```bash
bash scripts/test-rag-system.sh
```

### 4. Deploy lên production:
```bash
npm run build
```

---

## 📞 HỖ TRỢ

### Nếu gặp vấn đề:
1. **OCR script không chạy:** Kiểm tra API key tại https://ocr.space/ocrapi
2. **File quá lớn:** Dùng Google Drive OCR thay vì script
3. **OCR sai chữ:** Chỉnh sửa thủ công các phần quan trọng

### Tài liệu liên quan:
- `EXTRACTION_STATUS.md` - Trạng thái trích xuất hiện tại
- `BACKEND_RAG_IMPLEMENTATION.md` - Chi tiết kỹ thuật RAG system
- `QUICK_START_GUIDE.md` - Hướng dẫn khởi động nhanh

---

## 🎉 KẾT LUẬN

**Giải pháp đề xuất ngay bây giờ:**

1. **NHANH NHẤT (10 phút):**
   → Dùng **Google Drive OCR** (Giải pháp 2)
   → Upload 2 files PDF → Open with Google Docs → Download as Text

2. **TỰ ĐỘNG HÓA (1 dòng lệnh):**
   → Chạy: `npm run ocr-scanned-pdfs`
   → Chờ script hoàn thành

3. **SAU KHI XONG:**
   → Chạy: `npm run ingest-legal-docs`
   → Hệ thống RAG sẽ có đầy đủ 100% dữ liệu pháp luật!

---

**LƯU Ý QUAN TRỌNG:** Văn bản pháp luật yêu cầu độ chính xác 100%. Sau khi OCR xong, nên:
- So sánh ngẫu nhiên vài đoạn với PDF gốc
- Kiểm tra các con số, ngày tháng, tên riêng
- Sửa lỗi OCR nếu phát hiện

**Lý do:** Luật pháp không được phép sai 1 chữ!
