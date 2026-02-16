'use client';

import { useState, useEffect } from 'react';
import { Menu, History, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { useMobile } from '@/lib/mobile/context';
import { useOffline } from '@/hooks/use-offline';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface MobileChatHeaderProps {
  onMenuClick?: () => void;
  onHistoryClick?: () => void;
  onMoreClick?: () => void;
  chatSessionCount?: number;
}

/**
 * Mobile-optimized chat header với safe area support
 */
export function MobileChatHeader({
  onMenuClick,
  onHistoryClick,
  onMoreClick,
  chatSessionCount = 0,
}: MobileChatHeaderProps) {
  const { t } = useLanguage();
  const { device } = useMobile();
  const isOffline = useOffline();
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration: Only apply dynamic classes after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`
        flex-shrink-0 z-30
        bg-gradient-to-r from-slate-900 to-slate-800
        ${isMounted && device.hasNotch ? 'pt-safe pt-2' : 'pt-2'}
        pb-2 px-4
        shadow-md
      `}
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            hapticFeedback(HapticPatterns.light);
            onMenuClick?.();
          }}
          className="touch-target text-white hover:bg-white/10"
          suppressHydrationWarning
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Center: Title & Status */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          <h1 className="text-white font-semibold text-base truncate w-full text-center">
            {t.chat.title}
          </h1>
          <div className="flex items-center gap-1.5" suppressHydrationWarning>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isMounted ? 'animate-pulse' : ''
              } ${
                isMounted && isOffline ? 'bg-amber-400' : 'bg-green-400'
              }`}
            />
            <span
              className={`text-xs ${
                isMounted && isOffline ? 'text-amber-300' : 'text-green-300'
              }`}
            >
              {isMounted && isOffline ? t.chat.offline : t.chat.online}
            </span>
          </div>
        </div>

        {/* Right: History & More Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticFeedback(HapticPatterns.light);
              onHistoryClick?.();
            }}
            className="touch-target text-white hover:bg-white/10 relative"
            suppressHydrationWarning
          >
            <History className="w-5 h-5" />
            {isMounted && chatSessionCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {chatSessionCount > 9 ? '9+' : chatSessionCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticFeedback(HapticPatterns.light);
              onMoreClick?.();
            }}
            className="touch-target text-white hover:bg-white/10"
            suppressHydrationWarning
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
