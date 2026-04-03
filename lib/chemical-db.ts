/**
 * Chemical classification database for Vietnamese chemical law (NĐ 24/2026).
 * Maps chemical names → legal classification for direct, authoritative answers.
 *
 * Classification types:
 * - PHU_LUC_I: Hóa chất có điều kiện (đặc biệt nguy hiểm, kiểm soát chặt)
 * - PHU_LUC_II: Hóa chất phải khai báo hàng năm
 * - PHU_LUC_III: Hóa chất tiền chất ma túy / tiền chất thuốc nổ
 * - KSDB: Hóa chất kiểm soát đặc biệt
 * - THUONG: Hóa chất thông thường (không cần giấy phép đặc biệt)
 */

export type ChemicalClass = 'PHU_LUC_I' | 'PHU_LUC_II' | 'PHU_LUC_III' | 'KSDB' | 'THUONG';

export interface ChemicalInfo {
  canonicalName: string;        // Tên chuẩn tiếng Việt/quốc tế
  cas?: string;                 // CAS number
  classification: ChemicalClass;
  subCategory?: string;         // Nhóm phụ lục (ví dụ: "Mục 1 Phụ lục I")
  description: string;          // Mô tả phân loại ngắn
  requiresPermit: boolean;      // Cần GCN đủ điều kiện?
  requiresDeclaration: boolean; // Cần khai báo hóa chất?
  specialControl: boolean;      // Kiểm soát đặc biệt?
  notes?: string;               // Ghi chú thêm
}

/** Full chemical classification database */
export const CHEMICAL_DB: Record<string, ChemicalInfo> = {
  // ── Phụ lục I — Hóa chất có điều kiện ────────────────────────────────────
  'methanol': {
    canonicalName: 'Methanol (Metyl alcohol, CH₃OH)',
    cas: '67-56-1',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — cần Giấy chứng nhận đủ điều kiện SX/KD',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 500 kg/năm. Độc tính cao, gây mù lòa khi uống phải.',
  },
  'methyl alcohol': { canonicalName: 'Methanol', cas: '67-56-1', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'axit sunfuric': {
    canonicalName: 'Axit sunfuric (Sulfuric acid, H₂SO₄)',
    cas: '7664-93-9',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — cần GCN đủ điều kiện SX/KD',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 1.000 kg/năm. Tiền chất thuốc nổ nếu nồng độ ≥51%.',
  },
  'sulfuric acid': { canonicalName: 'Axit sunfuric (H₂SO₄)', cas: '7664-93-9', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'h2so4': { canonicalName: 'Axit sunfuric (H₂SO₄)', cas: '7664-93-9', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'axit clohydric': {
    canonicalName: 'Axit clohydric (HCl)',
    cas: '7647-01-0',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — cần GCN đủ điều kiện SX/KD',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 500 kg/năm.',
  },
  'hcl': { canonicalName: 'Axit clohydric (HCl)', cas: '7647-01-0', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'hydrochloric acid': { canonicalName: 'Axit clohydric (HCl)', cas: '7647-01-0', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'axit nitric': {
    canonicalName: 'Axit nitric (HNO₃)',
    cas: '7697-37-2',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — tiền chất thuốc nổ nếu nồng độ ≥45%',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: true,
    notes: 'Nồng độ ≥45%: tiền chất thuốc nổ → kiểm soát đặc biệt.',
  },
  'nitric acid': { canonicalName: 'Axit nitric (HNO₃)', cas: '7697-37-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện / tiền chất thuốc nổ', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'hno3': { canonicalName: 'Axit nitric (HNO₃)', cas: '7697-37-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'natri hydroxide': {
    canonicalName: 'Natri hydroxide (NaOH, xút)',
    cas: '1310-73-2',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — cần GCN đủ điều kiện',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 1.000 kg/năm.',
  },
  'naoh': { canonicalName: 'Natri hydroxide (NaOH)', cas: '1310-73-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'sodium hydroxide': { canonicalName: 'Natri hydroxide (NaOH)', cas: '1310-73-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'clo': {
    canonicalName: 'Khí clo (Cl₂)',
    cas: '7782-50-5',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — khí độc cực kỳ nguy hiểm',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Cần kho chứa đặc biệt, trang bị PCCC và phòng chống sự cố hóa chất.',
  },
  'chlorine': { canonicalName: 'Khí clo (Cl₂)', cas: '7782-50-5', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'amoniac': {
    canonicalName: 'Amoniac (NH₃)',
    cas: '7664-41-7',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — khí độc, ăn mòn',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 500 kg/năm.',
  },
  'ammonia': { canonicalName: 'Amoniac (NH₃)', cas: '7664-41-7', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'nh3': { canonicalName: 'Amoniac (NH₃)', cas: '7664-41-7', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'ethanol': {
    canonicalName: 'Ethanol (Etyl alcohol, C₂H₅OH)',
    cas: '64-17-5',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện (nồng độ ≥70% hoặc dùng công nghiệp)',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ethanol thực phẩm (<70%) không thuộc Phụ lục I. Ethanol công nghiệp: cần GCN.',
  },
  'ethyl alcohol': { canonicalName: 'Ethanol (C₂H₅OH)', cas: '64-17-5', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện (công nghiệp)', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'acetone': {
    canonicalName: 'Acetone (Dimethyl ketone, CH₃COCH₃)',
    cas: '67-64-1',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026 / Tiền chất thuốc nổ',
    description: 'Hóa chất có điều kiện — tiền chất thuốc nổ',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: true,
    notes: 'Tiền chất thuốc nổ: cần kiểm soát đặc biệt khi SL ≥5 kg.',
  },
  'aceton': { canonicalName: 'Acetone', cas: '67-64-1', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I / Tiền chất thuốc nổ', description: 'Hóa chất có điều kiện / tiền chất thuốc nổ', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'toluene': {
    canonicalName: 'Toluene (C₆H₅CH₃)',
    cas: '108-88-3',
    classification: 'PHU_LUC_II',
    subCategory: 'Phụ lục II NĐ 24/2026',
    description: 'Hóa chất phải khai báo hàng năm',
    requiresPermit: false,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Ngưỡng khai báo: 1.000 kg/năm.',
  },
  'toluen': { canonicalName: 'Toluene', cas: '108-88-3', classification: 'PHU_LUC_II', subCategory: 'Phụ lục II NĐ 24/2026', description: 'Hóa chất phải khai báo', requiresPermit: false, requiresDeclaration: true, specialControl: false },
  'xylene': {
    canonicalName: 'Xylene (C₆H₄(CH₃)₂)',
    cas: '1330-20-7',
    classification: 'PHU_LUC_II',
    subCategory: 'Phụ lục II NĐ 24/2026',
    description: 'Hóa chất phải khai báo hàng năm',
    requiresPermit: false,
    requiresDeclaration: true,
    specialControl: false,
  },
  'xylen': { canonicalName: 'Xylene', cas: '1330-20-7', classification: 'PHU_LUC_II', subCategory: 'Phụ lục II NĐ 24/2026', description: 'Hóa chất phải khai báo', requiresPermit: false, requiresDeclaration: true, specialControl: false },
  // ── Phụ lục III / KSDB — Tiền chất ma túy ────────────────────────────────
  'ephedrine': {
    canonicalName: 'Ephedrine',
    cas: '299-42-3',
    classification: 'KSDB',
    subCategory: 'Tiền chất ma túy — Phụ lục III NĐ 24/2026',
    description: 'Hóa chất kiểm soát đặc biệt — tiền chất ma túy Bảng I',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: true,
    notes: 'Cần Giấy phép xuất nhập khẩu riêng từ Bộ Công an.',
  },
  'acetic anhydride': {
    canonicalName: 'Acetic anhydride',
    cas: '108-24-7',
    classification: 'KSDB',
    subCategory: 'Tiền chất ma túy — Phụ lục III NĐ 24/2026',
    description: 'Hóa chất kiểm soát đặc biệt — tiền chất heroin',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: true,
  },
  'anhidrit acetic': { canonicalName: 'Acetic anhydride', cas: '108-24-7', classification: 'KSDB', subCategory: 'Tiền chất ma túy', description: 'Kiểm soát đặc biệt — tiền chất heroin', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'hydrogen peroxide': {
    canonicalName: 'Hydrogen peroxide (H₂O₂)',
    cas: '7722-84-1',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026 / Tiền chất thuốc nổ',
    description: 'Hóa chất có điều kiện — tiền chất thuốc nổ nếu nồng độ ≥30%',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: true,
    notes: 'Nồng độ ≥30%: tiền chất thuốc nổ. Nồng độ <30%: thông thường.',
  },
  'h2o2': { canonicalName: 'Hydrogen peroxide (H₂O₂)', cas: '7722-84-1', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I / Tiền chất thuốc nổ', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'oxy gia' : { canonicalName: 'Hydrogen peroxide (H₂O₂)', cas: '7722-84-1', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I NĐ 24/2026', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: true },
  'natri hypochlorite': {
    canonicalName: 'Natri hypochlorite (NaOCl, nước javel)',
    cas: '7681-52-9',
    classification: 'PHU_LUC_II',
    subCategory: 'Phụ lục II NĐ 24/2026',
    description: 'Hóa chất phải khai báo hàng năm',
    requiresPermit: false,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Nước javel dân dụng không cần khai báo. Công nghiệp ≥10%: khai báo.',
  },
  'sodium hypochlorite': { canonicalName: 'Natri hypochlorite (NaOCl)', cas: '7681-52-9', classification: 'PHU_LUC_II', subCategory: 'Phụ lục II', description: 'Hóa chất phải khai báo', requiresPermit: false, requiresDeclaration: true, specialControl: false },
  'naocl': { canonicalName: 'Natri hypochlorite (NaOCl)', cas: '7681-52-9', classification: 'PHU_LUC_II', subCategory: 'Phụ lục II', description: 'Hóa chất phải khai báo', requiresPermit: false, requiresDeclaration: true, specialControl: false },
  'formaldehyde': {
    canonicalName: 'Formaldehyde (HCHO, formalin)',
    cas: '50-00-0',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — chất gây ung thư nhóm 1',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Nồng độ >1%: cần GCN đủ điều kiện. Formalin y tế có quy định riêng.',
  },
  'formalin': { canonicalName: 'Formaldehyde (HCHO)', cas: '50-00-0', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'hcho': { canonicalName: 'Formaldehyde (HCHO)', cas: '50-00-0', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'benzen': {
    canonicalName: 'Benzene (C₆H₆)',
    cas: '71-43-2',
    classification: 'PHU_LUC_I',
    subCategory: 'Phụ lục I NĐ 24/2026',
    description: 'Hóa chất có điều kiện — chất gây ung thư nhóm 1',
    requiresPermit: true,
    requiresDeclaration: true,
    specialControl: false,
    notes: 'Cực kỳ nguy hiểm, gây bệnh bạch cầu. Kiểm soát chặt trong môi trường làm việc.',
  },
  'benzene': { canonicalName: 'Benzene (C₆H₆)', cas: '71-43-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  'c6h6': { canonicalName: 'Benzene (C₆H₆)', cas: '71-43-2', classification: 'PHU_LUC_I', subCategory: 'Phụ lục I', description: 'Hóa chất có điều kiện', requiresPermit: true, requiresDeclaration: true, specialControl: false },
  // ── Common chemicals not in Phụ lục ──────────────────────────────────────
  'nước': { canonicalName: 'Nước (H₂O)', cas: '7732-18-5', classification: 'THUONG', subCategory: 'Không thuộc Phụ lục', description: 'Hóa chất thông thường — không cần phép đặc biệt', requiresPermit: false, requiresDeclaration: false, specialControl: false },
  'muoi': { canonicalName: 'Natri clorua (NaCl, muối)', cas: '7647-14-5', classification: 'THUONG', subCategory: 'Không thuộc Phụ lục', description: 'Hóa chất thông thường', requiresPermit: false, requiresDeclaration: false, specialControl: false },
};

const CLASS_LABELS: Record<ChemicalClass, string> = {
  PHU_LUC_I: 'Phụ lục I NĐ 24/2026 — Hóa chất có điều kiện',
  PHU_LUC_II: 'Phụ lục II NĐ 24/2026 — Hóa chất phải khai báo',
  PHU_LUC_III: 'Phụ lục III NĐ 24/2026 — Tiền chất ma túy',
  KSDB: 'Hóa chất kiểm soát đặc biệt (KSĐB)',
  THUONG: 'Hóa chất thông thường (không thuộc Phụ lục)',
};

/** Look up a chemical by name (case-insensitive, handles common aliases) */
export function lookupChemical(name: string): ChemicalInfo | null {
  const key = name.toLowerCase().trim();
  return CHEMICAL_DB[key] ?? null;
}

/**
 * Detect chemical names in a query and return their classifications.
 * Returns an array of found chemicals with their info.
 */
// Common Vietnamese words that happen to be chemical keys — require word boundary
const REQUIRE_WORD_BOUNDARY = new Set(['nước', 'muoi', 'clo']);

export function detectChemicalsInQuery(query: string): Array<{ name: string; info: ChemicalInfo }> {
  const lower = query.toLowerCase();
  const found: Array<{ name: string; info: ChemicalInfo }> = [];
  const seen = new Set<string>();

  for (const [key, info] of Object.entries(CHEMICAL_DB)) {
    // Skip common words that only match as substrings (e.g. "nước" in "nước ngoài")
    if (REQUIRE_WORD_BOUNDARY.has(key)) {
      // Use regex word boundary: the key must be a standalone word
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|[\\s,;.!?"'()\\[\\]{}])${escaped}(?:$|[\\s,;.!?"'()\\[\\]{}])`, 'i');
      if (!re.test(lower) || seen.has(info.canonicalName)) continue;
    } else {
      if (!lower.includes(key) || seen.has(info.canonicalName)) continue;
    }

    found.push({ name: key, info });
    seen.add(info.canonicalName);
  }

  return found;
}

/**
 * Generate a chemical fact card for injection into the AI prompt.
 * Gives the AI authoritative data to cite directly.
 */
export function buildChemicalContext(chemicals: Array<{ name: string; info: ChemicalInfo }>): string {
  // Filter out THUONG (ordinary) chemicals — they add no legal value and cause
  // noise like "Nước (H₂O)" appearing before actual answers
  const relevant = chemicals.filter(c => c.info.classification !== 'THUONG');
  if (relevant.length === 0) return '';

  const cards = relevant.map(({ info }) => {
    const classLabel = CLASS_LABELS[info.classification];
    const permitStr = info.requiresPermit
      ? '✅ CẦN Giấy chứng nhận đủ điều kiện SX/KD'
      : '❌ Không cần GCN đủ điều kiện';
    const declStr = info.requiresDeclaration
      ? '✅ CẦN khai báo hóa chất hàng năm'
      : '❌ Không cần khai báo';
    const ctrlStr = info.specialControl
      ? '⚠️ KIỂM SOÁT ĐẶC BIỆT — thủ tục riêng'
      : '';

    return [
      `📌 ${info.canonicalName}${info.cas ? ` (CAS: ${info.cas})` : ''}`,
      `   Phân loại: ${classLabel}`,
      `   ${permitStr}`,
      `   ${declStr}`,
      ctrlStr ? `   ${ctrlStr}` : '',
      info.notes ? `   Ghi chú: ${info.notes}` : '',
    ].filter(Boolean).join('\n');
  });

  return `\n\n═══ DỮ LIỆU HÓA CHẤT TỪ DATABASE ═══\n${cards.join('\n\n')}\n[Nguồn: NĐ 24/2026, Phụ lục]\nSỬ DỤNG dữ liệu trên để trả lời CHÍNH XÁC về phân loại hóa chất này.\n═══════════════════════════════════`;
}
