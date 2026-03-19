'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './chat-interface';
import { useLanguage } from '@/lib/i18n/context';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface ExpandableChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

type ChatMode = 'sidebar' | 'fullscreen';

/**
 * Expandable Chat Window
 * Mode 1: Sidebar (480px) - Default
 * Mode 2: Fullscreen - Khi user click nút expand
 *
 * Language: controlled by the global useLanguage() hook shared with the navbar toggle.
 */
export function ExpandableChatWindow({ isOpen, onClose, initialMessage }: ExpandableChatWindowProps) {
  const [mode, setMode] = useState<ChatMode>('sidebar');
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

  // Reset to sidebar khi đóng
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setMode('sidebar'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleMode = () => {
    hapticFeedback(HapticPatterns.medium);
    setIsAnimating(true);
    setMode(prev => prev === 'sidebar' ? 'fullscreen' : 'sidebar');
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClose = () => {
    hapticFeedback(HapticPatterns.light);
    onClose();
  };

  if (!isOpen) return null;

  const isFullscreen = mode === 'fullscreen';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Chat Window */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl
          transition-all duration-300 ease-in-out
          ${isAnimating ? 'transition-all duration-300' : ''}
          ${isFullscreen
            ? 'inset-4 rounded-2xl'
            : 'top-0 right-0 bottom-0 w-full md:w-[480px] lg:w-[520px]'
          }
        `}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                {t.chat.title}
              </h2>
              <p className="text-slate-400 text-xs">
                {t.chat.headerOnline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Fullscreen */}
            <Button
              onClick={toggleMode}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label={isFullscreen ? t.common.backToHome : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Close */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="h-[calc(100%-60px)] overflow-hidden">
          <ChatInterface
            initialMessage={initialMessage}
            hideDisclaimer={false}
            hideHeader={true}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>
    </>
  );
}
