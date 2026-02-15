'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDeviceDetection, DeviceInfo } from '@/hooks/use-device-detection';
import { useTouchDevice } from '@/hooks/use-touch-device';
import { useViewportSize, ViewportSize } from '@/hooks/use-viewport-size';

interface MobileContextValue {
  device: DeviceInfo;
  touch: {
    isTouchDevice: boolean;
    isHybridDevice: boolean;
  };
  viewport: ViewportSize;
  // Helper methods
  isMobileView: boolean;
  isTabletView: boolean;
  isDesktopView: boolean;
  shouldUseMobileUI: boolean;
  shouldUseTabletUI: boolean;
  shouldUseDesktopUI: boolean;
}

const MobileContext = createContext<MobileContextValue | undefined>(undefined);

/**
 * Mobile Context Provider
 * Tập trung quản lý tất cả thông tin về thiết bị, viewport, và touch capabilities
 */
export function MobileProvider({ children }: { children: ReactNode }) {
  const device = useDeviceDetection();
  const touch = useTouchDevice();
  const viewport = useViewportSize();

  // Helper computed values
  const isMobileView = viewport.width < 768;
  const isTabletView = viewport.width >= 768 && viewport.width < 1024;
  const isDesktopView = viewport.width >= 1024;

  // UI decision helpers (có thể override logic nếu cần)
  const shouldUseMobileUI = isMobileView;
  const shouldUseTabletUI = isTabletView;
  const shouldUseDesktopUI = isDesktopView;

  const value: MobileContextValue = {
    device,
    touch,
    viewport,
    isMobileView,
    isTabletView,
    isDesktopView,
    shouldUseMobileUI,
    shouldUseTabletUI,
    shouldUseDesktopUI,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

/**
 * Hook để truy cập Mobile Context
 */
export function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
}
