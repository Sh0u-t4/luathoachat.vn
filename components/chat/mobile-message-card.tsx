'use client';

import { useState, useRef } from 'react';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { useMobile } from '@/lib/mobile/context';
import { useLongPress } from '@/hooks/use-long-press';
import { hapticFeedback, HapticPatterns, copyToClipboard } from '@/lib/mobile/utils';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types';

interface MobileMessageCardProps {
  message: ChatMessage;
  isLatest?: boolean;
  onRate?: (rating: 'up' | 'down') => void;
  children?: React.ReactNode;
}

/**
 * Mobile-optimized message card với long-press menu
 */
export function MobileMessageCard({
  message,
  isLatest = false,
  onRate,
  children,
}: MobileMessageCardProps) {
  const { shouldUseMobileUI } = useMobile();
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      toast.success('Đã sao chép tin nhắn');
      hapticFeedback(HapticPatterns.success);
    } else {
      toast.error('Không thể sao chép');
      hapticFeedback(HapticPatterns.error);
    }
    setShowActions(false);
  };


  const handleRate = (rating: 'up' | 'down') => {
    onRate?.(rating);
    hapticFeedback(HapticPatterns.medium);
    setShowActions(false);
  };

  const longPressHandlers = useLongPress(
    () => {
      if (shouldUseMobileUI) {
        setShowActions(true);
        hapticFeedback(HapticPatterns.medium);
      }
    },
    {
      threshold: 500,
    }
  );

  return (
    <div
      className={`flex gap-2 md:gap-3 animate-slide-up ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={`
            ${shouldUseMobileUI ? 'w-8 h-8' : 'w-8 h-8'}
            rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0
          `}
        >
          <Bot className={shouldUseMobileUI ? 'w-4 h-4' : 'w-4 h-4'} />
        </div>
      )}

      {/* Message Bubble */}
      <div
        {...(shouldUseMobileUI ? longPressHandlers : {})}
        className={`
          ${shouldUseMobileUI ? 'max-w-[85%]' : 'max-w-[80%]'}
          ${
            isUser
              ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm'
              : 'bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
          }
          ${shouldUseMobileUI ? 'px-3 py-2.5' : 'px-4 py-3'}
          relative
          touch-feedback-subtle
        `}
      >
        {children || (
          <p
            className={`whitespace-pre-wrap ${
              shouldUseMobileUI ? 'text-[15px] leading-relaxed' : 'text-sm'
            }`}
          >
            {message.content}
          </p>
        )}

        {/* Quick Actions Bar (Mobile, shows on long press) */}
        {shouldUseMobileUI && showActions && (
          <>
            {/* Overlay to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActions(false)}
            />

            {/* Actions Menu */}
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-fade-in">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-slate-100 touch-feedback"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] text-slate-600">Sao chép</span>
                </button>


                {!isUser && onRate && (
                  <>
                    <button
                      onClick={() => handleRate('up')}
                      className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-green-50 touch-feedback"
                    >
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-[10px] text-green-600">Hữu ích</span>
                    </button>

                    <button
                      onClick={() => handleRate('down')}
                      className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-red-50 touch-feedback"
                    >
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-[10px] text-red-600">Chưa tốt</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Desktop Quick Actions (hover) */}
        {!shouldUseMobileUI && !isUser && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-12 top-0 flex flex-col gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-slate-100"
              title="Sao chép"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {onRate && (
              <>
                <button
                  onClick={() => handleRate('up')}
                  className="p-1.5 rounded hover:bg-green-50"
                  title="Hữu ích"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                </button>
                <button
                  onClick={() => handleRate('down')}
                  className="p-1.5 rounded hover:bg-red-50"
                  title="Chưa tốt"
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          className={`
            ${shouldUseMobileUI ? 'w-8 h-8' : 'w-8 h-8'}
            rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0
          `}
        >
          <User className={`${shouldUseMobileUI ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
        </div>
      )}
    </div>
  );
}
