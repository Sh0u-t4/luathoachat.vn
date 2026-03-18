// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MAINTENANCE MODE
 * true  = bật bảo trì — chỉ admin được vào, còn lại thấy trang bảo trì
 * false = tắt bảo trì — mọi người đều vào được bình thường
 */
const MAINTENANCE_MODE = true;

// Supabase project ref từ URL
const SUPABASE_URL = 'https://yybzsgbqbksctdblynlm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_REF = 'yybzsgbqbksctdblynlm';

// Paths không cần check (static assets, API routes, trang bảo trì)
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
  '/api/', // API routes tự có auth — không chặn ở middleware
];

/**
 * Decode JWT payload (không verify chữ ký — chỉ dùng để lấy user_id)
 * Server-side validation vẫn diễn ra ở API routes
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Lấy access_token từ Supabase auth cookie
 */
function extractAccessToken(request: NextRequest): string | null {
  // Thử các tên cookie phổ biến của Supabase
  const cookieNames = [
    `sb-${PROJECT_REF}-auth-token`,
    'sb-access-token',
    'supabase-auth-token',
  ];

  for (const name of cookieNames) {
    const cookie = request.cookies.get(name);
    if (!cookie) continue;
    try {
      // Cookie có thể là JSON array "[accessToken, refreshToken]"
      const parsed = JSON.parse(cookie.value);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
      if (parsed.access_token) return parsed.access_token;
      if (typeof parsed === 'string') return parsed;
    } catch {
      // Hoặc trực tiếp là token string
      if (cookie.value.includes('.')) return cookie.value;
    }
  }
  return null;
}

/**
 * Kiểm tra user có phải admin không — gọi Supabase REST API
 */
async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=role&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.[0]?.role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Nếu không bật bảo trì — cho qua hết
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Bypass paths cố định
  const isBypassed = BYPASS_PATHS.some((p) => pathname.startsWith(p));
  if (isBypassed) {
    return NextResponse.next();
  }

  // Kiểm tra session admin
  const accessToken = extractAccessToken(request);
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    const userId = payload?.sub as string | undefined;

    if (userId) {
      const admin = await isAdminUser(userId);
      if (admin) {
        // Admin — cho qua bình thường
        return NextResponse.next();
      }
    }
  }

  // Không phải admin — chuyển đến trang bảo trì
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
