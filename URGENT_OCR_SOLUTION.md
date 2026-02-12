# 🚨 GIẢI PHÁP KHẨN CẤP: TRÍCH XUẤT 100% VĂN BẢN PHÁP LUẬT

**TRẠNG THÁI HIỆN TẠI: 50% (2/4 files)**

---

## ❌ VẤN ĐỀ NGHIÊM TRỌNG

### Files CHƯA ĐẦY ĐỦ (cần xử lý GẤP):

1. **Luật Hóa chất 69/2025/QH15** (`69qh.signed.pdf`)
   - 29 trang - CHỈ trích xuất được 589 bytes (số trang)
   - ❌ Thiếu 100% nội dung văn bản

2. **Nghị định 24/2026/NĐ-CP** (`nghi-dinh-24-2026ndcp.pdf`)
   - 88 trang - CHỈ trích xuất được 1.7KB (số trang)
   - ❌ Thiếu 100% nội dung văn bản

**Nguyên nhân:** PDF dạng ảnh scan (không có text layer), cần OCR.

---

## ✅ GIẢI PHÁP 1: TẢI BẢN PDF GỐC (NHANH NHẤT - 5 PHÚT)

### Tải từ nguồn chính thức:

#### Luật Hóa chất 69/2025/QH15
**Nguồn chính thức:**
- **Cổng TTĐT Quốc hội:** https://quochoi.vn/hoatdongcuaquochoi/cackhoahopquochoi/quochoi_15/Pages/default.aspx
- **Công báo điện tử:** https://congbao.chinhphu.vn/
- **Tìm kiếm:** Vào trang → Tìm "Luật Hóa chất 69/2025" → Tải bản PDF có thể copy text

#### Nghị định 24/2026/NĐ-CP
**Nguồn chính thức:**
- **Cổng TTĐT Chính phủ:** https://chinhphu.vn
- **Công báo điện tử:** https://congbao.chinhphu.vn/
- **Tìm kiếm:** Vào trang → Tìm "Nghị định 24/2026" → Tải bản PDF có thể copy text

### Cách kiểm tra PDF có text layer:
```
1. Mở PDF
2. Bấm Ctrl+F (hoặc Cmd+F trên Mac)
3. Gõ "Chính phủ" hoặc "Điều 1"
4. Nếu TÌM ĐƯỢC → PDF có text, dùng được ✅
5. Nếu KHÔNG TÌM ĐƯỢC → PDF dạng ảnh, cần OCR ❌
```

**SAU KHI TẢI ĐƯỢC FILE MỚI:**
```bash
# Thay thế file cũ
cp [file-moi].pdf /tmp/cc-agent/63357473/project/data/legal-documents/

# Chạy lại extraction
node scripts/extract-pdfs.js

# Kiểm tra kết quả
wc -c data/legal-documents/extracted-text/*.txt
```

---

## ✅ GIẢI PHÁP 2: OCR TỰ ĐỘNG (15-30 PHÚT)

### Option A: Google Drive OCR (MIỄN PHÍ, DỄ NHẤT)

**Bước 1: Upload PDF lên Google Drive**
1. Vào https://drive.google.com
2. Upload 2 file PDF:
   - `69qh.signed.pdf`
   - `nghi-dinh-24-2026ndcp.pdf`

**Bước 2: OCR tự động**
1. Click phải vào file PDF
2. Chọn "Open with" → "Google Docs"
3. Google Docs sẽ tự động OCR và chuyển thành text có thể chỉnh sửa
4. File → Download → Plain Text (.txt)

**Bước 3: Đặt tên và copy vào project**
- `69qh.signed.pdf` → Tải về → Đổi tên thành `69qh_luat_hoa_chat.txt`
- `nghi-dinh-24-2026ndcp.pdf` → Tải về → Đổi tên thành `nghi_dinh_24_2026.txt`

```bash
# Copy vào đúng thư mục
cp ~/Downloads/69qh_luat_hoa_chat.txt data/legal-documents/extracted-text/
cp ~/Downloads/nghi_dinh_24_2026.txt data/legal-documents/extracted-text/
```

**Lưu ý:** Cần kiểm tra lại chính tả sau khi OCR (độ chính xác ~95-98%).

---

### Option B: Adobe Acrobat Online (CHÍNH XÁC NHẤT)

**Link:** https://www.adobe.com/acrobat/online/pdf-to-text.html

**Ưu điểm:**
- Độ chính xác cao (~99%)
- Giữ nguyên format
- Hỗ trợ tiếng Việt tốt

**Cách dùng:**
1. Vào link trên
2. Upload file PDF
3. Đợi convert (1-2 phút/file)
4. Download file TXT
5. Copy vào `data/legal-documents/extracted-text/`

---

### Option C: OCR.space API (MIỄN PHÍ)

**Link:** https://ocr.space/

**Ưu điểm:**
- API miễn phí 25,000 requests/tháng
- Hỗ trợ tiếng Việt
- Có thể tự động hóa

**Cách dùng thủ công:**
1. Vào https://ocr.space/
2. Chọn "Upload File"
3. Chọn Language: Vietnamese
4. Click "Start OCR"
5. Copy text → Lưu vào file TXT

**Hoặc dùng script (nếu muốn tự động):**

Tôi có thể tạo script OCR tự động nếu bạn đăng ký API key (miễn phí).

---

### Option D: Tesseract OCR (CHUYÊN NGHIỆP)

**Cài đặt (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-vie poppler-utils

# Chuyển PDF sang ảnh
pdftoppm -png data/legal-documents/69qh.signed.pdf output-69qh/page

# Chạy OCR cho từng trang
for file in output-69qh/*.png; do
  tesseract "$file" "${file%.png}" -l vie
done

# Ghép các trang lại
cat output-69qh/*.txt > data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt

# Làm tương tự cho Nghị định 24
pdftoppm -png data/legal-documents/nghi-dinh-24-2026ndcp.pdf output-24/page
for file in output-24/*.png; do
  tesseract "$file" "${file%.png}" -l vie
done
cat output-24/*.txt > data/legal-documents/extracted-text/nghi_dinh_24_2026.txt
```

---

## 📊 SO SÁNH CÁC PHƯƠNG ÁN

| Phương án | Thời gian | Độ chính xác | Chi phí | Độ khó |
|-----------|-----------|--------------|---------|---------|
| **Tải PDF gốc** | 5 phút | 100% | Miễn phí | ⭐ Dễ nhất |
| **Google Drive OCR** | 10 phút | 95-98% | Miễn phí | ⭐⭐ Dễ |
| **Adobe Online** | 15 phút | 99% | Miễn phí | ⭐⭐ Dễ |
| **OCR.space** | 15 phút | 95-97% | Miễn phí | ⭐⭐ Dễ |
| **Tesseract** | 30 phút | 90-95% | Miễn phí | ⭐⭐⭐⭐ Khó |

---

## 🎯 KHUYẾN NGHỊ

### Thứ tự ưu tiên:

1. **CÁCH NHANH NHẤT:** Tải bản PDF gốc có text layer từ Công báo điện tử
2. **DỰ PHÒNG:** Nếu không tìm được, dùng Google Drive OCR
3. **CHUYÊN NGHIỆP:** Nếu cần độ chính xác tối đa, dùng Adobe Acrobat

---

## ✅ SAU KHI CÓ ĐẦY ĐỦ 4 FILES

### Kiểm tra kết quả:
```bash
# Kiểm tra dung lượng (phải > 10KB mỗi file)
ls -lh data/legal-documents/extracted-text/

# Kiểm tra số dòng (phải > 1000 dòng cho file lớn)
wc -l data/legal-documents/extracted-text/*.txt

# Kiểm tra nội dung (phải thấy chữ tiếng Việt)
head -50 data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt
head -50 data/legal-documents/extracted-text/nghi_dinh_24_2026.txt
```

### Chạy ingestion vào RAG system:
```bash
# Nạp toàn bộ 4 files vào database
npm run ingest-legal-docs

# Test hệ thống
bash scripts/test-rag-system.sh

# Build để đảm bảo không lỗi
npm run build
```

---

## 📞 CẦN TRỢ GIÚP

**Nếu gặp vấn đề:**
1. Báo ngay cho tôi kết quả sau khi OCR
2. Gửi 50 dòng đầu của file đã OCR để tôi kiểm tra
3. Nếu văn bản bị lỗi font/encoding, tôi sẽ fix

**File này sẽ được cập nhật:** `URGENT_OCR_SOLUTION.md`

---

**Lưu ý quan trọng:** Sau khi OCR, CẦN KIỂM TRA LẠI chính tả và format vì OCR có thể nhầm lẫn một số ký tự đặc biệt hoặc dấu tiếng Việt. Đối với văn bản pháp luật, độ chính xác phải là 100%.
