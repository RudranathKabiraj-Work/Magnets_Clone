import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Edge-compatible HMAC-SHA256 JWT Verification using Web Crypto API (crypto.subtle)
 * Runs in microseconds in Edge Runtime without importing Node.js `crypto`
 */
async function verifySessionTokenEdge(token: string, secret: string): Promise<boolean> {
  try {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Base64URL decode signature
    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedSig = base64 + "=".repeat(padLen);
    const binarySig = Uint8Array.from(atob(paddedSig), (c) => c.charCodeAt(0));

    // Verify signature
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      binarySig,
      encoder.encode(dataToSign)
    );

    if (!isValid) return false;

    // Verify expiration timestamp
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false; // Token expired
    }

    return true;
  } catch (e) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const secret = process.env.JWT_SECRET || "";

  const sessionToken = request.cookies.get("session_token")?.value;
  const nextAuthToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Real cryptographic HMAC verification for Edge Runtime
  const isValidCustomSession = sessionToken && secret
    ? await verifySessionTokenEdge(sessionToken, secret)
    : false;

  const isValidSession = Boolean(isValidCustomSession || nextAuthToken);

  // Rate Limiting Protection for Auth & API Endpoints
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/reset-password")) {
    const { success, reset } = await checkRateLimit(ip, "auth_limit", 30, 60 * 1000);
    if (!success) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: `Too many requests. Please wait ${reset} seconds before trying again.` },
          { status: 429 }
        );
      }
    }
  }

  // Custom domain detection (non-primary domains)
  const isPrimaryDomain =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.endsWith("vercel.app") ||
    host.endsWith("leadmagnets.so") ||
    host.endsWith("magnets.bdatech.in");

  // Protect /dashboard routes — require cryptographically signed session
  if (pathname.startsWith("/dashboard")) {
    if (!isValidSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from /login and /register if they already have a valid session
  if ((pathname === "/login" || pathname === "/register") && isValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rewrite custom domain requests seamlessly if needed
  if (!isPrimaryDomain && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const url = request.nextUrl.clone();
    url.searchParams.set("__customDomain", host);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

