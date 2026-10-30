import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeReturnTo } from "@/lib/safe-redirect";

// Step 2: Google sends the browser back here with a one-time code. We check the
// state, swap the code for the user's verified profile, then start the same
// database-backed session that password sign-in uses.

type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function sameState(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const fail = (reason: string) => {
    console.error("google sign-in failed:", reason);
    const response = NextResponse.redirect(new URL("/login?error=google", request.url));
    response.cookies.delete({ name: "cg_oauth", path: "/auth/google" });
    return response;
  };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!clientId || !clientSecret) return fail("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing");
  if (!code || !state) {
    return fail(`no code/state from Google (error=${request.nextUrl.searchParams.get("error")})`);
  }

  let saved: { state?: string; next?: string };
  try {
    saved = JSON.parse(request.cookies.get("cg_oauth")?.value ?? "");
  } catch {
    return fail("state cookie missing (open /login and the callback on the same host)");
  }
  if (typeof saved.state !== "string" || !sameState(saved.state, state)) {
    return fail("state mismatch");
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/auth/google/callback`;

  let profile: GoogleProfile;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      return fail(`token exchange ${tokenResponse.status}: ${await tokenResponse.text()}`);
    }
    const { access_token } = (await tokenResponse.json()) as { access_token?: string };
    if (!access_token) return fail("no access_token");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileResponse.ok) return fail(`userinfo ${profileResponse.status}`);
    profile = (await profileResponse.json()) as GoogleProfile;
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const email = profile.email?.trim().toLowerCase();
  if (!email || profile.email_verified !== true) return fail("email missing or unverified");

  let user = await prisma.user.findUnique({ where: { email } });
  if (user?.role === "ADMIN") return fail("admin account"); // admins sign in with their password only
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: (profile.name?.trim() || email.split("@")[0]).slice(0, 100),
        email,
        // Not a valid scrypt hash, so password sign-in can never match it.
        passwordHash: "google$",
        role: "CUSTOMER",
      },
    });
  }

  await createSession(user.id);
  const response = NextResponse.redirect(new URL(safeReturnTo(saved.next), request.url));
  response.cookies.delete({ name: "cg_oauth", path: "/auth/google" });
  return response;
}
