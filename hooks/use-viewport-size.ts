'use client';

import { useState, useEffect } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
  // Safe area insets (for notched devices)
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  // Viewport categories
  isXSmall: boolean;  // < 375px (small phones)
  isSmall: boolean;   // 375px - 639px (standard phones)
  isMedium: boolean;  // 640px - 767px (large phones)
  isLarge: boolean;   // 768px - 1023px (tablets)
  isXLarge: boolean;  // >= 1024px (desktop)
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Hook theo dõi kích thước viewport và safe areas
 * Xử lý đặc biệt cho iPhone X+ và Android notched devices
 */
export function useViewportSize(): ViewportSize {
  const getViewportInfo = (): ViewportSize => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Get CSS safe area insets
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTop = parseInt(computedStyle.getPropertyValue('--safe-area-top') || '0', 10);
    const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--safe-area-bottom') || '0', 10);
    const safeAreaLeft = parseInt(computedStyle.getPropertyValue('--safe-area-left') || '0', 10);
    const safeAreaRight = parseInt(computedStyle.getPropertyValue('--safe-area-right') || '0', 10);

    return {
      width,
      height,
      safeAreaTop,
      safeAreaBottom,
      safeAreaLeft,
      safeAreaRight,
      isXSmall: width < 375,
      isSmall: width >= 375 && width < 640,
      isMedium: width >= 640 && width < 768,
      isLarge: width >= 768 && width < 1024,
      isXLarge: width >= 1024,
      isPortrait: height > width,
      isLandscape: width > height,
    };
  };

  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    if (typeof window !== 'undefined') {
      return getViewportInfo();
    }
    return {
      width: 1024,
      height: 768,
      safeAreaTop: 0,
      safeAreaBottom: 0,
      safeAreaLeft: 0,
      safeAreaRight: 0,
      isXSmall: false,
      isSmall: false,
      isMedium: false,
      isLarge: false,
      isXLarge: true,
      isPortrait: false,
      isLandscape: true,
    };
  });

  useEffect(() => {
    // Update safe area CSS variables
    const updateSafeAreaVars = () => {
      const root = document.documentElement;

      // iOS safe areas
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
    };

    updateSafeAreaVars();

    // Update viewport info on resize (debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setViewportSize(getViewportInfo());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return viewportSize;
}
