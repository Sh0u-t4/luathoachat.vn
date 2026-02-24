import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/lib/i18n/context';
import { ChatProvider } from '@/components/chat/chat-context';
import { AuthProvider } from '@/lib/auth/context';
import { MobileProvider } from '@/lib/mobile/context';
import { ErrorBoundary } from '@/components/error-boundary';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://luathoachat.vn'),
  title: {
    default: 'LuatHoaChat.vn - Trợ Lý AI Luật Hóa Chất & Môi Trường Việt Nam 2026',
    template: '%s | LuatHoaChat.vn',
  },
  description: 'Trợ lý AI tư vấn pháp luật hóa chất Việt Nam. Tra cứu danh mục hóa chất theo Nghị định 24/2026, tính khoảng cách an toàn theo Nghị định 25/2026, khai báo nhập khẩu theo Nghị định 26/2026. Cập nhật Luật Hóa chất 69/2025.',
  keywords: [
    // Vietnamese keywords
    'luật hóa chất việt nam',
    'nghị định 113/2017',
    'nghị định 24/2026',
    'giấy phép hóa chất',
    'msds tiếng việt',
    'nhãn ghs',
    'an toàn hóa chất',
    'xử phạt hóa chất',
    'tiền chất công nghiệp',
    'khai báo hóa chất',
    // English keywords
    'vietnam chemical law',
    'chemical permit vietnam',
    'msds vietnam',
    'ghs labels',
    'chemical compliance',
    'decree 113/2017',
    'chemical safety vietnam',
    'precursor chemicals',
    'chemical declaration',
  ],
  authors: [{ name: 'LuatHoaChat.vn' }],
  creator: 'LuatHoaChat.vn',
  publisher: 'LuatHoaChat.vn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://luathoachat.vn',
    languages: {
      'vi-VN': 'https://luathoachat.vn',
      'en-US': 'https://luathoachat.vn/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: 'en_US',
    url: 'https://luathoachat.vn',
    siteName: 'LuatHoaChat.vn',
    title: 'LuatHoaChat.vn - Trợ Lý AI Luật Hóa Chất Việt Nam',
    description: 'Nền tảng AI hỗ trợ tuân thủ Luật Hóa chất Việt Nam. Tra cứu danh mục, MSDS, nhãn GHS, hướng dẫn giấy phép.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LuatHoaChat.vn - Trợ Lý AI Luật Hóa Chất Việt Nam',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuatHoaChat.vn - Trợ Lý AI Luật Hóa Chất',
    description: 'Trợ lý AI tư vấn pháp luật hóa chất Việt Nam, MSDS, nhãn GHS',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://luathoachat.vn/#website',
        url: 'https://luathoachat.vn',
        name: 'LuatHoaChat.vn',
        description: 'Trợ Lý AI Luật Hóa Chất & Môi Trường Việt Nam',
        inLanguage: ['vi-VN', 'en-US'],
        publisher: {
          '@id': 'https://luathoachat.vn/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://luathoachat.vn/?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://luathoachat.vn/#organization',
        name: 'LuatHoaChat.vn',
        alternateName: 'Nền tảng Luật Hóa Chất Việt Nam',
        url: 'https://luathoachat.vn',
        logo: {
          '@type': 'ImageObject',
          url: 'https://luathoachat.vn/logo.png',
          width: 512,
          height: 512,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+84-xxx-xxx-xxx',
          contactType: 'hỗ trợ khách hàng',
          areaServed: 'VN',
          availableLanguage: ['Tiếng Việt', 'English'],
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://luathoachat.vn/#faq',
        inLanguage: 'vi-VN',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Axit HCl cần giấy phép gì?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Axit Clohydric (HCl) cần Giấy phép kinh doanh hóa chất theo Nghị định 113/2017/NĐ-CP. Mức phạt từ 50-100 triệu VNĐ nếu không có giấy phép.',
            },
          },
          {
            '@type': 'Question',
            name: 'What permits are required for HCl acid?',
            inLanguage: 'en-US',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Hydrochloric acid (HCl) requires a Chemical Business License according to Decree 113/2017/ND-CP. Penalties range from 50-100 million VND if operating without a permit.',
            },
          },
          {
            '@type': 'Question',
            name: 'Mức phạt vi phạm lưu trữ hóa chất là bao nhiêu?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Mức phạt vi phạm quy định lưu trữ hóa chất từ 30-200 triệu VNĐ tùy theo mức độ nghiêm trọng, theo Nghị định 71/2019/NĐ-CP.',
            },
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'LuatHoaChat.vn Trợ Lý AI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
        },
      },
    ],
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Favicon - Scale balance icon representing justice and chemical law */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" hrefLang="vi" href="https://luathoachat.vn" />
        <link rel="alternate" hrefLang="en" href="https://luathoachat.vn/en" />
        <link rel="alternate" hrefLang="x-default" href="https://luathoachat.vn" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        {/* Google Ads Conversion Tracking */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17948518438"
          strategy="afterInteractive"
        />
        <Script id="google-ads-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17948518438');
          `}
        </Script>

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-43DD3M8BC2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-43DD3M8BC2');
          `}
        </Script>

        {/* Chunk Load Error Handler */}
        <Script id="chunk-error-handler" strategy="afterInteractive">
          {`
            window.addEventListener('error', function(e) {
              const isChunkError = e.message && (
                e.message.includes('Loading chunk') ||
                e.message.includes('Failed to fetch dynamically imported module') ||
                e.message.includes('webpack')
              );

              if (isChunkError) {
                console.warn('[ChunkLoadError] Detected, reloading page...');
                sessionStorage.setItem('chunk_error_reload', 'true');
                setTimeout(function() {
                  window.location.reload();
                }, 1500);
              }
            }, true);

            window.addEventListener('DOMContentLoaded', function() {
              const hadError = sessionStorage.getItem('chunk_error_reload');
              if (hadError) {
                sessionStorage.removeItem('chunk_error_reload');
                console.log('[ChunkLoadError] Page reloaded successfully');
              }
            });
          `}
        </Script>

        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <MobileProvider>
            <LanguageProvider>
              <AuthProvider>
                <ChatProvider>
                  {children}
                </ChatProvider>
              </AuthProvider>
            </LanguageProvider>
          </MobileProvider>
        </ErrorBoundary>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
