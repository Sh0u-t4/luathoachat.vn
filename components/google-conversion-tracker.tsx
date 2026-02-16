'use client';

import { useEffect } from 'react';

/**
 * Google Ads Conversion Tracker
 * Component này tự động trigger conversion event khi trang được load
 *
 * Conversion Label: owf2CIj7jfcbEKbQwu5C (Lượt xem trang)
 */
export function GoogleConversionTracker({
  conversionLabel = 'owf2CIj7jfcbEKbQwu5C',
  value = 1.0,
  currency = 'VND',
  disabled = false,
}: {
  conversionLabel?: string;
  value?: number;
  currency?: string;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (disabled) return;

    // Đợi gtag được load
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          send_to: `AW-17948518438/${conversionLabel}`,
          value: value,
          currency: currency,
        });
        console.log('[Google Ads] Conversion tracked:', conversionLabel);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversionLabel, value, currency, disabled]);

  return null;
}

/**
 * Hook để trigger manual conversion tracking
 */
export function useGoogleConversion() {
  const trackConversion = (
    conversionLabel: string,
    value = 1.0,
    currency = 'VND'
  ) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: `AW-17948518438/${conversionLabel}`,
        value: value,
        currency: currency,
      });
      console.log('[Google Ads] Manual conversion tracked:', conversionLabel);
    }
  };

  return { trackConversion };
}

/**
 * Predefined conversion labels
 * Cập nhật các label này từ Google Ads UI
 */
export const CONVERSION_LABELS = {
  // Lượt xem trang (Page View) - Đã có từ Google Ads
  PAGE_VIEW: 'owf2CIj7jfcbEKbQwu5C',

  // Các conversion khác - Cần tạo trong Google Ads UI
  SIGN_UP: 'SIGN_UP_LABEL', // Thay bằng label thực tế
  LOGIN: 'LOGIN_LABEL', // Thay bằng label thực tế
  CONTACT_SUBMIT: 'CONTACT_LABEL', // Thay bằng label thực tế
  MSDS_DOWNLOAD: 'DOWNLOAD_LABEL', // Thay bằng label thực tế
};
