import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { PdfOtpModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// Cookie name pattern: pdf_unlocked_{magnetId}
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

// 7-day unlock cookie
const UNLOCK_MAX_AGE = 7 * 24 * 60 * 60; // seconds

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: max 10 verify attempts per IP per minute ───────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = await checkRateLimit(ip, "pdf_verify_code", 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment." },
        { status: 429 }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: { email?: string; code?: string; token?: string; magnetId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const token = (body.token || "").trim();
    const magnetId = (body.magnetId || "").trim();

    if (!email || !code || !token || !magnetId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await dbConnect();

    // ── Find the OTP record ────────────────────────────────────────────────
    const otpRecord = await PdfOtpModel.findOne({ token, email, magnetId });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Code expired or invalid. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.used) {
      return NextResponse.json(
        { error: "This code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await PdfOtpModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: "Incorrect code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // ── Mark OTP as used ──────────────────────────────────────────────────
    otpRecord.used = true;
    await otpRecord.save();

    // ── Set secure unlock cookie ──────────────────────────────────────────
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName(magnetId), "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: UNLOCK_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("[pdf-gate/verify-code] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
