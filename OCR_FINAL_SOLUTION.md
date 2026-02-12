# ⚡ GIẢI PHÁP OCR - HÀNH ĐỘNG NGAY

**Tình huống:** Script OCR.space không hoạt động vì files quá lớn (limit 1MB, files của chúng ta: 1.4MB và 3.6MB)

**Giải pháp:** Dùng **GOOGLE DRIVE OCR** - Miễn phí, Không giới hạn, Chất lượng cao nhất

---

## 🎯 HƯỚNG DẪN THỰC HIỆN (10 PHÚT HOÀN THÀNH)

### FILE 1: Luật Hóa chất 69/2025/QH15

#### Bước 1: Upload lên Google Drive
1. Mở: https://drive.google.com
2. Click **"+ New"** (góc trái) → **"File upload"**
3. Chọn file: `/tmp/cc-agent/63357473/project/data/legal-documents/69qh.signed.pdf`
4. Chờ upload xong (file 1.4MB, ~30 giây)

#### Bước 2: OCR tự động bằng Google Docs
1. **Right-click** vào file PDF vừa upload
2. Chọn: **"Open with" → "Google Docs"**
3. Google sẽ tự động OCR (2-3 phút cho 29 trang)
4. Bạn sẽ thấy văn bản xuất hiện trong Google Docs

#### Bước 3: Kiểm tra và chỉnh sửa (quan trọng!)
- Cuộn qua văn bản
- Kiểm tra các con số, ngày tháng, tên riêng có đúng không
- Sửa lỗi OCR nếu thấy (OCR đôi khi nhầm chữ: o/ô, u/ư, d/đ)

#### Bước 4: Download file text
1. Trong Google Docs, click: **"File" → "Download" → "Plain Text (.txt)"**
2. File sẽ download về máy với tên: `69qh.signed.txt`

#### Bước 5: Đổi tên và copy vào project
```bash
# Mở Terminal, cd vào thư mục project
cd /tmp/cc-agent/63357473/project

# Copy file từ Downloads
cp ~/Downloads/69qh.signed.txt data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt

# Kiểm tra kích thước (phải > 50KB thay vì 589 bytes hiện tại)
ls -lh data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt
```

---

### FILE 2: Nghị định 24/2026/NĐ-CP

**LẶP LẠI CÁC BƯỚC TRÊN:**

1. Upload: `nghi-dinh-24-2026ndcp.pdf` lên Google Drive (file 3.6MB, ~1 phút)
2. Open with Google Docs (tự động OCR, ~5 phút cho 88 trang)
3. Kiểm tra và sửa lỗi nếu cần
4. Download as Plain Text: `nghi-dinh-24-2026ndcp.txt`
5. Copy vào project:
```bash
cp ~/Downloads/nghi-dinh-24-2026ndcp.txt data/legal-documents/extracted-text/nghi_dinh_24_2026.txt

# Kiểm tra kích thước (phải > 150KB thay vì 1.8KB hiện tại)
ls -lh data/legal-documents/extracted-text/nghi_dinh_24_2026.txt
```

---

## ✅ SAU KHI HOÀN THÀNH 2 FILES OCR

### Bước 1: Kiểm tra tất cả 4 files
```bash
ls -lh data/legal-documents/extracted-text/

# Kết quả mong đợi:
# 69qh_luat_hoa_chat.txt: ~80-120 KB ✅
# nghi_dinh_24_2026.txt: ~180-250 KB ✅
# nghi_dinh_25_2026.txt: 121 KB ✅ (đã có)
# nghi_dinh_26_2026.txt: 141 KB ✅ (đã có)
```

### Bước 2: Ingest vào RAG database
```bash
npm run ingest-legal-docs
```

### Bước 3: Test hệ thống
```bash
bash scripts/test-rag-system.sh
```

### Bước 4: Build project
```bash
npm run build
```

---

## 📊 TẠI SAO DÙNG GOOGLE DRIVE OCR?

| Tiêu chí | OCR.space API | Google Drive OCR |
|----------|---------------|------------------|
| **Giá** | Free | Free |
| **Giới hạn file** | 1 MB ❌ | Không giới hạn ✅ |
| **Chất lượng** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Tốc độ** | Nhanh | Trung bình |
| **Tiếng Việt** | Tốt | Rất tốt |
| **Cài đặt** | Không cần | Không cần |
| **Đáng tin cậy** | 70% | 95% |

**Kết luận:** Google Drive OCR là lựa chọn tốt nhất cho files lớn (1MB+)

---

## 🔥 LỜI KHUYÊN QUAN TRỌNG

### 1. Kiểm tra độ chính xác
Văn bản pháp luật KHÔNG được sai. Sau khi OCR:
- So sánh ngẫu nhiên 5-10 đoạn với PDF gốc
- Đặc biệt chú ý: Số điều, khoản, ngày tháng, số tiền, tên riêng
- Sửa lỗi OCR nếu phát hiện

### 2. Các lỗi OCR thường gặp với tiếng Việt:
- `o` ↔ `ô` ↔ `ơ`
- `u` ↔ `ư` ↔ `ừ`
- `d` ↔ `đ`
- `a` ↔ `ă` ↔ `â`
- Số `0` (zero) ↔ chữ `O`
- Số `1` (one) ↔ chữ `l` (L thường)

### 3. Format lại văn bản (optional)
Nếu muốn cải thiện chất lượng text:
```bash
# Xóa dòng trống thừa
sed -i '/^$/d' data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt

# Thêm line numbers
cat -n data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt > temp.txt && mv temp.txt data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt
```

---

## 🎯 TIMELINE THỰC HIỆN

| Công việc | Thời gian |
|-----------|-----------|
| Upload file 1 (1.4MB) | 30 giây |
| OCR file 1 (29 trang) | 2-3 phút |
| Download và copy file 1 | 30 giây |
| Upload file 2 (3.6MB) | 1 phút |
| OCR file 2 (88 trang) | 5-7 phút |
| Download và copy file 2 | 30 giây |
| **TỔNG CỘNG** | **~10-12 phút** |

---

## 🆘 NẾU GẶP VẤN ĐỀ

### Lỗi: "Google Docs không mở được PDF"
- **Nguyên nhân:** File PDF bị lỗi
- **Giải pháp:** Download lại file PDF từ nguồn gốc

### Lỗi: "OCR sai nhiều chữ"
- **Nguyên nhân:** PDF scan chất lượng thấp
- **Giải pháp:**
  1. Thử Adobe Acrobat Online: https://www.adobe.com/acrobat/online/pdf-to-text.html
  2. Hoặc nhập thủ công các phần quan trọng

### Lỗi: "Không copy được file vào project"
- **Nguyên nhân:** Đường dẫn không đúng
- **Giải pháp:**
```bash
# Tìm file trong Downloads
find ~/Downloads -name "*.txt" -mtime -1

# Copy bằng đường dẫn tuyệt đối
cp /path/to/downloaded/file.txt /tmp/cc-agent/63357473/project/data/legal-documents/extracted-text/
```

---

## 📞 LIÊN HỆ & HỖ TRỢ

**Tài liệu liên quan:**
- `OCR_SOLUTION_GUIDE.md` - Hướng dẫn chi tiết các giải pháp OCR
- `EXTRACTION_STATUS.md` - Trạng thái trích xuất hiện tại
- `BACKEND_RAG_IMPLEMENTATION.md` - Chi tiết kỹ thuật hệ thống RAG

**Scripts:**
- `npm run extract-pdfs` - Trích xuất PDF thường (có text layer)
- `npm run ocr-scanned-pdfs` - OCR cho PDF scan (không hoạt động với files > 1MB)
- `npm run ingest-legal-docs` - Nạp dữ liệu vào RAG database

---

## 🎉 SAU KHI HOÀN THÀNH

Khi đã có đầy đủ 4 files text (100% extraction):

1. ✅ Hệ thống RAG sẽ có đầy đủ kiến thức pháp luật
2. ✅ AI chatbot có thể trả lời chính xác các câu hỏi về hóa chất
3. ✅ Citations sẽ trích dẫn đúng điều, khoản từ văn bản gốc
4. ✅ Website sẵn sàng deploy production

**LÊN ĐƯỜNG NÀO! 🚀**
