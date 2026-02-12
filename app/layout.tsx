import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/lib/i18n/context';
import { ChatProvider } from '@/components/chat/chat-context';
import { AuthProvider } from '@/lib/auth/context';

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" hrefLang="vi" href="https://luathoachat.vn" />
        <link rel="alternate" hrefLang="en" href="https://luathoachat.vn/en" />
        <link rel="alternate" hrefLang="x-default" href="https://luathoachat.vn" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17948518438"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17948518438');
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <LanguageProvider>
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
        </LanguageProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
