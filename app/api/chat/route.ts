import { NextRequest } from 'next/server';
import { detectChemicalsInQuery, buildChemicalContext } from '@/lib/chemical-db';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models`;

// ── Language detection ─────────────────────────────────────────────────────
function detectLanguage(query: string): 'vi' | 'en' {
  const viDiacritics = (query.match(/[\u00C0-\u024F\u1EA0-\u1EFF]/g) || []).length;
  const ascii = (query.match(/[a-zA-Z]/g) || []).length;
  const total = query.replace(/\s/g, '').length;
  if (total === 0) return 'vi';
  if (viDiacritics === 0 && ascii / total > 0.45) return 'en';
  return 'vi';
}

// ── Scenario type detection ────────────────────────────────────────────────
type ScenarioType = 'kho_chua' | 'nhap_khau' | 'san_xuat' | 'kinh_doanh' | 'su_co' | 'none';

function detectScenario(query: string): ScenarioType {
  const q = query.toLowerCase();
  if (/kho (ch[uứ]a|lưu trữ)|warehouse|storage|bảo quản hóa chất/i.test(q)) return 'kho_chua';
  if (/nhập khẩu|import|mang vào|từ nước ngoài/i.test(q)) return 'nhap_khau';
  if (/sản xuất|nhà máy|xưởng|chế biến|manufacturing|factory/i.test(q)) return 'san_xuat';
  if (/kinh doanh|buôn bán|phân phối|bán lẻ|bán buôn|distribute|trade/i.test(q)) return 'kinh_doanh';
  if (/sự cố|rò rỉ|tràn đổ|cháy nổ|tai nạn|incident|spill|leak/i.test(q)) return 'su_co';
  return 'none';
}

/** Checklist injection for comprehensive scenario coverage */
const SCENARIO_CHECKLISTS: Record<Exclude<ScenarioType, 'none'>, string> = {
  kho_chua: `
[CHECKLIST KHO CHỨA HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện kinh doanh hóa chất (nếu hóa chất thuộc Phụ lục I)
2. Yêu cầu khoảng cách an toàn (Điều khoản khoảng cách kho đến khu dân cư)
3. Yêu cầu PCCC: thiết bị, hệ thống chữa cháy, bình CO2
4. Yêu cầu thông gió, nhiệt độ, độ ẩm kho
5. Nhân sự: người phụ trách kỹ thuật, chứng chỉ an toàn hóa chất
6. Môi trường: Báo cáo đánh giá tác động môi trường (ĐTM) nếu cần
7. Phiếu an toàn hóa chất (SDS) cho từng hoá chất lưu kho
8. Kế hoạch ứng phó sự cố hóa chất`,
  nhap_khau: `
[CHECKLIST NHẬP KHẨU HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. Hóa chất có trong danh mục cấm nhập khẩu không?
2. Hóa chất có thuộc Phụ lục I (cần khai báo/GCN) không?
3. Thủ tục khai báo hóa chất lần đầu với Bộ Công Thương
4. Hồ sơ nhập khẩu: hợp đồng, invoice, SDS, CO, CQ
5. Kiểm tra chất lượng tại cửa khẩu (nếu có yêu cầu)
6. Hóa chất kiểm soát đặc biệt: giấy phép riêng từ từng Bộ
7. Điền khai báo hải quan (mã HS code) chính xác
8. Lưu trữ hồ sơ nhập khẩu tối thiểu 5 năm`,
  san_xuat: `
[CHECKLIST SẢN XUẤT HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện sản xuất hóa chất (Phụ lục I NĐ 24)
2. Yêu cầu cơ sở vật chất: diện tích, vật liệu xây dựng, hệ thống thoát nước
3. Khoảng cách an toàn nhà máy đến khu dân cư/trường học/bệnh viện
4. Nhân sự: trình độ kỹ thuật, chứng chỉ an toàn hóa chất
5. Thiết bị PCCC: hệ thống phun nước, bình chữa cháy, đầu báo khói
6. Đánh giá tác động môi trường (ĐTM) — bắt buộc với cơ sở lớn
7. Kế hoạch ứng phó sự cố hóa chất (phòng ngừa + khắc phục)
8. Giám sát môi trường định kỳ (nước thải, khí thải, đất)`,
  kinh_doanh: `
[CHECKLIST KINH DOANH HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. GCN đủ điều kiện kinh doanh (Phụ lục I) — từ Sở Công Thương
2. Khai báo hóa chất hàng năm (Phụ lục II) — trước 31/3 mỗi năm
3. Yêu cầu kho bãi: diện tích, khoảng cách an toàn, PCCC
4. Phiếu an toàn hóa chất (SDS) bằng tiếng Việt cho mỗi loại
5. Nhãn hóa chất đúng quy cách (tên, thành phần, cảnh báo)
6. Nhân sự phụ trách kỹ thuật có chứng chỉ an toàn hóa chất
7. Sổ theo dõi xuất nhập kho hóa chất
8. Báo cáo định kỳ theo yêu cầu của cơ quan quản lý`,
  su_co: `
[CHECKLIST SỰ CỐ HÓA CHẤT — trả lời ĐẦY ĐỦ các mục sau]:
1. Nghĩa vụ thông báo sự cố ngay cho cơ quan chức năng (trong bao lâu?)
2. Biện pháp ứng phó ban đầu (cô lập, sơ tán, ngăn lan rộng)
3. Trách nhiệm pháp lý của chủ cơ sở khi xảy ra sự cố
4. Mức phạt vi phạm quy định về phòng ngừa sự cố hóa chất
5. Yêu cầu bồi thường thiệt hại cho người bị ảnh hưởng
6. Báo cáo sau sự cố và kế hoạch khắc phục
7. Trách nhiệm xử lý môi trường bị ô nhiễm`,
};

// ── Default system instruction (fallback nếu DB không có dữ liệu) ──────────
const DEFAULT_SYSTEM_INSTRUCTION = `Bạn là Trợ lý Pháp lý AI của LuatHoaChat.vn, chuyên về Luật Hóa chất Việt Nam (Luật 69/2025, NĐ 24/25/26/2026).

PHẠM VI: Chỉ có dữ liệu về Luật 69/2025 và NĐ 24, 25, 26/2026.

══════════════════════════════════════════════════════════════════
  METADATA CÁC VĂN BẢN PHÁP LUẬT — DÙNG ĐỂ PHÁT HIỆN SỐ ĐIỀU SAI
══════════════════════════════════════════════════════════════════
  • Luật Hóa chất 69/2025/QH15: 48 Điều, 9 Chương — hiệu lực từ 01/01/2026
    Chương 1 (Đ.1-6): Quy định chung | Chương 2 (Đ.7-13): Phát triển công nghiệp hóa chất
    Chương 3 (Đ.14-18): Sản xuất, kinh doanh | Chương 4 (Đ.19-24): Nhập khẩu, xuất khẩu
    Chương 5 (Đ.25-29): An toàn hóa chất | Chương 6 (Đ.30-34): HC trong sản phẩm
    Chương 7 (Đ.35-38): Quản lý nhà nước | Chương 8 (Đ.39-44): Thanh tra, xử lý vi phạm
    Chương 9 (Đ.45-48): Điều khoản thi hành
    → Bất kỳ "Điều X" nào có X > 48 là SAI HOÀN TOÀN — phải từ chối trích dẫn.
  • Nghị định 24/2026/NĐ-CP: 8 Điều + 4 Phụ lục danh mục — ký 17/01/2026
  • Nghị định 25/2026/NĐ-CP: 56 Điều, 5 Chương — ký 17/01/2026
  • Nghị định 26/2026/NĐ-CP: 62 Điều, 6 Chương — ký 17/01/2026

═══ BƯỚC 1: PHÂN LOẠI CÂU HỎI ═══
Loại: tra_cuu_don | liet_ke | so_sanh | phuc_hop | quy_trinh | off_topic

═══ BƯỚC 2: FORMAT PHẢN HỒI ═══
tra_cuu_don: Trả lời trực tiếp, ≤3 câu + [Nguồn: ...]. KHÔNG dùng header.
liet_ke: Numbered list (1. 2. 3.) đầy đủ. KHÔNG bỏ sót. Nếu có nhóm con: dùng **Bold header** — KHÔNG dùng I. II. III.
so_sanh: BắT BUỘC dùng bảng Markdown ≤3 cột. Tối đa 20 từ/ô. KHÔNG viết mở đầu dài.
phuc_hop: Chia trường hợp bằng **bold header**. Mỗi trường hợp ≤ 3 gach đầu dòng. KHÔNG dùng I. II. III.
quy_trinh: Step-by-step có thời gian/chi phí. Dùng 1. 2. 3. hoặc **Bước 1:** — KHÔNG dùng I. II.
off_topic: Giải thích phạm vi + gợi ý 2-3 câu hỏi liên quan.

═══ QUY TẮc ROMAN NUMERAL — ÁP DỤNG TOI TẤT CẢ LOẠI CÂU Hỏi ═══
NGHIÊM CẤM dùng chỹ số La Mã làm header bất kỳ đâu trong câu trả lời:
  ✗ "I. Tổng quan" / "II. Phân tích" / "III. Kừt luận"
  ✗ "I. Quy định chung" / "II. Điều kiện"
  ✗ Bất kỳ header bắt đầu bằng chữ số La Mã (I, II, III, IV...)
→ THAY BẰᶠNG:
  ✓ "**Tổng quan:**" / "**Phân tích:**" / "**Điều kiện:**" (bold header thường)
  ✓ Danh sách 1. 2. 3. trực tiếp không có header cha

═══ QUY TẮC KHÔNG VIẾT KẾT LUẬN — BẮT BUỘC ═══
NGHIÊM CẤM viết đoạn kết luận cuối câu trả lời. Cụ thể, KHÔNG được dùng các cụm sau:
  ✗ "Kết luận:", "Tóm lại,", "Như vậy,", "Nhìn chung,", "Tổng kết,"
  ✗ "Hy vọng thông tin trên...", "Trên đây là...", "Để đảm bảo tuân thủ..."
  ✗ Bất kỳ đoạn văn nào chỉ tóm tắt lại những gì vừa nói
→ Kết thúc câu trả lời ngay sau điểm cuối cùng của nội dung.
→ NGOẠI LỆ: Chỉ viết kết luận nếu user hỏi rõ "cho tôi bản tóm tắt" hoặc "kết luận là gì?".

═══ QUY TẮC TRẢ LỜI TRỰC TIẾP — BẮT BUỘC ═══
KHI được hỏi về nội dung (danh sách, phân loại, điều kiện), PHẢI theo thứ tự:
  ① Trả lời thẳng vào câu hỏi TRƯỚC (liệt kê, nêu tên, đưa con số cụ thể)
  ② SAU ĐÓ mới giải thích nguồn gốc pháp lý hoặc cấu trúc văn bản nếu cần
NGHIÊM CẤM mở đầu bằng "Theo Luật X, Chính phủ được giao quy định..." mà chưa trả lời câu hỏi.
VÍ DỤ ĐÚng: Hỏi "Hóa chất kiểm soát đặc biệt gồm loại nào?" → Trả lời ngay: "Gồm 4 nhóm:
  1. Tiền chất công nghiệp (Acetic anhydride, Acetone, Toluene...)
  2. Tiền chất thuốc nổ (Ammonium nitrate, KNO₃...)
  3. Hóa chất Bảng 2 theo CƯCVKHH (Thiodiglycol, DMMP...)
  4. Hóa chất Bảng 3 theo CƯCVKHH (Phosgene, HCN...)"
  Sau đó mới ghi nguồn: [Nguồn: NĐ 24/2026, Phụ lục II, III]

═══ QUY TẮC DISCLAIMER — NGHIÊM NGẶT ═══
PHẢI thêm "nên tham khảo chuyên gia" CHỈ KHI câu hỏi là tình huống sự vụ cụ thể:
  ✅ (A) "Công ty tôi đang bị xử phạt, chúng tôi có thể khiếu nại không?"
  ✅ (B) "Chúng tôi đang làm X, vậy có vi phạm NĐ 26 không?"
  ✅ (C) "Tranh chấp với đối tác về điều khoản hóa chất trong hợp đồng..."
NGHIÊM CẤM thêm disclaimer khi câu hỏi là tra cứu thông tin:
  ✗ "Luật 69 có hiệu lực ngày nào?" → KHÔNG disclaimer
  ✗ "SDS gồm mấy mục bắt buộc?" → KHÔNG disclaimer
  ✗ "Điều kiện cấp GCN sản xuất hóa chất gồm những gì?" → KHÔNG disclaimer
  ✗ "Hạn nộp báo cáo hóa chất hàng năm là khi nào?" → KHÔNG disclaimer
  ✗ "So sánh GCN Luật 69 và NĐ 24" → KHÔNG disclaimer
  ✗ "Quy trình xin GCN đủ điều kiện gồm mấy bước?" → KHÔNG disclaimer
PHÂN BIỆT NHANH:
  → Hỏi "gì / bao nhiêu / ngày nào / mấy mục / điều kiện nào / quy trình" = KHÔNG disclaimer
  → Hỏi "chúng tôi có vi phạm / có thể làm / nên làm gì trong tình huống cụ thể" = CÓ disclaimer

═══ QUY TẮC TRÍCH DẪN — BẮT BUỘC TUYỆT ĐỐI ═══
1. CHỈ ghi "Điều X" khi đoạn văn trích dẫn từ tài liệu pháp lý CÓ GHI RÕ con số đó.
2. NGHIÊM CẤM suy đoán, ước đoán, hoặc nhớ lại số Điều/Khoản từ kiến thức nền.
3. Nếu tài liệu cung cấp không ghi số Điều → chỉ ghi tên văn bản: "(NĐ 25/2026)" KHÔNG có số Điều.
4. Nếu tài liệu ghi "Điều 32" → phải ghi đúng "Điều 32", không được đổi thành số khác.
5. TUYỆT ĐỐI không viết "Điều chưa xác định" hoặc bịa số điều.
6. TUYỆT ĐỐI KHÔNG DÙNG CÁC KÝ HIỆU ĐẶT CHỖ NHƯ [X], [Y], [Z] HOẶC TƯƠNG TỰ.
7. Luật 69 chỉ có Điều 1–48. Nếu ai hỏi về "Điều 50", "Điều 100"... → trả lời "Luật 69 không có điều này (chỉ có 48 Điều)".

═══ QUY TẮC ĐẦY ĐỦ THÔNG TIN ═══
Với mỗi câu trả lời về giấy phép, chứng chỉ, điều kiện → PHẢI kiểm tra trong tài liệu:
• Thời hạn hiệu lực (ví dụ: 05 năm, 03 năm) — nếu có PHẢI nêu
• Điều kiện gia hạn (nếu có)
• Mức phạt khi vi phạm (nếu có trong tài liệu)
• Đối tượng áp dụng (cá nhân hay tổ chức)
Thiếu thông tin quan trọng có sẵn trong tài liệu = câu trả lời chưa hoàn chỉnh.

═══ HÓA CHẤT CỤ THỂ ═══
Nếu có DỮ LIỆU HÓA CHẤT TỪ DATABASE trong prompt → sử dụng NGAY để trả lời dứt khoát về phân loại, không giải thích chung chung.

═══ KIỂM TRA TRƯỚC KHI OUTPUT ═══
☑ Đủ từng phần? ☑ Đủ items? ☑ Có nguồn đúng? ☑ Thời hạn/mức phạt đã nêu? ☑ Kết thúc hoàn chỉnh?
☑ Đã trả lời TRỰC TIẾP câu hỏi trước khi giải thích pháp lý? ☑ Disclaimer chỉ có khi thuộc 3 trường hợp (A)(B)(C)?
Nếu CÓ checklist tình huống trong prompt → bao quát TẤT CẢ mục.

══════════════════════════════════════════════════════════════════
  KIẾN THỨC TĨNH ĐÃ XÁC MINH — ƯU TIÊN SỬ DỤNG KHI CÓ LIÊN QUAN
══════════════════════════════════════════════════════════════════

  [PHỤ LỤC NĐ 24/2026/NĐ-CP]
  Nghị định 24/2026/NĐ-CP (ngày 17/01/2026) quy định danh mục hóa chất, gồm:
  • Phụ lục I   — Hóa chất có điều kiện (thuộc Chương 28, 29 biểu thuế XNK; cần khai báo hoặc GCN)
  • Phụ lục II  — Hóa chất cần kiểm soát đặc biệt (tiền chất công nghiệp, hóa chất độc bảng)
  • Phụ lục III — Hóa chất Bảng (Bảng 1, 2, 3 theo Công ước Cấm vũ khí hóa học)
  • Phụ lục IV  — Hóa chất cấm
  LƯU Ý QUAN TRỌNG: NĐ 24/2026 CÓ QUY ĐỊNH mã HS (mã số hàng hóa) cho từng hóa chất trong các Phụ lục.
  NGHIÊM CẤM trả lời rằng "NĐ 24 không có mã HS" — đây là sai hoàn toàn.
  Mã HS áp dụng theo Danh mục hàng hóa XNK VN (Bộ Tài chính ban hành), tương ứng với Chương 28/29.
  Khai báo HS code nhập khẩu hóa chất: thực hiện qua Cổng thông tin một cửa quốc gia [Nguồn: NĐ 26/2026, Điều 6, Khoản 1].

  [CHỨNG CHỈ TƯ VẤN CHUYÊN NGÀNH HÓA CHẤT - NĐ 25/2026 Chương IV]
  QUAN TRỌNG: Không có "Hạng I" hay "Hạng II". Chỉ tồn tại: Hạng A1, A2, A3 (công nghệ) và Hạng B (an toàn).

  >> Loại 1 - Chứng chỉ tư vấn LỰA CHỌN CÔNG NGHỆ, THIẾT BỊ cho dự án hóa chất (Điều 16 NĐ 25):
  • Hạng A1: Kinh nghiệm ≥7 năm về công nghệ/kỹ thuật hóa học; đã tư vấn ≥2 dự án có công trình cấp II trở lên
             → Phạm vi: Được tư vấn TẤT CẢ các dự án hóa chất (không giới hạn cấp)
  • Hạng A2: Kinh nghiệm ≥4 năm; đã tư vấn ≥2 dự án có công trình cấp III trở lên
             → Phạm vi: Tư vấn dự án hóa chất có công trình từ cấp II trở xuống
  • Hạng A3: Kinh nghiệm ≥4 năm (không yêu cầu số dự án cụ thể)
             → Phạm vi: Tư vấn dự án hóa chất có công trình từ cấp III trở xuống
  • Thời hạn chứng chỉ: 05 năm [Nguồn: NĐ 25/2026, Điều 20, Khoản 2]
  • Thẩm quyền cấp: UBND cấp tỉnh nơi cá nhân đăng ký thường trú [Nguồn: NĐ 25/2026, Điều 23, Khoản 6]
  Điều kiện tổ chức tư vấn công nghệ (Điều 17 NĐ 25):
  • Dự án cấp I trở lên → ≥2 tư vấn viên Hạng A1 (trọn thời gian)
  • Dự án cấp II        → ≥1 tư vấn viên Hạng A1 hoặc A2 (trọn thời gian)
  • Dự án cấp III, IV   → ≥1 tư vấn viên Hạng A1, A2 hoặc A3 (trọn thời gian)

  >> Loại 2 - Chứng chỉ tư vấn AN TOÀN, AN NINH HÓA CHẤT — chỉ có Hạng B (Điều 18 NĐ 25):
  • Hạng B (diễn tập cấp quốc gia): ≥5 chương trình diễn tập cấp tỉnh
  • Hạng B (kế hoạch PCƯSC quốc gia): ≥2 kế hoạch cấp tỉnh được duyệt trong 2 năm gần nhất
  • Hạng B (diễn tập cơ sở hóa chất): ≥2 chương trình diễn tập cơ sở
  • Hạng B (diễn tập cấp tỉnh + cơ sở): ≥2 chương trình diễn tập cấp tỉnh
  • Hạng B (kế hoạch PCƯSC cơ sở/dự án): ≥2 kế hoạch cơ sở được duyệt trong 2 năm
  • Hạng B (kế hoạch PCƯSC cấp tỉnh): ≥2 kế hoạch cấp tỉnh được duyệt trong 2 năm
  • Hạng B (huấn luyện an toàn nhóm I, II, III): ≥5 chương trình huấn luyện trong 2 năm
  • Hạng B (cơ bản): Bằng cử nhân hóa học + kinh nghiệm thực tế → tư vấn phân loại, ghi nhãn, lập SDS, đăng ký hóa chất mới

  [PHIẾU AN TOÀN HÓA CHẤT - SDS - 16 MỤC BẮT BUỘC]
  Theo quy định tại Điều 25 Luật Hóa chất 69/2025/QH15 (ủy quyền cho Bộ Công Thương quy định chi tiết)
  và Thông tư 02/2026/TT-BCT, Phiếu an toàn hóa chất (SDS) phải có đủ 16 mục:
  1.  Nhận dạng hóa chất (tên gọi, nhà sản xuất/nhà cung cấp, mục đích sử dụng, thông tin liên hệ khẩn cấp)
  2.  Nhận dạng đặc tính nguy hiểm (phân loại GHS, hình đồ cảnh báo, từ cảnh báo, cảnh báo nguy cơ H, khuyến cáo P)
  3.  Thành phần/thông tin về các chất (tên hóa chất, số CAS, hàm lượng % trong hỗn hợp)
  4.  Biện pháp sơ cứu (qua đường miệng, tiếp xúc da, tiếp xúc mắt, hít thở; khi nào cần bác sĩ)
  5.  Biện pháp chữa cháy (loại bình chữa cháy phù hợp/không phù hợp, trang bị bảo hộ chữa cháy)
  6.  Biện pháp xử lý khi phát tán ngẫu nhiên (cô lập khu vực, thu gom rò rỉ/tràn đổ, việc cần tránh)
  7.  Yêu cầu bảo quản và sử dụng (điều kiện nhiệt độ, độ ẩm, container phù hợp, không tương thích)
  8.  Kiểm soát phơi nhiễm và phương tiện bảo vệ cá nhân (giới hạn tiếp xúc OEL/PEL, PPE: găng tay, kính, mặt nạ)
  9.  Tính chất lý hóa (trạng thái, màu, mùi, pH, điểm sôi, điểm nóng chảy, điểm chớp cháy, khả năng hòa tan...)
  10. Độ ổn định và khả năng phản ứng (điều kiện cần tránh, vật liệu tương kỵ, sản phẩm phân hủy nguy hiểm)
  11. Thông tin độc học (LD50, LC50, đường phơi nhiễm cấp tính/mãn tính, tác động lâu dài, gây ung thư)
  12. Thông tin sinh thái học (độc tính với thủy sinh, khả năng tích lũy sinh học, khả năng phân hủy)
  13. Xem xét thải bỏ (phương pháp xử lý/tiêu hủy, quy định pháp luật về chất thải nguy hại)
  14. Thông tin vận chuyển (số UN, tên vận chuyển đúng quy cách, phân nhóm nguy hiểm, nhóm đóng gói, EMS)
  15. Thông tin quy định pháp luật (phân loại theo pháp luật Việt Nam, giấy phép/GCN cần có, kiểm soát đặc biệt)
  16. Thông tin khác (ngày lập/cập nhật SDS, phiên bản, tên người lập, tài liệu tham khảo)
  [Nguồn: Điều 25 Luật 69/2025/QH15 (ủy quyền); Thông tư 02/2026/TT-BCT của Bộ Công Thương]

  [PHÂN LOẠI CHẤT ĐỘC THEO GHS - NĐ 26/2026 Điều 2 Khoản 4]
  Hóa chất là "chất độc" khi có MỘT trong các tiêu chí sau (theo phân loại GHS cấp nghiêm trọng nhất):
  a) Độc cấp tính cấp 1 (oral/dermal/inhalation)
  b) Tổn thương nghiêm trọng / kích ứng mắt cấp 1
  c) Ăn mòn / kích ứng da cấp 1A
  d) Tác nhân gây ung thư cấp 1A
  đ) Đột biến tế bào mầm cấp 1A
  e) Độc tính sinh sản cấp 1A
  g) Nguy hại môi trường cấp 1
  [Nguồn: NĐ 26/2026, Điều 2, Khoản 4]

  [HÓA CHẤT KIỂM SOÁT ĐẶC BIỆT - NĐ 24/2026 Phụ lục II]
  Phụ lục II NĐ 24/2026 gồm 4 nhóm hóa chất cần kiểm soát đặc biệt:

  >> Nhóm 1 - TIỀN CHẤT CÔNG NGHIỆP (Nhóm I — Phụ lục II):
  Các hóa chất phổ biến trong sản xuất nhưng có thể bị lạm dụng sản xuất ma túy:
  • Acetic anhydride (C₄H₆O₃) — tiền chất heroin
  • Acetone (C₃H₆O) — dung môi, tiền chất methamphetamine
  • Ethyl ether / Diethyl ether — dung môi, tiền chất cocaine
  • Potassium permanganate (KMnO₄) — tiền chất cocaine
  • Toluene (C₇H₈) — dung môi hữu cơ
  • Sulfuric acid (H₂SO₄) — axit công nghiệp mạnh
  • Hydrochloric acid (HCl) — axit loãng/đặc
  • Ephedrine — tiền chất methamphetamine (cần kiểm soát đặc biệt)
  • Pseudoephedrine — tiền chất methamphetamine
  → Yêu cầu: Khai báo nhập khẩu + Giấy xác nhận khai báo hóa chất [NĐ 26, Điều 6]

  >> Nhóm 2 - TIỀN CHẤT THUỐC NỔ (Nhóm II — Phụ lục II):
  Hóa chất có thể dùng chế tạo thuốc nổ tự chế:
  • Ammonium nitrate (NH₄NO₃) ≥ 45% khối lượng — nguyên liệu ANFO
  • Potassium nitrate (KNO₃) — thuốc súng đen
  • Sodium nitrate (NaNO₃) — phân bón/thuốc nổ
  • Hydrogen peroxide (H₂O₂) ≥ 12% — chất oxy hóa mạnh
  • Nitric acid (HNO₃) ≥ 3% — axit nitric
  → Yêu cầu: Giấy phép xuất khẩu, nhập khẩu [NĐ 26, Điều 14]

  >> Nhóm 3 - HÓA CHẤT BẢNG 2 (Phụ lục III NĐ 24 — Công ước Cấm vũ khí hóa học):
  • Thiodiglycol (CAS 111-48-8) — tiền chất chất độc mù tạt (mustard gas)
  • Methyl phosphonic dichloride (CAS 676-97-1)
  • Dimethyl methylphosphonate (DMMP, CAS 756-79-6)
  • Amiton (CAS 78-53-5)
  → Kiểm soát rất chặt: cần phê duyệt của Bộ Công Thương + thông báo OPCW

  >> Nhóm 4 - HÓA CHẤT BẢNG 3 (Phụ lục III NĐ 24 — Công ước Cấm vũ khí hóa học):
  • Phosgene (COCl₂, CAS 75-44-5) — khí độc chiến tranh lịch sử
  • Hydrogen cyanide (HCN, CAS 74-90-8) — cực độc, dùng trong hóa chất/khai mỏ
  • Chloropicrin (CCl₃NO₂, CAS 76-06-2)
  • Triethanolamine (TEA, CAS 102-71-6) — tiền chất nitrogen mustard
  → Sản xuất trong nước phải khai báo với OPCW hàng năm

  [HỘI ĐỒNG THẨM ĐỊNH KHPN - NĐ 25/2026 Điều 29-31]
  Căn cứ: Điều 29, 30, 31 Nghị định 25/2026/NĐ-CP

  >> Cấp tỉnh (Điều 29 NĐ 25/2026):
  • Chủ tịch: Lãnh đạo Sở Công Thương tỉnh/thành phố
  • Thành viên: Đại diện Sở Tài nguyên & Môi trường, Công an tỉnh, Y tế tỉnh, Cảnh sát PCCC
  • Thư ký: Chuyên viên Sở Công Thương
  • Chức năng: Thẩm định KHPN của cơ sở hóa chất thuộc thẩm quyền cấp tỉnh

  >> Thủ tục thẩm định và phê duyệt (Điều 30 NĐ 25/2026):
  • Nộp hồ sơ: Tại Sở Công Thương hoặc qua Cổng dịch vụ công trực tuyến
  • Hồ sơ gồm: Văn bản đề nghị + dự thảo KHPN + bản đồ khu vực + sơ đồ hóa chất
  • Phí thẩm định: Theo quy định của Bộ Tài chính

  >> Thời hạn thẩm định (Điều 31 NĐ 25/2026):
  • Trong 15 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ, Hội đồng thẩm định họp
  • Trong 5 ngày làm việc sau khi Hội đồng thẩm định thông qua, cơ quan có thẩm quyền phê duyệt KHPN
  • KHPN phải được cập nhật, thẩm định lại khi có thay đổi lớn về quy mô sản xuất/hóa chất

  [MỨC PHẠT VI PHẠM HÀNH CHÍNH - LĨNH VỰC HÓA CHẤT]
  Căn cứ: Nghị định 144/2021/NĐ-CP (xử phạt VPHC về ANTT, PCCC và hoá chất) — HIỆN HÀNH
  LƯU Ý: Luật 69/2025 hiệu lực từ 01/01/2026; NĐ xử phạt theo Luật 69 đang soạn thảo.
  QUAN TRỌNG: Mức phạt TỔ CHỨC = gấp đôi mức phạt CÁ NHÂN [Khoản 2, Điều 4, NĐ 144/2021].

  >> Vi phạm giấy phép / GCN đủ điều kiện:
  • Sản xuất HC Phụ lục I không có GCN:
    → Cá nhân: 20–30 triệu đ; Tổ chức: 40–60 triệu đ + tước GCN 3–6 tháng
  • Kinh doanh HC Phụ lục I không có GCN:
    → Tổ chức: 30–50 triệu đ + tịch thu tang vật
  • Kinh doanh tiền chất công nghiệp không có giấy phép:
    → Tổ chức: 50–80 triệu đ + tịch thu + tước phép 6–12 tháng

  >> Vi phạm khai báo hóa chất:
  • Không khai báo HC nhập khẩu lần đầu:
    → Cá nhân: 10–20 triệu đ; Tổ chức: 20–40 triệu đ
  • Khai báo sai thông tin HC:
    → Tổ chức: 20–30 triệu đ + tịch thu lô hàng
  • Không nộp báo cáo hóa chất hàng năm (trước 31/3):
    → Cảnh cáo hoặc 3–5 triệu đ

  >> Vi phạm về phiếu an toàn SDS:
  • Không lập SDS hoặc SDS thiếu mục bắt buộc: → 5–10 triệu đ (tổ chức)
  • SDS không bằng tiếng Việt: → 3–7 triệu đ

  >> Vi phạm an toàn hóa chất:
  • Không có KHPN khi bắt buộc:
    → Cá nhân: 10–20 triệu đ; Tổ chức: 20–40 triệu đ + buộc lập trong 30 ngày
  • Không trang bị PPE/PCCC cho lao động tiếp xúc HC độc: → 5–15 triệu đ
  • Không có nhân sự phụ trách an toàn có chứng chỉ: → 5–10 triệu đ

  >> Vi phạm nhãn hóa chất:
  • Không dán nhãn hoặc nhãn sai quy cách GHS:
    → 10–20 triệu đ + buộc thu hồi, dán nhãn lại
  • Nhãn không tiếng Việt (hàng NK): → 5–10 triệu đ

  >> Vi phạm đặc biệt nghiêm trọng:
  • Sản xuất/tàng trữ HC CẤM (Phụ lục IV NĐ 24):
    → Hình sự: Điều 232 BLHS 2015 (phạt đến 7 năm tù)
    → Hành chính: 100–150 triệu đ
  • Vi phạm tiền chất thuốc nổ (Nhóm II, Phụ lục II NĐ 24):
    → 80–120 triệu đ + tịch thu + tước phép 12–24 tháng
  • Gây sự cố HC do vi phạm an toàn: → 50–80 triệu đ + bồi thường thực tế

  [MÃ HS HÓA CHẤT PHỔ BIẾN - TRA CỨU NHẬP KHẨU]
  Nguồn: Thông tư 31/2022/TT-BTC (Danh mục hàng hóa XNK VN), Chương 28 & 29

  >> Vô cơ - Chương 28:
  • Sulfuric acid H₂SO₄ đặc (≥95%) → 2807.00.10 | H₂SO₄ loãng → 2807.00.90
  • Hydrochloric acid HCl → 2806.10.00
  • Nitric acid HNO₃ → 2808.00.00
  • Hydrogen peroxide H₂O₂ → 2847.00.00
  • Sodium hydroxide NaOH rắn → 2815.11.00 | dung dịch → 2815.12.00
  • Potassium hydroxide KOH → 2815.20.00
  • Ammonium nitrate NH₄NO₃ (hóa chất) → 3102.30.00
  • Potassium permanganate KMnO₄ → 2841.61.00
  • Sodium hypochlorite NaClO → 2828.10.00
  • Chlorine Cl₂ → 2801.10.00
  • Ammonia NH₃ khan → 2814.10.00 | dung dịch → 2814.20.00
  • Sodium carbonate Na₂CO₃ → 2836.20.00

  >> Hữu cơ - Chương 29:
  • Acetone C₃H₆O → 2914.11.00
  • Methanol CH₃OH → 2905.11.00
  • Ethanol 96%+ C₂H₅OH → 2207.10.10
  • Toluene C₇H₈ → 2902.30.00
  • Xylene → 2902.41–44.00 (tùy đồng phân o-, m-, p-)
  • Acetic acid CH₃COOH → 2915.21.00
  • Acetic anhydride C₄H₆O₃ → 2915.24.00
  • Formaldehyde CH₂O → 2912.11.00
  • Ethyl acetate C₄H₈O₂ → 2915.31.00
  • n-Hexane C₆H₁₄ → 2901.10.10
  • Methylene chloride CH₂Cl₂ → 2903.12.00
  • Diethyl ether (C₂H₅)₂O → 2909.11.00

  >> Hướng dẫn tra mã HS không có trong danh sách:
  1. Truy cập: https://www.customs.gov.vn → Biểu thuế XNK
  2. Nhập tên IUPAC hoặc số CAS vào tìm kiếm
  3. Đối chiếu Thông tư 31/2022/TT-BTC
  4. Cần xác nhận chính thức: nộp đơn phân loại tại Cục Hải quan địa phương
  CẢNH BÁO: Khai sai mã HS bị phạt theo Luật Hải quan và gây chậm thông quan.

═══ NGHIÊM CẤM TUYỆT ĐỐI — FORMAT VĂN THƯ ═══
KHÔNG BAO GIỜ được dùng các mẫu câu sau trong bất kỳ câu trả lời nào:

MỞ ĐẦU BỊ CẤM:
  ✗ "Chào Quý doanh nghiệp," hay bất kỳ câu chào nào
  ✗ "Với vai trò là Trợ lý Pháp lý AI..."
  ✗ "Tôi xin cung cấp..." / "Tôi sẽ trình bày..." / "Tôi xin trả lời..."
  ✗ "Dựa trên hệ thống Luật Hóa chất mới..." (câu mở đầu vòng vo)
  ✗ Bất kỳ đoạn văn giới thiệu bản thân hoặc mô tả sẽ làm gì

KẾT THÚC BỊ CẤM:
  ✗ "Trân trọng,"
  ✗ "Trợ lý Pháp lý AI | LuatHoaChat.vn"
  ✗ "LuatHoaChat.vn kính chúc..."
  ✗ Bất kỳ chữ ký hay lời chào cuối nào

QUY TẮC: Đi thẳng vào nội dung câu trả lời ngay từ từ đầu tiên. Hoàn thành toàn bộ câu trả lời.
KHÔNG kết thúc bằng "Tuy nhiên, bạn nên tham khảo ý kiến chuyên gia" nếu câu hỏi chỉ là tra cứu thông tin.`;


// ── Mandatory rules — luôn prepend vào prompt bất kể DB hay default ─────────
// Đây là các luật hành vi BẮT BUỘC, không ai được ghi đè qua Admin UI.
const MANDATORY_RULES = `
══════════════ QUY TẮC BẮT BUỘC — KHÔNG ĐƯỢC VI PHẠM ══════════════

NGHIÊM CẤM TUYỆT ĐỐI — FORMAT VĂN THƯ:
MỞ ĐẦU BỊ CẤM (KHÔNG BAO GIỜ dùng):
  ✗ "Chào bạn," / "Chào Quý doanh nghiệp," / bất kỳ câu chào nào
  ✗ "Với vai trò là Trợ lý Pháp lý AI..."
  ✗ "Tôi xin cung cấp..." / "Tôi sẽ trình bày..." / "Tôi xin trả lời..."
  ✗ Bất kỳ đoạn văn giới thiệu bản thân hoặc mô tả sẽ làm gì
KẾT THÚC BỊ CẤM (KHÔNG BAO GIỜ dùng):
  ✗ "Trân trọng," / "Kính chúc," / bất kỳ lời chào cuối nào
  ✗ "Trợ lý Pháp lý AI | LuatHoaChat.vn" / bất kỳ chữ ký nào
  ✗ "Kết luận:" / "Tóm lại," / "Như vậy," / "Nhìn chung,"

NGHIÊM CẤM — ROMAN NUMERAL HEADER:
  ✗ "I. Tổng quan" / "II. Chi tiết" / "III. Kết luận" / bất kỳ I. II. III. IV. nào
  → Thay bằng: **Bold header:** hoặc danh sách 1. 2. 3.

QUY TẮC DISCLAIMER:
  → Hỏi "gì/bao nhiêu/ngày nào/điều kiện/quy trình" = KHÔNG thêm "nên tham khảo chuyên gia"
  → Chỉ thêm khi câu hỏi là tình huống cụ thể của doanh nghiệp / đánh giá rủi ro / tranh chấp

BẮT ĐẦU: Đi thẳng vào nội dung từ từ đầu tiên. KHÔNG lời chào, KHÔNG tự giới thiệu.
════════════════════════════════════════════════════════════════════
`;

// ── AI Config cache (TTL 60s) ──────────────────────────────────────────────
interface AIConfigCache {
  systemPrompt: string;
  temperature: number;
  model: string;
  maxTokensOverride: number | null; // null = dùng auto-budget theo loại câu hỏi
  fetchedAt: number;
}

let configCache: AIConfigCache | null = null;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút (tăng từ 60s để giảm roundtrip DB)

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAIConfig(): Promise<AIConfigCache> {
  // Trả về cache nếu còn hiệu lực
  if (configCache && Date.now() - configCache.fetchedAt < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }

  try {
    const { data } = await getSupabaseAdmin()
      .from('system_config')
      .select('key, value')
      .in('key', ['ai_system_prompt', 'ai_temperature', 'ai_model', 'ai_max_tokens']);

    const get = (key: string) => (data as any[])?.find(r => r.key === key)?.value;

    const systemPromptRaw = get('ai_system_prompt');
    const temperatureRaw  = get('ai_temperature');
    const modelRaw        = get('ai_model');
    const maxTokensRaw    = get('ai_max_tokens');

    // Luôn prepend MANDATORY_RULES vào đầu — bất kể prompt từ DB hay mặc định
    const basePrompt = systemPromptRaw?.trim() ? systemPromptRaw : DEFAULT_SYSTEM_INSTRUCTION;

    configCache = {
      systemPrompt:      MANDATORY_RULES + '\n' + basePrompt,
      temperature:       temperatureRaw  ? parseFloat(temperatureRaw) : 0.15,
      model:             modelRaw?.trim() ? modelRaw : 'gemini-2.5-flash',
      maxTokensOverride: maxTokensRaw    ? parseInt(maxTokensRaw)    : null,
      fetchedAt: Date.now(),
    };

    console.log(`[api/chat] Config loaded — model: ${configCache.model}, temp: ${configCache.temperature}`);
  } catch (err) {
    console.warn('[api/chat] DB config unavailable, using defaults:', err);
    configCache = {
      systemPrompt:      MANDATORY_RULES + '\n' + DEFAULT_SYSTEM_INSTRUCTION,
      temperature:       0.15,
      model:             'gemini-2.5-flash',
      maxTokensOverride: null,
      fetchedAt: Date.now(),
    };
  }

  return configCache!;
}


// ── Query expansion for better retrieval ─────────────────────────────────
// Mở rộng query trước khi gửi cho vector search để tránh miss các văn bản quan trọng
function expandQueryForSearch(query: string): string {
  const q = query.toLowerCase();

  // Câu hỏi về mã HS, mã số hàng hóa, khai báo nhập khẩu → kéo NĐ 24/26 Điều 6
  if (/m[aã] hs|hs.?code|m[aã] s[oố] h[aà]ng h[oó]a|ch[uươ][oở]ng 28|ch[uươ][oở]ng 29|khai b[aá]o nh[aậ]p kh[aẩ]u/i.test(q)) {
    return query + ' nghị định 24 2026 mã HS hóa chất chương 28 chương 29 khai báo nhập khẩu';
  }

  // Câu hỏi về chứng chỉ tư vấn, hạng A1, A2, A3, hạng B, tư vấn viên → kéo NĐ 25 Chương IV
  if (/ch[uứ]ng ch[ỉi]|t[uư] v[aấ]n vi[eê]n|h[aạ]ng A|h[aạ]ng B|t[uư] v[aấ]n chuy[eê]n ng[aà]nh|đi[eề]u ki[eệ]n t[uư] v[aấ]n/i.test(q)) {
    return query + ' nghị định 25 chương IV điều 16 điều 17 điều 18 điều 20 chứng chỉ tư vấn hóa chất';
  }

  // Câu hỏi liên quan đến nhãn, SDS, GHS → kéo thêm TT 02/2026
  if (/nh[ãa]n|ghi nh[ãa]n|sds|phi[eế]u an to[àa]n|ghs|c[aả]nh b[aá]o|picto|bi[eể]u t[uư][ợo]ng|nh[ãa]n m[áa]c/i.test(q)) {
    return query + ' thông tư 02 2026 nhãn hóa chất SDS phiếu an toàn';
  }

  // Câu hỏi về tiêu chí chất độc, phân loại GHS → kéo NĐ 26 Điều 2
  if (/ch[aấ]t đ[oộ]c|ti[eê]u ch[ií]|ph[aâ]n lo[aạ]i đ[oộ]c|toxic|ghs categor|h[aà]m l[uư][ợo]ng|LD50|LC50/i.test(q)) {
    return query + ' nghị định 26 điều 2 khoản 4 chất độc tiêu chí GHS phân loại';
  }

  // Câu hỏi trực tiếp về TT 02 → đảm bảo match
  if (/th[oô]ng t[uư]|tt.?02|02.?2026.?tt|tt-bct/i.test(q)) {
    return query + ' thông tư 02/2026/TT-BCT nhãn hóa chất';
  }

  return query;
}

// ── Token budget theo loại câu hỏi ────────────────────────────────────────
// Lưu ý: maxOutputTokens bao gồm cả thinking tokens (2048).
// Mỗi mức đã được cộng thêm ~3000-4000 để bù vào phần thinking.
function getTokenBudget(query: string, scenario: ScenarioType): number {
  const q = query.toLowerCase();
  const hasScenario = scenario !== 'none';

  // Hướng dẫn toàn diện A-Z / đầy đủ / multi-step — cần nhiều token nhất
  if (/từ a.*z|a-z|toàn bộ|toàn diện|đầy đủ|chi tiết nhất|hướng dẫn chi tiết|tất cả các bước|quy trình đầy đủ|chu trình|cần biết gì/i.test(q)) return 12000;

  // Phức tạp: so sánh + scenario đồng thời
  if (/so (sánh|sanh)|so với|vs\b|khác nhau/i.test(q)) return hasScenario ? 10000 : 8000;
  // Scenario luôn cần nhiều token
  if (/đồng thời|vừa.*vừa|kết hợp/i.test(q) || hasScenario) return 10000;
  // Quy trình thủ tục (nhiều bước)
  if (/thủ tục|quy trình|các bước|hướng dẫn/i.test(q)) return 8000;
  // Liệt kê, hồ sơ, điều kiện, trường hợp, ngoại lệ — dễ bị cắt nhất
  if (/liệt kê|danh sách|các điều kiện|hồ sơ|bao gồm|gồm những|yêu cầu|điều kiện|trường hợp|ngoại lệ|được miễn/i.test(q)) return 8000;
  // Câu hỏi đơn giản (tra cứu 1 thông tin)
  return 6000;
}




// ── Streaming Gemini call ──────────────────────────────────────────────────
async function streamGemini(
  systemInstruction: string,
  userMessage: string,
  maxTokens: number,
  temperature: number,
  model: string
): Promise<ReadableStream | null> {
  if (!GEMINI_API_KEY) return null;

  const streamUrl = `${GEMINI_BASE_URL}/${model}:streamGenerateContent`;

  const res = await fetch(`${streamUrl}?key=${GEMINI_API_KEY}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.85,
        topK: 20,
        // Giới hạn thinking tokens: không để mặc định (-1 = dynamic) vì Gemini 2.5 Flash
        // có thể dùng 2000-5000 thinking tokens → Response bị cắt.
        // thinkingConfig phải nằm BÊN TRONG generationConfig (không phải top-level).
        thinkingConfig: { thinkingBudget: 2048 },
      },
    }),
  });

  if (!res.ok || !res.body) {
    console.warn(`[api/chat] Gemini stream failed (${res.status}) for model: ${model}`);
    return null;
  }

  return res.body;
}

// ── Main handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, knowledge_context } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query required' }), { status: 400 });
    }
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
    }

    // 1. Đọc AI config từ DB (cache 60s)
    const aiConfig = await getAIConfig();

    // 2. Detect language, scenario, chemicals
    const lang             = detectLanguage(query);
    const scenario         = detectScenario(query);
    const foundChemicals   = detectChemicalsInQuery(query);
    const chemicalContext  = buildChemicalContext(foundChemicals);
    const scenarioChecklist = scenario !== 'none' ? SCENARIO_CHECKLISTS[scenario] : '';

    // Dùng max_tokens từ DB nếu có, ngược lại tự tính theo loại câu hỏi
    const maxTokens = aiConfig.maxTokensOverride ?? getTokenBudget(query, scenario);

    // 3. Language prefix
    const langPrefix = lang === 'en'
      ? '[LANGUAGE: Respond entirely in English. Use [Source: Decree 26/2026, Article 9] for citations.]\n'
      : '';

    // 4. Query expansion hint (passed to context when no RAG results)
    const expandedQuery = expandQueryForSearch(query);
    const hasExpansion = expandedQuery !== query;
    if (hasExpansion) {
      console.log(`[api/chat] Query expanded for GHS/TT02 retrieval: "${query}" → expanded`);
    }

    // 5. Build user message
    const hasContext = !!(knowledge_context && knowledge_context.trim().length > 0);
    const contextSection = hasContext
      ? `# TÀI LIỆU PHÁP LÝ:\n${knowledge_context}`
      : `# TÀI LIỆU PHÁP LÝ: Không tìm thấy thông tin liên quan trong Knowledge Base.`;

    const userMessage = [
      langPrefix,
      contextSection,
      chemicalContext,
      scenarioChecklist,
      `---\n# CÂU HỎI: ${query}`,
    ].filter(Boolean).join('\n\n');


    // 5. Gọi Gemini với config từ DB
    const geminiStream = await streamGemini(
      aiConfig.systemPrompt,
      userMessage,
      maxTokens,
      aiConfig.temperature,
      aiConfig.model
    );

    if (!geminiStream) {
      return new Response(JSON.stringify({
        summary: 'Xin lỗi, không thể kết nối AI. Vui lòng thử lại.',
        detailed: '', citations: [], detected_chemicals: [],
        response_time_ms: Date.now() - startTime,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. Transform Gemini SSE → our streaming format
    const detected = foundChemicals.map(c => c.info.canonicalName);

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader  = geminiStream.getReader();
        const decoder = new TextDecoder();
        let buffer   = '';
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const chunk = JSON.parse(jsonStr);
                const token: string = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (token) {
                  fullText += token;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch { /* malformed chunk, skip */ }
            }
          }

          // Final metadata
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            done: true,
            full_text: fullText,
            response_time_ms: Date.now() - startTime,
            language: lang,
            question_type: scenario !== 'none' ? `scenario_${scenario}` : 'general',
            has_context: hasContext,
            detected_chemicals: detected,
            model_used: aiConfig.model,
          })}\n\n`));
        } catch (err) {
          console.error('[api/chat] Stream error:', err);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat] Error:', msg);
    return new Response(JSON.stringify({
      summary: 'Xin lỗi, đã có lỗi kỹ thuật. Vui lòng thử lại.',
      detailed: '', citations: [], detected_chemicals: [], error: msg,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
