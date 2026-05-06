import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/app/lib/auth/adminSession";

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/webhooks",
  "/api/summer-registration",
];

const ADMIN_API_PREFIXES = [
  "/api/users",
  "/api/checkin",
  "/api/summer-registrants",
];

function isPublicCatalogRead(pathname: string, method: string) {
  if (method !== "GET") return false;

  return (
    pathname === "/api/events" ||
    pathname.startsWith("/api/events/") ||
    pathname === "/api/ticket-tiers" ||
    pathname.startsWith("/api/ticket-tiers/") ||
    pathname === "/api/coupons" ||
    pathname.startsWith("/api/coupons/")
  );
}

function isProtectedApi(pathname: string, method: string) {
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  if (ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (isPublicCatalogRead(pathname, method)) {
    return false;
  }

  if (
    pathname === "/api/events" ||
    pathname.startsWith("/api/events/") ||
    pathname === "/api/ticket-tiers" ||
    pathname.startsWith("/api/ticket-tiers/") ||
    pathname === "/api/coupons" ||
    pathname.startsWith("/api/coupons/")
  ) {
    return true;
  }

  if (pathname === "/api/orders") {
    return method === "GET";
  }

  if (pathname.startsWith("/api/orders/")) {
    return true;
  }

  // Checkout currently calls this after successful payment. Keep public until
  // ticket delivery moves server-side into the order/payment flow.
  if (pathname === "/api/send-tickets") {
    return false;
  }

  return false;
}

function unauthorizedApi() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const protectsAdminPage = pathname.startsWith("/admin");
  const protectsApi = pathname.startsWith("/api") && isProtectedApi(pathname, request.method);

  if (!protectsAdminPage && !protectsApi) {
    return NextResponse.next();
  }

  const session = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (session) {
    return NextResponse.next();
  }

  return protectsApi ? unauthorizedApi() : redirectToLogin(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};