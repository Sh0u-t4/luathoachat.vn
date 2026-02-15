'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

export interface PullToRefreshOptions {
  threshold?: number; // distance to pull before triggering
  maxPullDistance?: number; // maximum pull distance
  resistance?: number; // resistance factor (0-1, lower = more resistance)
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const defaultOptions: Required<Omit<PullToRefreshOptions, 'onRefresh'>> = {
  threshold: 80,
  maxPullDistance: 120,
  resistance: 0.5,
  disabled: false,
};

/**
 * Hook để implement Pull-to-Refresh gesture
 * Chỉ hoạt động khi scroll position ở đầu trang
 */
export function usePullToRefresh(
  containerRef: RefObject<HTMLElement>,
  options: PullToRefreshOptions
) {
  const opts = { ...defaultOptions, ...options };

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);

  const pullProgress = Math.min(pullDistance / opts.threshold, 1);
  const shouldTriggerRefresh = pullDistance >= opts.threshold;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (opts.disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only allow pull-to-refresh when scrolled to top
      if (container.scrollTop === 0) {
        setTouchStart(e.touches[0].clientY);
        setIsPulling(false);
      }
    },
    [containerRef, opts.disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (opts.disabled || isRefreshing || touchStart === null) return;

      const container = containerRef.current;
      if (!container) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart;

      // Only track downward pulls when at top
      if (distance > 0 && container.scrollTop === 0) {
        // Prevent default scroll behavior
        e.preventDefault();

        setIsPulling(true);

        // Apply resistance
        const resistedDistance = distance * opts.resistance;
        const limitedDistance = Math.min(resistedDistance, opts.maxPullDistance);

        setPullDistance(limitedDistance);
      }
    },
    [containerRef, opts.disabled, opts.resistance, opts.maxPullDistance, isRefreshing, touchStart]
  );

  const handleTouchEnd = useCallback(async () => {
    if (opts.disabled || isRefreshing) return;

    setIsPulling(false);
    setTouchStart(null);

    if (shouldTriggerRefresh) {
      setIsRefreshing(true);

      try {
        await options.onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
  }, [opts.disabled, isRefreshing, shouldTriggerRefresh, options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    pullProgress,
    isRefreshing,
    isPulling,
    shouldTriggerRefresh,
  };
}
