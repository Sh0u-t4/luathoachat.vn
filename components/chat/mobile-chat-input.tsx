'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { useMobile } from '@/lib/mobile/context';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';
import { toast } from 'sonner';

interface MobileChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
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
}: MobileChatInputProps) {
  const { t } = useLanguage();
  const { shouldUseMobileUI, viewport } = useMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  // Handle virtual keyboard on iOS
  useEffect(() => {
    if (!shouldUseMobileUI) return;

    const handleResize = () => {
      if ('visualViewport' in window && window.visualViewport) {
        const newHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(newHeight);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [shouldUseMobileUI]);

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

  // Handle Attachment
  const handleAttachmentClick = () => {
    hapticFeedback(HapticPatterns.light);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // TODO: Implement file upload logic
    toast.info('Tính năng đính kèm file đang được phát triển');

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Emoji
  const handleEmojiClick = () => {
    hapticFeedback(HapticPatterns.selection);
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Handle Voice Recording
  const handleVoiceClick = async () => {
    hapticFeedback(HapticPatterns.medium);

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast.info('Tính năng ghi âm đang được phát triển');
    } else {
      // Start recording
      setIsRecording(true);
      toast.info('Tính năng ghi âm đang được phát triển');

      // Auto stop after 5 seconds (demo)
      setTimeout(() => {
        setIsRecording(false);
      }, 5000);
    }
  };

  // Common emojis for quick access
  const commonEmojis = ['👍', '❤️', '😊', '🙏', '🤔', '👌', '🔥', '✅', '📝', '⚠️', '📄', '📋', '📊', '💡', '🎯'];

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        ${shouldUseMobileUI ? 'mobile-sticky-bottom' : 'border-t border-slate-200'}
        p-3 md:p-4 bg-white
        ${isFocused && shouldUseMobileUI ? 'shadow-[0_-4px_12px_rgba(0,0,0,0.1)]' : ''}
      `}
      style={{
        marginBottom: shouldUseMobileUI && keyboardHeight > 0 ? `${keyboardHeight}px` : '0',
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
        multiple
      />

      {/* Emoji Picker Overlay */}
      {showEmojiPicker && shouldUseMobileUI && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-4xl mx-auto" suppressHydrationWarning>
          <div className="flex flex-wrap gap-2 justify-center">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-2xl p-2 hover:bg-slate-100 rounded-lg transition-colors touch-target-comfortable"
                suppressHydrationWarning
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(false)}
            className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700"
            suppressHydrationWarning
          >
            Đóng
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Attachments Button (Mobile Only) */}
        {shouldUseMobileUI && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="touch-target-comfortable flex-shrink-0 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
            disabled={disabled}
            onClick={handleAttachmentClick}
            aria-label="Đính kèm file"
            suppressHydrationWarning
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        )}

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
            rows={1}
            className={`
              w-full resize-none overflow-y-auto
              ${shouldUseMobileUI ? 'mobile-input text-base' : 'h-10 text-sm'}
              px-4 py-3
              border border-slate-200 rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              disabled:bg-slate-50 disabled:text-slate-400
              placeholder:text-slate-400
            `}
            style={{
              maxHeight: '120px',
              minHeight: shouldUseMobileUI ? '48px' : '40px',
            }}
            onKeyDown={(e) => {
              // Submit on Enter (desktop only), Shift+Enter for new line
              if (e.key === 'Enter' && !e.shiftKey && !shouldUseMobileUI) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* Emoji Button (Mobile, inside input) */}
          {shouldUseMobileUI && (
            <button
              type="button"
              className={`absolute right-2 bottom-2 p-2 touch-feedback transition-colors ${
                showEmojiPicker
                  ? 'text-cyan-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              disabled={disabled}
              onClick={handleEmojiClick}
              aria-label="Chọn emoji"
              suppressHydrationWarning
            >
              <Smile className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Voice Button (Mobile Only) */}
        {shouldUseMobileUI && !value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`touch-target-comfortable flex-shrink-0 transition-colors ${
              isRecording
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-slate-500 hover:text-cyan-600 hover:bg-cyan-50'
            }`}
            disabled={disabled}
            onClick={handleVoiceClick}
            aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            suppressHydrationWarning
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
          </Button>
        )}

        {/* Send Button */}
        {(value.trim() || !shouldUseMobileUI) && (
          <Button
            type="submit"
            disabled={!value.trim() || disabled}
            className={`
              ${shouldUseMobileUI ? 'touch-target-comfortable' : 'h-10 px-4'}
              flex-shrink-0
              bg-cyan-600 hover:bg-cyan-700 text-white
              disabled:bg-slate-300 disabled:text-slate-500
              touch-feedback
            `}
            suppressHydrationWarning
          >
            <Send className={shouldUseMobileUI ? 'w-5 h-5' : 'w-4 h-4'} />
            {!shouldUseMobileUI && <span className="ml-2">Gửi</span>}
          </Button>
        )}
      </div>

      {/* Disclaimer Text */}
      {!isFocused && (
        <div className="text-xs text-slate-400 mt-2 text-center space-y-1">
          <p>{t.chat.disclaimer1}</p>
          <p>{t.chat.disclaimer2}</p>
        </div>
      )}
    </form>
  );
}
