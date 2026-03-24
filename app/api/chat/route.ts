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

═══ BƯỚC 1: PHÂN LOẠI CÂU HỎI ═══
Loại: tra_cuu_don | liet_ke | so_sanh | phuc_hop | quy_trinh | off_topic

═══ BƯỚC 2: FORMAT PHẢN HỒI ═══
tra_cuu_don: Trả lời trực tiếp, ≤3 câu + [Nguồn: ...].
liet_ke: Numbered list đầy đủ. KHÔNG bỏ sót.
so_sanh: BẮT BUỘC dùng bảng Markdown ≤3 cột. Tối đa 20 từ/ô.
phuc_hop: Chia trường hợp → kết luận.
quy_trinh: Step-by-step có thời gian/chi phí.
off_topic: Giải thích phạm vi + gợi ý 2-3 câu hỏi liên quan.

═══ QUY TẮC TRÍCH DẪN — BẮT BUỘC TUYỆT ĐỐI ═══
1. CHỈ ghi "Điều X" khi đoạn văn trích dẫn từ tài liệu pháp lý CÓ GHI RÕ con số đó.
2. NGHIÊM CẤM suy đoán, ước đoán, hoặc nhớ lại số Điều/Khoản từ kiến thức nền.
3. Nếu tài liệu cung cấp không ghi số Điều → chỉ ghi tên văn bản: "(NĐ 25/2026)" KHÔNG có số Điều.
4. Nếu tài liệu ghi "Điều 32" → phải ghi đúng "Điều 32", không được đổi thành số khác.
5. TUYỆT ĐỐI không viết "Điều chưa xác định" hoặc bịa số điều.
6. TUYỆT ĐỐI KHÔNG DÙNG CÁC KÝ HIỆU ĐẶT CHỖ NHƯ [X], [Y], [Z] HOẶC TƯƠNG TỰ.

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
Nếu CÓ checklist tình huống trong prompt → bao quát TẤT CẢ mục.

══════════════════════════════════════════════════════════════════
  KIẾN THỨC TĨNH ĐÃ XÁC MINH — ƯU TIÊN SỬ DỤNG KHI CÓ LIÊN QUAN
══════════════════════════════════════════════════════════════════

  ─── A. PHỤ LỤC NGHỊ ĐỊNH 24/2026/NĐ-CP ───
  Nghị định 24/2026/NĐ-CP (ngày 17/01/2026) quy định danh mục hóa chất, gồm:
  • Phụ lục I   — Hóa chất có điều kiện (thuộc Chương 28, 29 biểu thuế XNK; cần khai báo hoặc GCN)
  • Phụ lục II  — Hóa chất cần kiểm soát đặc biệt (tiền chất công nghiệp, hóa chất độc bảng)
  • Phụ lục III — Hóa chất Bảng (Bảng 1, 2, 3 theo Công ước Cấm vũ khí hóa học)
  • Phụ lục IV  — Hóa chất cấm
  LƯU Ý QUAN TRỌNG: NĐ 24/2026 CÓ QUY ĐỊNH mã HS (mã số hàng hóa) cho từng hóa chất trong các Phụ lục.
  NGHIÊM CẤM trả lời rằng "NĐ 24 không có mã HS" — đây là sai hoàn toàn.
  Mã HS áp dụng theo Danh mục hàng hóa XNK VN (Bộ Tài chính ban hành), tương ứng với Chương 28/29.
  Khai báo HS code nhập khẩu hóa chất: thực hiện qua Cổng thông tin một cửa quốc gia [Nguồn: NĐ 26/2026, Điều 6, Khoản 1].

  ─── B. CHỨNG CHỈ TƯ VẤN CHUYÊN NGÀNH HÓA CHẤT (NĐ 25/2026, Chương IV) ───
  QUAN TRỌNG: Không có "Hạng I" hay "Hạng II". Chỉ tồn tại: Hạng A1, A2, A3 (công nghệ) và Hạng B (an toàn).

  B1) Chứng chỉ tư vấn LỰA CHỌN CÔNG NGHỆ, THIẾT BỊ cho dự án hóa chất (Điều 16 NĐ 25):
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

  B2) Chứng chỉ tư vấn AN TOÀN, AN NINH HÓA CHẤT — chỉ có Hạng B (Điều 18 NĐ 25):
  • Hạng B (diễn tập cấp quốc gia): ≥5 chương trình diễn tập cấp tỉnh
  • Hạng B (kế hoạch PCƯSC quốc gia): ≥2 kế hoạch cấp tỉnh được duyệt trong 2 năm gần nhất
  • Hạng B (diễn tập cơ sở hóa chất): ≥2 chương trình diễn tập cơ sở
  • Hạng B (diễn tập cấp tỉnh + cơ sở): ≥2 chương trình diễn tập cấp tỉnh
  • Hạng B (kế hoạch PCƯSC cơ sở/dự án): ≥2 kế hoạch cơ sở được duyệt trong 2 năm
  • Hạng B (kế hoạch PCƯSC cấp tỉnh): ≥2 kế hoạch cấp tỉnh được duyệt trong 2 năm
  • Hạng B (huấn luyện an toàn nhóm I, II, III): ≥5 chương trình huấn luyện trong 2 năm
  • Hạng B (cơ bản): Bằng cử nhân hóa học + kinh nghiệm thực tế → tư vấn phân loại, ghi nhãn, lập SDS, đăng ký hóa chất mới

  ─── C. 16 MỤC NỘI DUNG PHIẾU AN TOÀN HÓA CHẤT (SDS) ───
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

  ─── D. PHÂN LOẠI CHẤT ĐỘC THEO GHS (NĐ 26/2026, Điều 2, Khoản 4) ───
  Hóa chất là "chất độc" khi có MỘT trong các tiêu chí sau (theo phân loại GHS cấp nghiêm trọng nhất):
  a) Độc cấp tính cấp 1 (oral/dermal/inhalation)
  b) Tổn thương nghiêm trọng / kích ứng mắt cấp 1
  c) Ăn mòn / kích ứng da cấp 1A
  d) Tác nhân gây ung thư cấp 1A
  đ) Đột biến tế bào mầm cấp 1A
  e) Độc tính sinh sản cấp 1A
  g) Nguy hại môi trường cấp 1
  [Nguồn: NĐ 26/2026, Điều 2, Khoản 4]

KHÔNG dùng lời chào. Đi thẳng vào nội dung. Hoàn thành toàn bộ câu trả lời.`;


// ── AI Config cache (TTL 60s) ──────────────────────────────────────────────
interface AIConfigCache {
  systemPrompt: string;
  temperature: number;
  model: string;
  maxTokensOverride: number | null; // null = dùng auto-budget theo loại câu hỏi
  fetchedAt: number;
}

let configCache: AIConfigCache | null = null;
const CONFIG_CACHE_TTL_MS = 60 * 1000; // 60 giây

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

    configCache = {
      systemPrompt:      systemPromptRaw?.trim() ? systemPromptRaw : DEFAULT_SYSTEM_INSTRUCTION,
      temperature:       temperatureRaw  ? parseFloat(temperatureRaw) : 0.15,
      model:             modelRaw?.trim() ? modelRaw : 'gemini-2.5-flash',
      maxTokensOverride: maxTokensRaw    ? parseInt(maxTokensRaw)    : null,
      fetchedAt: Date.now(),
    };

    console.log(`[api/chat] Config loaded — model: ${configCache.model}, temp: ${configCache.temperature}`);
  } catch (err) {
    console.warn('[api/chat] DB config unavailable, using defaults:', err);
    configCache = {
      systemPrompt:      DEFAULT_SYSTEM_INSTRUCTION,
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
function getTokenBudget(query: string, scenario: ScenarioType): number {
  const q = query.toLowerCase();
  const hasScenario = scenario !== 'none';
  // Phức tạp nhất: so sánh + scenario
  if (/so (sánh|sanh)|so với|vs\b|khác nhau/i.test(q)) return hasScenario ? 4000 : 3000;
  // Scenario luôn cần nhiều token
  if (/đồng thời|vừa.*vừa|kết hợp/i.test(q) || hasScenario) return 4000;
  // Quy trình thủ tục
  if (/thủ tục|quy trình|các bước|hướng dẫn/i.test(q)) return 3000;
  // Liệt kê, hồ sơ, điều kiện, yêu cầu — dễ bị cắt nhất nếu thiếu token
  if (/liệt kê|danh sách|các điều kiện|hồ sơ|bao gồm|gồm những|yêu cầu|điều kiện/i.test(q)) return 3000;
  // Câu hỏi đơn giản
  return 2500;
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
        topP: 0.9,
        topK: 40,
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
