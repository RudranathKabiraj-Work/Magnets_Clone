import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const token =
    request.cookies.get("session_token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Rate Limiting Protection for Auth & API Endpoints
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/reset-password")) {
    const { success, reset } = checkRateLimit(ip, "auth_limit", 30, 60 * 1000);
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
    host.endsWith("leadmagnets.so");

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from /login and /register if they already have a session
  if ((pathname === "/login" || pathname === "/register") && token) {
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
