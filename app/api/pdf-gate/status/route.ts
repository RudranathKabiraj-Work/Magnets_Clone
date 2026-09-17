import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cookie name pattern must match verify-code route exactly
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const magnetId = (searchParams.get("magnetId") || "").trim();

    if (!magnetId) {
      return NextResponse.json({ unlocked: false, error: "Missing magnetId." }, { status: 400 });
    }

    const cookieValue = req.cookies.get(cookieName(magnetId))?.value;
    const unlocked = cookieValue === "1";

    return NextResponse.json({ unlocked });
  } catch (err: any) {
    console.error("[pdf-gate/status] Error:", err);
    return NextResponse.json({ unlocked: false }, { status: 500 });
  }
}
