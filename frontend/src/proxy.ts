import { NextRequest, NextResponse } from "next/server";

// Convenience-only guard. FastAPI validates the signed JWT and workspace on every data request.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("safesphere_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
