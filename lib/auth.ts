import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME, type SessionUser } from "@/lib/session-token";

export { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME, type SessionUser };

export function setAuthCookie(res: NextResponse, email: string, name?: string): NextResponse {
  const token = createSessionToken({ email: email.trim().toLowerCase(), name });
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge,
  });

  return res;
}

export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set({
    name: "next-auth.session-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set({
    name: "__Secure-next-auth.session-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export async function getAuthenticatedUserEmail(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const session = verifySessionToken(token);
      if (session?.email) {
        return session.email.trim().toLowerCase();
      }
    }

    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      return nextAuthSession.user.email.trim().toLowerCase();
    }
  } catch (err) {
    console.error("Error retrieving authenticated user email:", err);
  }
  return null;
}
