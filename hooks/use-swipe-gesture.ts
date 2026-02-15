'use client';

import { useRef, useEffect, useCallback } from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (direction: SwipeDirection | null) => void;
  onSwipeMove?: (distance: number, direction: SwipeDirection | null) => void;
  onSwipeEnd?: () => void;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeConfig {
  minSwipeDistance?: number; // minimum distance to trigger swipe
  maxSwipeTime?: number; // maximum time for swipe
  preventDefaultTouchMove?: boolean;
}

const defaultConfig: Required<SwipeConfig> = {
  minSwipeDistance: 50,
  maxSwipeTime: 300,
  preventDefaultTouchMove: false,
};

/**
 * Hook để xử lý swipe gestures trên mobile
 * Hỗ trợ swipe left, right, up, down
 */
export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const mergedConfig = { ...defaultConfig, ...config };
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const getSwipeDirection = useCallback(
    (deltaX: number, deltaY: number): SwipeDirection | null => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if swipe distance is sufficient
      if (absX < mergedConfig.minSwipeDistance && absY < mergedConfig.minSwipeDistance) {
        return null;
      }

      // Determine dominant direction
      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    [mergedConfig.minSwipeDistance]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchMoveRef.current = null;

      if (handlers.onSwipeStart) {
        handlers.onSwipeStart(null);
      }
    },
    [handlers]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      if (mergedConfig.preventDefaultTouchMove) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      touchMoveRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const direction = getSwipeDirection(deltaX, deltaY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (handlers.onSwipeMove) {
        handlers.onSwipeMove(distance, direction);
      }
    },
    [handlers, mergedConfig.preventDefaultTouchMove, getSwipeDirection]
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const touchEnd = touchMoveRef.current || touchStartRef.current;
    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if swipe was fast enough
    if (deltaTime > mergedConfig.maxSwipeTime) {
      touchStartRef.current = null;
      touchMoveRef.current = null;
      if (handlers.onSwipeEnd) {
        handlers.onSwipeEnd();
      }
      return;
    }

    const direction = getSwipeDirection(deltaX, deltaY);

    if (direction) {
      switch (direction) {
        case 'left':
          handlers.onSwipeLeft?.();
          break;
        case 'right':
          handlers.onSwipeRight?.();
          break;
        case 'up':
          handlers.onSwipeUp?.();
          break;
        case 'down':
          handlers.onSwipeDown?.();
          break;
      }
    }

    touchStartRef.current = null;
    touchMoveRef.current = null;

    if (handlers.onSwipeEnd) {
      handlers.onSwipeEnd();
    }
  }, [handlers, mergedConfig.maxSwipeTime, getSwipeDirection]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, {
      passive: !mergedConfig.preventDefaultTouchMove,
    });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, mergedConfig.preventDefaultTouchMove]);

  return elementRef;
}
