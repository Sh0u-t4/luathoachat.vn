/**
 * Chat language detection and UI label management.
 * Used to keep all chat UI elements in sync with the user's input language.
 */

export type ChatLang = 'vi' | 'en';

/**
 * Vietnamese no-diacritics keywords for frontend language detection.
 * Subset of backend list — covers most common terms.
 */
const VI_KEYWORDS = [
  'luat', 'nghi dinh', 'thong tu', 'dieu', 'khoan', 'phu luc',
  'hoa chat', 'muc phat', 'xu phat', 'vi pham', 'cap phep',
  'giay phep', 'san xuat', 'kinh doanh', 'nhap khau', 'xuat khau',
  'an toan', 'su co', 'kiem soat', 'chat doc',
  'chung chi', 'doanh nghiep', 'bao cao', 'thu tuc', 'quy trinh',
  'danh muc', 'phieu an toan', 'tien chat', 'phan loai',
  'la gi', 'nhu the nao', 'bao nhieu', 'the nao',
  'phai', 'duoc', 'khong', 'cua', 'cho', 'theo',
  'toi', 'chung toi', 'cong ty',
  'hoi', 'tra loi', 'giai thich',
];

/**
 * Detect whether the input text is English or Vietnamese.
 * Checks for Vietnamese diacritics first, then Vietnamese no-diacritics keywords,
 * then falls back to ASCII heuristic. Defaults to 'vi' in ambiguous cases.
 */
export function detectChatLanguage(text: string): ChatLang {
  if (!text || text.trim().length === 0) return 'vi';
  const q = text.toLowerCase();

  // Step 1: Has Vietnamese diacritics → definitely Vietnamese
  const viDiacritics = (q.match(/[\u00C0-\u024F\u1EA0-\u1EFF]/g) || []).length;
  if (viDiacritics > 0) return 'vi';

  // Step 2: Check for Vietnamese no-diacritics keywords
  for (const kw of VI_KEYWORDS) {
    if (q.includes(kw)) return 'vi';
  }

  // Step 3: Heuristic fallback
  const asciiLetters = (q.match(/[a-zA-Z]/g) || []).length;
  const total = q.replace(/\s/g, '').length;
  if (total === 0) return 'vi';
  if (asciiLetters / total > 0.45) return 'en';
  return 'vi';
}

/**
 * Centralised UI label map for both Vietnamese and English.
 * Use this instead of hardcoding strings in components.
 */
export const CHAT_LABELS = {
  vi: {
    helpful: 'Hữu ích',
    notHelpful: 'Chưa hữu ích',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    detailedFeedback: 'Phản hồi chi tiết',
    feedbackQuestion: 'Câu trả lời này có hữu ích không?',
    relatedQuestions: 'Câu hỏi liên quan:',
    placeholder: 'Hỏi về Luật Hóa chất, khai báo, cấp phép...',
    copiedToast: 'Đã sao chép vào clipboard',
    ratingSuccess: 'Cảm ơn phản hồi của bạn!',
    ratingError: 'Không thể lưu đánh giá. Vui lòng thử lại.',
    online: 'Online • Sẵn sàng hỗ trợ',
    title: 'Trợ lý AI Luật Hóa chất',
  },
  en: {
    helpful: 'Helpful',
    notHelpful: 'Not Helpful',
    copy: 'Copy',
    copied: 'Copied',
    detailedFeedback: 'Detailed Feedback',
    feedbackQuestion: 'Was this answer helpful?',
    relatedQuestions: 'Related Questions:',
    placeholder: 'Ask about Chemical Law, declarations, permits...',
    copiedToast: 'Copied to clipboard',
    ratingSuccess: 'Thanks for your feedback!',
    ratingError: 'Could not save rating. Please try again.',
    online: 'Online • Ready to help',
    title: 'Chemical Law AI Assistant',
  },
} as const;
