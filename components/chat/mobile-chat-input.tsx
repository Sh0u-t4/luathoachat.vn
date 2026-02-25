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
}: MobileChatInputProps) {
  const { t } = useLanguage();
  const { shouldUseMobileUI } = useMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea with increased max height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

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
        ${shouldUseMobileUI ? 'flex-shrink-0 border-t border-slate-200' : 'border-t border-slate-200'}
        ${shouldUseMobileUI ? 'px-3 pt-3' : 'p-4'}
        ${shouldUseMobileUI && keyboardState?.isKeyboardOpen ? 'pb-1' : shouldUseMobileUI ? 'pb-3' : ''}
        bg-white
        ${isFocused && shouldUseMobileUI ? 'shadow-[0_-4px_12px_rgba(0,0,0,0.1)]' : ''}
      `}
      style={
        shouldUseMobileUI && keyboardState?.isKeyboardOpen
          ? { paddingBottom: '4px' }
          : undefined
      }
      suppressHydrationWarning
    >
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || t.chat.inputPlaceholder}
            disabled={disabled}
            rows={shouldUseMobileUI ? 2 : 1}
            className={`
              w-full resize-none overflow-y-auto
              ${shouldUseMobileUI ? 'mobile-input text-base' : 'h-10 text-sm'}
              px-4
              ${shouldUseMobileUI ? 'py-4' : 'py-3'}
              border border-slate-200 rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              disabled:bg-slate-50 disabled:text-slate-400
              placeholder:text-slate-400
            `}
            style={{
              maxHeight: shouldUseMobileUI ? '160px' : '120px',
              minHeight: shouldUseMobileUI ? '56px' : '40px',
              touchAction: 'manipulation',
            }}
            onKeyDown={(e) => {
              // Submit on Enter (desktop only), Shift+Enter for new line
              if (e.key === 'Enter' && !e.shiftKey && !shouldUseMobileUI) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Send Button - Always visible with larger touch target */}
        <Button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`
            ${shouldUseMobileUI ? 'h-12 w-12 p-0 rounded-xl shadow-lg' : 'h-10 px-4'}
            flex-shrink-0
            bg-cyan-600 hover:bg-cyan-700 text-white
            disabled:bg-slate-300 disabled:text-slate-500
            touch-feedback
            transition-all active:scale-95
          `}
          suppressHydrationWarning
        >
          <Send className={shouldUseMobileUI ? 'w-5 h-5' : 'w-4 h-4'} />
          {!shouldUseMobileUI && <span className="ml-2">Gửi</span>}
        </Button>
      </div>
    </form>
  );
}
