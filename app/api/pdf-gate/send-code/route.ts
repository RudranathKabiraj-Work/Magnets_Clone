import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { sendMail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { PdfOtpModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// OTP expires in 10 minutes
const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: max 5 send-code attempts per IP per 15 minutes ────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = await checkRateLimit(ip, "pdf_send_code", 5, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: { email?: string; magnetId?: string; name?: string; customFields?: Record<string, any> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const magnetId = (body.magnetId || "").trim();
    const name = (body.name || "").trim();
    const customFields = body.customFields || {};

    if (!email || !magnetId) {
      return NextResponse.json({ error: "Email and magnetId are required." }, { status: 400 });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await dbConnect();

    // ── Clean up any old unused OTPs for this email+magnet ────────────────
    await PdfOtpModel.deleteMany({ email, magnetId, used: false }).catch(() => {});

    // ── Create new OTP record ─────────────────────────────────────────────
    const code = generateOtp();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PdfOtpModel.create({ email, magnetId, code, token, expiresAt, used: false, name, customFields });

    // ── Send email ────────────────────────────────────────────────────────
    // IMPORTANT: sendMail() returns { success, error } — it does NOT throw.
    // We must check the return value explicitly.
    const mailResult = await sendMail({
      to: email,
      subject: "Your access code",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
          <p style="font-size:15px;color:#3f3f46;margin:0 0 24px;">Here is your 6-digit access code:</p>
          <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:0.2em;color:#09090b;font-family:monospace;">${code}</span>
          </div>
          <p style="font-size:13px;color:#71717a;margin:0;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    if (!mailResult.success) {
      console.error("[pdf-gate/send-code] Email send failed:", mailResult.error);
      // Clean up the OTP record so the user can retry
      await PdfOtpModel.deleteOne({ token }).catch(() => {});
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, token });

  } catch (err: any) {
    console.error("[pdf-gate/send-code] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
