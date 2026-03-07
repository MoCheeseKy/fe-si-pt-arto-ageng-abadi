import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika user sudah login tapi mencoba mengakses halaman /login, kembalikan ke /overview
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  // 2. Tentukan route mana saja yang bersifat publik (boleh diakses tanpa token)
  const publicRoutes = ['/login', '/api/auth/signin', '/api/auth/signout'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // 3. Jangan blokir akses ke aset Next.js (gambar, css, js)
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|svg|jpg|jpeg|gif|ico)$/);

  // 4. Jika bukan rute publik, bukan aset statis, dan TIDAK ADA token, blokir dan redirect ke login
  if (!isPublicRoute && !isStaticAsset && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Lanjutkan request jika aman
  return NextResponse.next();
}

// Konfigurasi Matcher agar proxy berjalan di semua route
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
