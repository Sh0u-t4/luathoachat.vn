/**
 * Chat language detection and UI label management.
 * Used to keep all chat UI elements in sync with the user's input language.
 */

export type ChatLang = 'vi' | 'en';

/**
 * Detect whether the input text is English or Vietnamese.
 * Returns 'en' when there are no Vietnamese diacritics and enough ASCII letters.
 * Defaults to 'vi' in all other cases.
 */
export function detectChatLanguage(text: string): ChatLang {
  if (!text || text.trim().length === 0) return 'vi';
  const viDiacritics = (text.match(/[\u00C0-\u024F\u1EA0-\u1EFF]/g) || []).length;
  const asciiLetters = (text.match(/[a-zA-Z]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  if (total === 0) return 'vi';
  if (viDiacritics === 0 && asciiLetters / total > 0.45) return 'en';
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
