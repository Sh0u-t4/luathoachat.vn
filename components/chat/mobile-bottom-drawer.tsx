'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useMobile } from '@/lib/mobile/context';
import { preventBodyScroll, hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface MobileBottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'half' | 'full' | 'auto';
}

/**
 * Mobile Bottom Sheet Drawer với swipe-to-close gesture
 */
export function MobileBottomDrawer({
  isOpen,
  onClose,
  title,
  children,
  height = 'half',
}: MobileBottomDrawerProps) {
  const { shouldUseMobileUI, viewport } = useMobile();
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useSwipeGesture(
    {
      onSwipeDown: () => {
        hapticFeedback(HapticPatterns.light);
        onClose();
      },
      onSwipeStart: () => {
        setIsDragging(true);
      },
      onSwipeMove: (distance, direction) => {
        if (direction === 'down') {
          setTranslateY(distance);
        }
      },
      onSwipeEnd: () => {
        setIsDragging(false);
        if (translateY > 100) {
          onClose();
        }
        setTranslateY(0);
      },
    },
    {
      minSwipeDistance: 20,
    }
  );

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen && shouldUseMobileUI) {
      const cleanup = preventBodyScroll();
      return cleanup;
    }
  }, [isOpen, shouldUseMobileUI]);

  // Add haptic feedback when opening
  useEffect(() => {
    if (isOpen) {
      hapticFeedback(HapticPatterns.medium);
    }
  }, [isOpen]);

  if (!shouldUseMobileUI) return null;

  const getHeightClass = () => {
    switch (height) {
      case 'full':
        return 'h-[95vh]';
      case 'half':
        return 'h-[60vh]';
      case 'auto':
        return 'max-h-[85vh]';
      default:
        return 'h-[60vh]';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className={`
            fixed inset-0 bg-black/40 z-50
            transition-opacity duration-300
            ${isOpen ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef as any}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-3xl shadow-2xl
          ${getHeightClass()}
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          transform: isOpen
            ? `translateY(${isDragging ? translateY : 0}px)`
            : 'translateY(100%)',
        }}
      >
        {/* Handle Bar */}
        <div className="flex flex-col items-center pt-3 pb-2 border-b border-slate-200">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />

          {/* Header */}
          <div className="w-full px-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button
              onClick={() => {
                hapticFeedback(HapticPatterns.light);
                onClose();
              }}
              className="touch-target p-2 -mr-2 text-slate-500 hover:text-slate-700 touch-feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] smooth-scroll-ios">
          {children}
        </div>
      </div>
    </>
  );
}
