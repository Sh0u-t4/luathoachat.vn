'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  isStandalone: boolean; // PWA mode
  hasNotch: boolean; // iPhone X+ detection
}

/**
 * Hook phát hiện thiết bị và môi trường người dùng
 * Hỗ trợ iOS, Android, và các trình duyệt phổ biến
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isStandalone: false,
    hasNotch: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // OS Detection
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isAndroid = /Android/.test(ua);

      // Browser Detection
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);

      // Device Type Detection (based on viewport)
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // PWA Detection
      const isStandalone =
        ('standalone' in window.navigator && (window.navigator as any).standalone) ||
        window.matchMedia('(display-mode: standalone)').matches;

      // iPhone X+ Notch Detection
      const hasNotch =
        isIOS &&
        (width === 375 && height === 812) || // iPhone X, XS, 11 Pro
        (width === 414 && height === 896) || // iPhone XR, XS Max, 11, 11 Pro Max
        (width === 390 && height === 844) || // iPhone 12, 12 Pro, 13, 13 Pro
        (width === 428 && height === 926) || // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
        (width === 393 && height === 852) || // iPhone 14 Pro
        (width === 430 && height === 932);   // iPhone 14 Pro Max, 15 Pro Max

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        viewportWidth: width,
        viewportHeight: height,
        devicePixelRatio: window.devicePixelRatio || 1,
        isStandalone,
        hasNotch,
      });
    };

    // Initial detection
    detectDevice();

    // Re-detect on resize (debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(detectDevice, 150);
    };

    window.addEventListener('resize', handleResize);

    // Re-detect on orientation change
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectDevice);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return deviceInfo;
}
