'use client';

import { useEffect, useRef } from 'react';

export interface ScrollLockOptions {
  enabled: boolean;
  reserveScrollBarGap?: boolean;
  allowTouchMove?: (el: EventTarget | null) => boolean;
}

/**
 * Hook to lock body scroll (useful when virtual keyboard is open)
 * Prevents the whole page from scrolling while allowing chat container to scroll
 *
 * @param options Configuration for scroll lock behavior
 */
export function useScrollLock(options: ScrollLockOptions) {
  const { enabled, reserveScrollBarGap = true, allowTouchMove } = options;
  const scrollPositionRef = useRef(0);
  const initialStylesRef = useRef<{ overflow: string; paddingRight: string }>({
    overflow: '',
    paddingRight: '',
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    // Save current styles
    initialStylesRef.current = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    // Save current scroll position
    scrollPositionRef.current = window.pageYOffset || html.scrollTop;

    // Calculate scrollbar width
    const scrollBarWidth = window.innerWidth - html.clientWidth;

    // Apply lock styles
    body.style.overflow = 'hidden';

    // Reserve space for scrollbar to prevent layout shift
    if (reserveScrollBarGap && scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // iOS-specific: prevent rubber band effect
    const preventTouchMove = (e: TouchEvent) => {
      // Allow touch move if custom function allows it
      if (allowTouchMove && allowTouchMove(e.target)) {
        return;
      }

      // Check if target is a scrollable element
      const target = e.target as HTMLElement;
      const isScrollable = target.scrollHeight > target.clientHeight;

      // If not scrollable or is at scroll boundaries, prevent default
      if (!isScrollable) {
        e.preventDefault();
      }
    };

    // Prevent scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Add iOS touch move prevention
    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    // Cleanup function
    return () => {
      // Restore original styles
      body.style.overflow = initialStylesRef.current.overflow;
      body.style.paddingRight = initialStylesRef.current.paddingRight;

      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);

      // Restore scroll restoration
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }

      // Remove event listener
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, [enabled, reserveScrollBarGap, allowTouchMove]);
}
