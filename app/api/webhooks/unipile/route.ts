import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { syncUserLinkedInComments } from "@/lib/linkedin-automation";

export const dynamic = "force-dynamic";

/**
 * Handles Unipile inbound Webhook events:
 * e.g., account_created, account_status, new_message, new_comment, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    await dbConnect();
    const event = body.event || body.type;
    const accountId = body.account_id || body.id || body.accountId;
    const queryEmail = req.nextUrl.searchParams.get("userEmail");
    const custom = body.custom || body.state || {};
    const userEmail = queryEmail || custom.userEmail || body.email || body.name;

    let targetAccount = null;

    if (userEmail && accountId) {
      const updateData: Record<string, any> = {
        linkedinConnected: true,
        linkedinAccountId: accountId,
        linkedinAccountName: body.name || body.account_name || "LinkedIn Connected User",
        linkedinProfileId: body.provider_id || body.user_id || "",
      };
      const img = body.profile_picture_url || body.avatar_url || body.avatar || body.picture_url;
      if (img) updateData.linkedinProfileImage = img;

      targetAccount = await AccountModel.findOneAndUpdate(
        { email: userEmail.trim().toLowerCase() },
        { $set: updateData },
        { new: true }
      );
      console.log(`[Unipile Webhook] Linked LinkedIn account ${accountId} to ${userEmail}`);
    } else if (accountId) {
      targetAccount = await AccountModel.findOne({ linkedinAccountId: accountId });
    }

    // If account found, trigger comment sync in background
    if (targetAccount && targetAccount.linkedinConnected) {
      syncUserLinkedInComments(targetAccount).catch((err) => {
        console.error("[Unipile Webhook Background Sync Error]:", err);
      });
    }

    return NextResponse.json({ success: true, event, accountId });
  } catch (err: any) {
    console.error("[Unipile Webhook Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

