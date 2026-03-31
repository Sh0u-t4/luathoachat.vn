'use client';

import { MessageCircle, ChevronRight } from 'lucide-react';

interface QuickReplyButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function QuickReplyButtons({ suggestions, onSelect, className = '' }: QuickReplyButtonsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={`flex flex-col gap-1.5 mt-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
        <MessageCircle className="w-3 h-3" />
        <span>Câu hỏi liên quan</span>
      </div>
      <div className="flex flex-col gap-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="w-full flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-150 group"
          >
            <ChevronRight className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-cyan-500 transition-colors" />
            <span className="flex-1 leading-snug">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


// ── Suggestion deduplication pool ─────────────────────────────────────────
// Track suggestions shown globally per session to avoid repetition
const shownSuggestions = new Set<string>();

/**
 * Generate smart, context-aware and non-repeating follow-up suggestions.
 * Priority: (1) Go deeper on same topic, (2) Related expansion, (3) Next action/procedure
 */
export function generateQuickReplies(messageContent: string, maxSuggestions = 3): string[] {
  const text = messageContent;
  const lower = text.toLowerCase();

  const candidates: string[] = [];

  // ── Extract specific entities for deeper follow-ups ──────────────────
  // Extract Điều numbers mentioned → "deeper" follow-up
  const articleMatches = text.match(/Điều\s+(\d+[a-z]?)/gi) ?? [];
  const articles = Array.from(new Set(articleMatches.map(m => m.trim())));
  if (articles.length > 0) {
    candidates.push(`${articles[0]} quy định chi tiết những gì?`);
  }

  // Extract document names → comparison follow-up
  const docMatches = text.match(/Nghị định\s+\d+\/\d+\/NĐ-CP|Luật\s+(?:Hóa chất|số)\s*\d+/gi) ?? [];
  const docs = Array.from(new Set(docMatches.map(m => m.trim())));
  if (docs.length >= 2) {
    candidates.push(`So sánh chi tiết ${docs[0]} và ${docs[1]}?`);
  } else if (docs.length === 1) {
    candidates.push(`${docs[0]} còn quy định gì khác liên quan?`);
  }

  // ── Topic-specific deep dives ─────────────────────────────────────────
  if (/giấy (chứng nhận|phép)|gcn|giấy phép/i.test(lower)) {
    candidates.push('Thủ tục gia hạn Giấy chứng nhận như thế nào?');
    candidates.push('Mức xử phạt nếu kinh doanh khi GCN hết hạn?');
    candidates.push('Điều kiện cấp Giấy chứng nhận đủ điều kiện?');
  }

  if (/khoảng cách an toàn|vùng ảnh hưởng|bảo vệ|buffer zone/i.test(lower)) {
    candidates.push('Phương pháp tính khoảng cách an toàn chi tiết?');
    candidates.push('Ngoại lệ và trường hợp được miễn khoảng cách?');
  }

  if (/khai báo|khai báo hóa chất|inventory/i.test(lower)) {
    candidates.push('Ngưỡng khai báo tối thiểu là bao nhiêu kg?');
    candidates.push('Hồ sơ khai báo hóa chất gồm những gì?');
    candidates.push('Thủ tục khai báo nhập khẩu hóa chất lần đầu?');
  }

  if (/kiểm soát đặc biệt|hóa chất ksđb|tiền chất|precursor/i.test(lower)) {
    candidates.push('Danh mục hóa chất kiểm soát đặc biệt gồm những gì?');
    candidates.push('Điều kiện kinh doanh hóa chất kiểm soát đặc biệt?');
  }

  if (/mức phạt|xử phạt|vi phạm|phạt tiền|chế tài/i.test(lower)) {
    candidates.push('Ngoài phạt tiền có hình thức xử phạt bổ sung nào?');
    candidates.push('Trường hợp nào được giảm nhẹ mức phạt?');
  }

  if (/sản xuất|manufacturing|sx\b/i.test(lower) && /kinh doanh|kd\b|thương mại/i.test(lower)) {
    candidates.push('DN vừa SX vừa KD hóa chất cần những giấy phép gì?');
  } else if (/sản xuất|manufacturing/i.test(lower)) {
    candidates.push('Điều kiện cơ sở vật chất cho sản xuất hóa chất?');
    candidates.push('Tiêu chuẩn nhân sự kỹ thuật trong sản xuất hóa chất?');
  } else if (/kinh doanh|buôn bán|phân phối/i.test(lower)) {
    candidates.push('Điều kiện kho chứa hóa chất nguy hiểm?');
    candidates.push('Yêu cầu về nhãn mác khi kinh doanh hóa chất?');
  }

  if (/nhập khẩu|xuất khẩu|import|export/i.test(lower)) {
    candidates.push('Danh mục hóa chất cấm nhập khẩu?');
    candidates.push('Thủ tục xin phép nhập khẩu hóa chất có điều kiện?');
  }

  if (/phòng cháy|pccc|chữa cháy|fire/i.test(lower)) {
    candidates.push('Yêu cầu PCCC đối với kho chứa hóa chất?');
    candidates.push('Thiết bị PCCC bắt buộc cho cơ sở hóa chất?');
  }

  if (/thời hạn|hiệu lực|deadline|expire/i.test(lower)) {
    candidates.push('Thủ tục gia hạn trước khi hết hạn?');
    candidates.push('Điều khoản chuyển tiếp cho GCN cũ?');
  }

  if (/nghị định 24|nđ 24|nd 24/i.test(lower)) {
    candidates.push('NĐ 24/2026 so sánh với quy định cũ NĐ 113/2017 như thế nào?');
  }
  if (/nghị định 25|nđ 25|nd 25/i.test(lower)) {
    candidates.push('Phương pháp đánh giá rủi ro theo NĐ 25/2026?');
  }
  if (/nghị định 26|nđ 26|nd 26/i.test(lower)) {
    candidates.push('Thủ tục xin GCN đủ điều kiện theo NĐ 26/2026?');
  }

  // ── Generic action-oriented suggestions (fallback) ────────────────────
  const genericSuggestions = [
    'Mức phạt vi phạm cụ thể là bao nhiêu?',
    'Văn bản pháp luật nào quy định vấn đề này?',
    'Thủ tục thực hiện step-by-step?',
    'Ví dụ thực tế trong doanh nghiệp?',
    'Điều khoản chuyển tiếp và thời điểm áp dụng?',
    'Cơ quan nào có thẩm quyền cấp phép?',
    'Hồ sơ cần chuẩn bị đầy đủ là gì?',
  ];

  // Add generic suggestions not yet in candidates
  for (const g of genericSuggestions) {
    if (!candidates.some(c => c.toLowerCase().includes(g.toLowerCase().slice(0, 20)))) {
      candidates.push(g);
    }
  }

  // ── Filter already-shown suggestions + deduplicate ─────────────────────
  const fresh = candidates.filter(s => !shownSuggestions.has(s));
  const result = fresh.slice(0, maxSuggestions);

  // Register shown suggestions to avoid future repetition
  result.forEach(s => shownSuggestions.add(s));

  // If all suggestions have been shown (long session), reset pool
  if (shownSuggestions.size > 50) shownSuggestions.clear();

  return result.length > 0 ? result : candidates.slice(0, maxSuggestions);
}
