import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || !session.email) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let account = null;
    try {
      await dbConnect();
      account = await AccountModel.findOne({ email: session.email }).lean();
    } catch (e) {
      console.warn("Could not query DB for account in /api/auth/me:", e);
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      user: account || { email: session.email, name: session.name || session.email.split("@")[0] },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
