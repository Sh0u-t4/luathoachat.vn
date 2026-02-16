'use client';

import Script from 'next/script';

/**
 * Google Ads Tracking Component
 * Cài đặt Google tag (gtag.js) cho Google Ads
 * Conversion ID: AW-17948518438
 */
export function GoogleAdsTracking() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17948518438"
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17948518438');
        `}
      </Script>
    </>
  );
}

/**
 * Trigger Google Ads Conversion Event
 * Sử dụng function này để track các conversion events
 */
export function trackConversion(conversionLabel: string, value = 1.0, currency = 'VND') {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      send_to: `AW-17948518438/${conversionLabel}`,
      value: value,
      currency: currency,
    });
  }
}

/**
 * Predefined Conversion Events
 */
export const ConversionEvents = {
  // Lượt xem trang chính (Page View)
  PAGE_VIEW: 'owf2CIj7jfcbEKbQwu5C',

  // Đăng ký tài khoản thành công
  SIGN_UP: 'SIGN_UP_CONVERSION_LABEL', // Thay bằng label thực tế từ Google Ads

  // Đăng nhập thành công
  LOGIN: 'LOGIN_CONVERSION_LABEL', // Thay bằng label thực tế từ Google Ads

  // Submit form liên hệ
  CONTACT_SUBMIT: 'CONTACT_CONVERSION_LABEL', // Thay bằng label thực tế từ Google Ads

  // Tải tài liệu MSDS
  MSDS_DOWNLOAD: 'MSDS_DOWNLOAD_LABEL', // Thay bằng label thực tế từ Google Ads
};

/**
 * Track Page View Conversion
 */
export function trackPageViewConversion() {
  trackConversion(ConversionEvents.PAGE_VIEW, 1.0, 'VND');
}

/**
 * Track Sign Up Conversion
 */
export function trackSignUpConversion() {
  trackConversion(ConversionEvents.SIGN_UP, 1.0, 'VND');
}

/**
 * Track Login Conversion
 */
export function trackLoginConversion() {
  trackConversion(ConversionEvents.LOGIN, 1.0, 'VND');
}

/**
 * Track Contact Form Submission
 */
export function trackContactSubmission() {
  trackConversion(ConversionEvents.CONTACT_SUBMIT, 1.0, 'VND');
}

/**
 * Track MSDS Document Download
 */
export function trackMSDSDownload() {
  trackConversion(ConversionEvents.MSDS_DOWNLOAD, 1.0, 'VND');
}
