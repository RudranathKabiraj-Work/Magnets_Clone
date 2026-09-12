import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, MagnetPageModel, SequenceModel } from "@/lib/models";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Endpoint: Multi-Day Email Sequence Processing Engine
 * 
 * Scheduled trigger: Runs automatically via vercel.json (e.g., every 15 minutes).
 * Security: Verifies Authorization header with CRON_SECRET or Vercel Cron Header.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Security Check: Protect cron endpoint against unauthorized external triggers
    const authHeader = req.headers.get("authorization");
    const vercelCronHeader = req.headers.get("x-vercel-cron");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !vercelCronHeader) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await dbConnect();
    const resendApiKey = process.env.RESEND_API_KEY;

    // 2. Fetch active leads with sequences attached
    const activeLeads = await LeadModel.find({
      status: { $ne: "stopped" },
      sequenceStep: { $exists: true, $ne: "" },
    }).limit(100);

    let processedCount = 0;
    let deliveredCount = 0;
    const now = new Date().getTime();

    for (const lead of activeLeads) {
      if (!lead.pageId && !lead.page) continue;

      // Find the associated magnet page or sequence
      const pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: lead.pageId }, { name: lead.page }],
      });

      if (!pageDoc || !pageDoc.sequenceEmails || pageDoc.sequenceEmails.length === 0) {
        continue;
      }

      const sequenceEmails = pageDoc.sequenceEmails;
      // Calculate how many minutes have passed since lead signed up
      const signupTime = new Date(lead.signedUpAt).getTime();
      if (isNaN(signupTime)) continue;

      const elapsedMinutes = Math.floor((now - signupTime) / (1000 * 60));

      // Parse current step number (e.g., "Step 1 of 3" -> index 0)
      const currentStepMatch = lead.sequenceStep?.match(/Step\s+(\d+)/i);
      const currentStepNum = currentStepMatch ? parseInt(currentStepMatch[1], 10) : 1;
      const nextEmailIndex = currentStepNum; // 0-indexed: Step 1 sent at signup, so Step 2 is index 1

      if (nextEmailIndex >= sequenceEmails.length) {
        // All sequence emails already delivered for this lead
        continue;
      }

      const nextEmail = sequenceEmails[nextEmailIndex];
      const targetDelayMinutes = Number(nextEmail.delayMinutes) || 0;

      // Check if enough time has elapsed to send the next sequence email
      if (elapsedMinutes >= targetDelayMinutes) {
        processedCount++;

        // Send email via Resend if API key is configured
        if (resendApiKey && resendApiKey.startsWith("re_")) {
          try {
            const htmlBody = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
                <h2 style="color: #0066B2;">${nextEmail.subject}</h2>
                <div style="font-size: 15px; line-height: 1.6; margin-top: 16px;">
                  ${nextEmail.body || `Hi ${lead.name || "there"},\n\nHere is your follow-up resource for ${pageDoc.name}.`}
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                  Sent via LeadMagnets Sequence Engine · <a href="${req.nextUrl.origin}/r/${pageDoc.id}" style="color: #64748b;">Access Deliverable</a>
                </p>
              </div>
            `;

            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "sequence@resend.dev",
                to: [lead.email.trim()],
                subject: nextEmail.subject,
                html: htmlBody,
              }),
            });

            if (resendRes.ok) {
              deliveredCount++;
            }
          } catch (sendErr) {
            console.error(`Failed to send sequence email to ${lead.email}:`, sendErr);
          }
        }

        // Advance lead to next sequence step in MongoDB
        const updatedStepNum = nextEmailIndex + 1;
        lead.sequenceStep = `Step ${updatedStepNum} of ${sequenceEmails.length}`;
        lead.status = "delivered";
        await lead.save();
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeLeadsChecked: activeLeads.length,
      processedCount,
      deliveredCount,
    });
  } catch (error: any) {
    console.error("Sequence Cron Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
