'use client';

import { useState, useEffect } from 'react';

/**
 * Hook phát hiện thiết bị hỗ trợ touch
 * Phân biệt giữa touch-only và hybrid devices
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHybridDevice, setIsHybridDevice] = useState(false);

  useEffect(() => {
    // Check for touch support
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Check if device also has mouse (hybrid)
    const hasPointerDevice = window.matchMedia('(pointer: fine)').matches;

    setIsTouchDevice(hasTouchScreen);
    setIsHybridDevice(hasTouchScreen && hasPointerDevice);

    // Add global CSS class for touch devices
    if (hasTouchScreen) {
      document.documentElement.classList.add('touch-device');
    } else {
      document.documentElement.classList.add('no-touch');
    }

    // Add pointer type classes
    if (hasPointerDevice) {
      document.documentElement.classList.add('has-pointer');
    } else {
      document.documentElement.classList.add('no-pointer');
    }

  }, []);

  return { isTouchDevice, isHybridDevice };
}
