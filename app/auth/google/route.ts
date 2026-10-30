import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeReturnTo } from "@/lib/safe-redirect";

// Step 1 of "Continue with Google": remember a random state (CSRF protection)
// and where to return to, then send the browser to Google's consent screen.
export function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error("google sign-in failed: GOOGLE_CLIENT_ID missing");
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  const next = safeReturnTo(request.nextUrl.searchParams.get("next"));
  const state = randomBytes(24).toString("base64url");
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/auth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  response.cookies.set("cg_oauth", JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax", // must survive the top-level redirect back from Google
    secure: process.env.NODE_ENV === "production",
    path: "/auth/google",
    maxAge: 10 * 60,
  });
  return response;
}
