// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MAINTENANCE MODE
 * Kích hoạt: true = bật bảo trì (khoá toàn bộ website)
 *             false = tắt bảo trì (website hoạt động bình thường)
 *
 * Dự kiến trở lại: 01/04/2026
 */
const MAINTENANCE_MODE = true;

/** Đường dẫn không bị redirect (trang bảo trì + static assets) */
const BYPASS_PATHS = [
  '/bao-tri',
  '/_next',
  '/favicon',
  '/manifest',
  '/logo',
  '/og-image',
  '/apple-touch-icon',
  '/robots.txt',
  '/sitemap',
];

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Cho phép truy cập các đường dẫn miễn trừ
  const isBypassed = BYPASS_PATHS.some((p) => pathname.startsWith(p));
  if (isBypassed) {
    return NextResponse.next();
  }

  // Cho phép API routes nội bộ của Next.js
  if (pathname.startsWith('/api/_next') || pathname === '/api/health') {
    return NextResponse.next();
  }

  // Redirect tất cả route còn lại về trang bảo trì
  const maintenanceUrl = new URL('/bao-tri', request.url);
  const response = NextResponse.redirect(maintenanceUrl, { status: 302 });

  // Thêm header để tránh cache trang redirect
  response.headers.set('Cache-Control', 'no-store, must-revalidate');

  return response;
}

export const config = {
  /*
   * Áp dụng middleware cho mọi route,
   * ngoại trừ static files của Next.js (images, fonts, css, js)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
