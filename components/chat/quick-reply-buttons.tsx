'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickReplyButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

/**
 * Quick Reply Buttons component
 * Shows contextual follow-up suggestions after assistant messages
 */
export function QuickReplyButtons({ suggestions, onSelect, className = '' }: QuickReplyButtonsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 mt-3 ${className}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MessageCircle className="w-3 h-3" />
        <span>Câu hỏi liên quan:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="text-xs bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all duration-200 rounded-lg"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Generate contextual suggestions based on message content
 * This is a simple implementation - can be enhanced with AI later
 */
export function generateQuickReplies(messageContent: string): string[] {
  const content = messageContent.toLowerCase();

  // Keyword-based suggestions
  if (content.includes('phụ lục') || content.includes('danh mục')) {
    return [
      'Phụ lục này có những hóa chất nào?',
      'Ngưỡng khai báo là bao nhiêu?',
      'Cần giấy phép gì?',
    ];
  }

  if (content.includes('khoảng cách') || content.includes('an toàn')) {
    return [
      'Cách tính khoảng cách chi tiết?',
      'Các trường hợp ngoại lệ?',
      'Hình phạt nếu vi phạm?',
    ];
  }

  if (content.includes('khai báo') || content.includes('nhập khẩu')) {
    return [
      'Hồ sơ cần chuẩn bị gì?',
      'Thời gian xử lý bao lâu?',
      'Lệ phí là bao nhiêu?',
    ];
  }

  if (content.includes('giấy phép') || content.includes('license')) {
    return [
      'Điều kiện cấp phép?',
      'Thủ tục gia hạn?',
      'Xử phạt khi hết hạn?',
    ];
  }

  if (content.includes('nghị định') || content.includes('luật')) {
    return [
      'Văn bản hướng dẫn chi tiết?',
      'Thời điểm có hiệu lực?',
      'So với quy định cũ?',
    ];
  }

  // Default suggestions
  return [
    'Cho ví dụ cụ thể?',
    'Giải thích rõ hơn?',
    'Văn bản pháp lý liên quan?',
  ];
}
