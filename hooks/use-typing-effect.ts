import { useState, useEffect, useRef } from 'react';

export interface TypingEffectOptions {
  speed?: number; // milliseconds per character (default: 15ms)
  onComplete?: () => void;
}

export function useTypingEffect(
  fullText: string,
  isActive: boolean,
  options: TypingEffectOptions = {}
) {
  const { speed = 15, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset khi nhận text mới hoặc khi active state thay đổi
    if (!isActive) {
      setDisplayedText(fullText);
      setIsTyping(false);
      indexRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Bắt đầu typing effect
    setIsTyping(true);
    indexRef.current = 0;
    setDisplayedText('');

    const typeNextChar = () => {
      if (indexRef.current < fullText.length) {
        setDisplayedText(fullText.substring(0, indexRef.current + 1));
        indexRef.current += 1;
        timerRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    timerRef.current = setTimeout(typeNextChar, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, isActive, speed, onComplete]);

  return { displayedText, isTyping };
}
