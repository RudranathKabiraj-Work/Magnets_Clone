import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";

/**
 * Handles Unipile inbound Webhook events:
 * e.g., account_created, account_status, new_message, new_comment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    await dbConnect();
    const event = body.event || body.type;
    const accountId = body.account_id || body.id;
    const custom = body.custom || body.state || {};
    const userEmail = custom.userEmail || body.email;

    if (userEmail && accountId) {
      await AccountModel.updateOne(
        { email: userEmail.trim().toLowerCase() },
        {
          linkedinConnected: true,
          linkedinAccountId: accountId,
          linkedinAccountName: body.name || body.account_name || "LinkedIn Connected User",
          linkedinProfileId: body.provider_id || body.user_id || "",
        }
      );
    }

    return NextResponse.json({ success: true, event, accountId });
  } catch (err: any) {
    console.error("[Unipile Webhook Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
