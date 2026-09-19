import { NextRequest, NextResponse } from "next/server";
import { verifyPdfUnlockToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";

// Cookie name pattern must match verify-code route exactly
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const magnetId = (searchParams.get("magnetId") || "").trim();
    const queryToken = (searchParams.get("token") || "").trim();

    if (!magnetId) {
      return NextResponse.json({ unlocked: false, error: "Missing magnetId." }, { status: 400 });
    }

    const resetParam = searchParams.get("reset") === "1";
    if (resetParam) {
      const res = NextResponse.json({ unlocked: false });
      res.cookies.set(cookieName(magnetId), "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return res;
    }

    const cookieValue = req.cookies.get(cookieName(magnetId))?.value;
    const tokenToVerify = queryToken || cookieValue || "";

    if (!tokenToVerify) {
      return NextResponse.json({ unlocked: false });
    }

    // Support legacy "1" cookie for backwards compatibility during session migration
    if (tokenToVerify === "1") {
      return NextResponse.json({ unlocked: true });
    }

    const payload = verifyPdfUnlockToken(tokenToVerify);
    const unlocked = !!(payload && (payload.magnetId === magnetId || !payload.magnetId));

    return NextResponse.json({
      unlocked,
      email: payload?.email,
      pdfPages: payload?.pdfPages || [],
    });
  } catch (err: any) {
    console.error("[pdf-gate/status] Error:", err);
    return NextResponse.json({ unlocked: false }, { status: 500 });
  }
}
