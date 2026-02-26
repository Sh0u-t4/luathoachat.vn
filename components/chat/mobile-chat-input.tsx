'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { useMobile } from '@/lib/mobile/context';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';
import type { KeyboardState } from '@/hooks/use-keyboard-state';

interface MobileChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  keyboardState?: KeyboardState;
  disclaimer?: string;
}

/**
 * Mobile-optimized chat input với larger touch targets và keyboard handling
 */
export function MobileChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  keyboardState,
  disclaimer,
}: MobileChatInputProps) {
  const { t } = useLanguage();
  const { shouldUseMobileUI } = useMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Remove auto-resize for fixed height input

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;

    // Haptic feedback on send
    hapticFeedback(HapticPatterns.light);

    onSubmit(e);

    // Blur input sau khi send trên mobile để hide keyboard
    if (shouldUseMobileUI && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    hapticFeedback(HapticPatterns.selection);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        ${shouldUseMobileUI ? 'flex-shrink-0' : ''}
        ${shouldUseMobileUI ? 'px-4 pt-4' : 'p-4'}
        ${shouldUseMobileUI && keyboardState?.isKeyboardOpen ? 'pb-2' : shouldUseMobileUI ? 'pb-4' : ''}
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        ${isFocused && shouldUseMobileUI ? 'shadow-[0_-4px_12px_rgba(0,0,0,0.3)]' : ''}
      `}
      style={
        shouldUseMobileUI && keyboardState?.isKeyboardOpen
          ? { paddingBottom: '8px' }
          : undefined
      }
      suppressHydrationWarning
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* Dark Text Input - Larger for mobile */}
        <div className="flex-1 relative">
          <input
            ref={textareaRef as any}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Hỏi về Luật Hóa chất..."
            disabled={disabled}
            className={`
              w-full
              ${shouldUseMobileUI ? 'h-14 text-base mobile-input' : 'h-12 text-sm'}
              px-5
              bg-slate-800/50 border border-slate-700
              text-white placeholder:text-slate-400
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
              disabled:bg-slate-900/50 disabled:text-slate-500
              transition-all
            `}
            style={{
              touchAction: 'manipulation',
            }}
            onKeyDown={(e) => {
              // Submit on Enter
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Gradient Send Button */}
        <Button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`
            ${shouldUseMobileUI ? 'h-14 px-6' : 'h-12 px-5'}
            rounded-xl
            flex-shrink-0
            bg-gradient-to-r from-cyan-600 to-cyan-500
            hover:from-cyan-700 hover:to-cyan-600
            text-white font-semibold
            disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-700
            touch-feedback
            transition-all active:scale-95
            shadow-lg shadow-cyan-500/30
            flex items-center gap-2
          `}
          suppressHydrationWarning
        >
          <Send className="w-5 h-5" />
          <span className="text-sm">Gửi</span>
        </Button>
      </div>

      {/* Disclaimer text */}
      {disclaimer && (
        <p className="text-xs text-slate-400 mt-3 text-center max-w-4xl mx-auto">
          {disclaimer}
        </p>
      )}
    </form>
  );
}
