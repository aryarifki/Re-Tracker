import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isApproved = req.nextauth.token?.is_approved;
    const path = req.nextUrl.pathname;

    // Jika user SUDAH login tapi BELUM di-approve, arahkan ke /pending
    if (!isApproved && path !== "/pending" && path !== "/login") {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    
    // Jika user SUDAH di-approve dan mencoba masuk ke halaman /pending, kembalikan ke home (/)
    if (isApproved && path === "/pending") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Izinkan akses middleware jika token (sesi) valid
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Lindungi semua halaman KECUALI route autentikasi API, login, dan file statis (logo, fonts, js)
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|api/auth|logo.png).*)"
  ],
};
