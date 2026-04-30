import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This proxy protects the admin route
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and API routes
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // Check if user is authenticated (you can use cookies, sessions, or JWT)
    // For now, we'll use a simple cookie-based check
    const isAuthenticated = request.cookies.get("admin-auth")?.value === "true";

    if (!isAuthenticated) {
      // Redirect to login page with the original URL as a redirect parameter
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
