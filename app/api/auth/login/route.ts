import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normEmail = email.trim().toLowerCase();

    // Ensure database connection
    try {
      await dbConnect();
      let account = await AccountModel.findOne({ email: normEmail });
      if (!account) {
        account = await AccountModel.create({
          email: normEmail,
          name: name || normEmail.split("@")[0],
          username: normEmail.split("@")[0],
          plan: "Free",
          joinedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
      }
    } catch (dbErr) {
      console.warn("Database connection warning during login:", dbErr);
    }

    const response = NextResponse.json({ success: true, email: normEmail });
    setAuthCookie(response, normEmail, name);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log in" }, { status: 500 });
  }
}
