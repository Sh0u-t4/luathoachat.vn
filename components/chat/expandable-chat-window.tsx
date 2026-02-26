'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './chat-interface';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface ExpandableChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

type ChatMode = 'sidebar' | 'fullscreen';

/**
 * Expandable Chat Window
 * Mode 1: Sidebar (400px width) - Default
 * Mode 2: Fullscreen - Khi user click nút expand
 */
export function ExpandableChatWindow({ isOpen, onClose, initialMessage }: ExpandableChatWindowProps) {
  const [mode, setMode] = useState<ChatMode>('sidebar');
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset to sidebar khi đóng
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setMode('sidebar'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Gửi initial message nếu có
  useEffect(() => {
    if (isOpen && initialMessage) {
      // ChatInterface sẽ xử lý initialMessage qua props
    }
  }, [isOpen, initialMessage]);

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
          ${mode === 'sidebar'
            ? 'top-0 right-0 bottom-0 w-full md:w-[480px] lg:w-[520px]'
            : 'inset-4 rounded-2xl'
          }
        `}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Trợ lý AI Luật Hóa chất</h2>
              <p className="text-slate-400 text-xs">Online • Sẵn sàng hỗ trợ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Fullscreen Button */}
            <Button
              onClick={toggleMode}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label={mode === 'sidebar' ? 'Mở rộng toàn màn hình' : 'Thu nhỏ'}
            >
              {mode === 'sidebar' ? (
                <Maximize2 className="w-5 h-5" />
              ) : (
                <Minimize2 className="w-5 h-5" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
              aria-label="Đóng chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="h-[calc(100vh-80px)] overflow-hidden">
          <ChatInterface initialMessage={initialMessage} hideDisclaimer={false} hideHeader={true} />
        </div>
      </div>
    </>
  );
}
