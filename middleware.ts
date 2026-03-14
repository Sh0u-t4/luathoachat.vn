// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MAINTENANCE MODE
 * true  = bật bảo trì (khoá toàn bộ website)
 * false = tắt bảo trì (website hoạt động bình thường)
 *
 * Dự kiến trở lại: 01/04/2026
 */
const MAINTENANCE_MODE = true;

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

  const isBypassed = BYPASS_PATHS.some((p) => pathname.startsWith(p));
  if (isBypassed) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/_next') || pathname === '/api/health') {
    return NextResponse.next();
  }

  const maintenanceUrl = new URL('/bao-tri', request.url);
  const response = NextResponse.redirect(maintenanceUrl, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, must-revalidate');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
