import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("safesphere_session");
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/scans") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!hasSession && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/posts/:path*",
    "/scans/:path*",
    "/cases/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
