'use client';

import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface FloatingChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

/**
 * Floating Chat Bubble - Nằm góc dưới phải màn hình
 * Hiển thị icon chat khi đóng, icon X khi mở
 */
export function FloatingChatBubble({ isOpen, onClick, unreadCount = 0 }: FloatingChatBubbleProps) {
  const handleClick = () => {
    hapticFeedback(HapticPatterns.medium);
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulsing effect khi có unread */}
      {!isOpen && unreadCount > 0 && (
        <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
      )}

      {/* Main Bubble Button */}
      <Button
        onClick={handleClick}
        className={`
          relative
          w-16 h-16 rounded-full
          bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-600
          hover:from-cyan-700 hover:via-cyan-600 hover:to-blue-700
          shadow-2xl shadow-cyan-500/50
          hover:shadow-cyan-500/70
          transition-all duration-300
          flex items-center justify-center
          group
          ${isOpen ? 'rotate-90 scale-90' : 'hover:scale-110'}
        `}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat với AI'}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white transition-transform group-hover:rotate-90" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
        )}

        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {/* Tooltip khi hover */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
            Hỏi AI về Luật Hóa chất
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}
