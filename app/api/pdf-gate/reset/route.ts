import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const magnetId = (body.magnetId || "").trim();

    if (!magnetId) {
      return NextResponse.json({ error: "Missing magnetId." }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });

    // Clear httpOnly cookie on server side
    res.cookies.set(cookieName(magnetId), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("[pdf-gate/reset] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
