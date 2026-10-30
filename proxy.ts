import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// First, cheap gate for the admin area: requests without a session cookie never
// reach an admin page. This only checks that a cookie exists; every page and
// server action still verifies the session and the ADMIN role in the database.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has("cg_session")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
