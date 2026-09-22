import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, MagnetPageModel, SequenceModel, AccountModel } from "@/lib/models";
import { sendMail } from "@/lib/email";

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
    const querySecret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret && !vercelCronHeader) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await dbConnect();

    // 2. Fetch active leads with sequences attached (chronologically sorted, scaled batch size)
    const activeLeads = await LeadModel.find({
      status: { $ne: "stopped" },
      sequenceStep: { $exists: true, $ne: "" },
    })
      .sort({ signedUpAt: 1 })
      .limit(1000);

    let processedCount = 0;
    let deliveredCount = 0;
    const now = new Date().getTime();
    const debugLogs: any[] = [];

    // 3. Pre-fetch all unique magnet pages in ONE query instead of one-per-lead.
    const uniquePageIds = Array.from(
      new Set(activeLeads.map((l) => l.pageId).filter((id): id is string => Boolean(id)))
    );
    const uniquePageNames = Array.from(
      new Set(activeLeads.map((l) => l.page).filter((n): n is string => Boolean(n)))
    );

    const pageDocs = await MagnetPageModel.find({
      $or: [
        ...(uniquePageIds.length > 0 ? [{ id: { $in: uniquePageIds } }] : []),
        ...(uniquePageNames.length > 0 ? [{ name: { $in: uniquePageNames } }] : []),
      ],
    }).lean();

    const uniqueOwnerEmails = Array.from(
      new Set([
        ...pageDocs.map((p) => p.userEmail).filter(Boolean),
        ...activeLeads.map((l) => l.userEmail).filter(Boolean),
      ])
    );

    const accountDocs = await AccountModel.find({
      email: { $in: uniqueOwnerEmails.map((e) => e.toLowerCase().trim()) },
    }).lean();

    const accountByEmail = new Map(accountDocs.map((a) => [a.email.toLowerCase().trim(), a]));

    // Build O(1) lookup maps so the loop never touches the database for pages
    const pageById = new Map(pageDocs.filter((p) => p.id).map((p) => [p.id, p]));
    const pageByName = new Map(pageDocs.filter((p) => p.name).map((p) => [p.name, p]));

    for (const lead of activeLeads) {
      if (!lead.pageId && !lead.page) {
        debugLogs.push({ email: lead.email, reason: "No pageId or page" });
        continue;
      }

      // Map lookup — zero DB calls
      const pageDoc = (lead.pageId ? pageById.get(lead.pageId) : null) ??
        (lead.page ? pageByName.get(lead.page) : null) ??
        null;

      if (!pageDoc) {
        debugLogs.push({ email: lead.email, page: lead.page, pageId: lead.pageId, reason: "Page doc not found in DB" });
        continue;
      }

      const ownerEmail = (pageDoc.userEmail || lead.userEmail || "").toLowerCase().trim();
      const ownerAccount = accountByEmail.get(ownerEmail) || null;

      if (!pageDoc.sequenceEmails || pageDoc.sequenceEmails.length === 0) {
        debugLogs.push({ email: lead.email, pageName: pageDoc.name, reason: "No sequenceEmails on page doc", sequenceEmailsCount: pageDoc.sequenceEmails?.length || 0 });
        continue;
      }

      const sequenceEmails = pageDoc.sequenceEmails;
      const cleanDateStr = typeof lead.signedUpAt === "string"
        ? lead.signedUpAt.replace(/\s+at\s+/i, " ")
        : lead.signedUpAt;
      let signupTime = new Date(cleanDateStr).getTime();
      if (isNaN(signupTime) && (lead as any).createdAt) {
        signupTime = new Date((lead as any).createdAt).getTime();
      }

      if (isNaN(signupTime)) {
        debugLogs.push({ email: lead.email, signedUpAt: lead.signedUpAt, reason: "Invalid signedUpAt date string" });
        continue;
      }

      const elapsedMinutes = Math.floor((now - signupTime) / (1000 * 60));

      // Determine next email index based on lead.sequenceStep
      if (lead.sequenceStep?.toLowerCase().includes("completed")) {
        debugLogs.push({ email: lead.email, sequenceStep: lead.sequenceStep, reason: "Lead sequence completed" });
        continue;
      }

      // Parse step number (e.g., "Step 1 of 1" -> step 1 -> index 0)
      const currentStepMatch = lead.sequenceStep?.match(/Step\s+(\d+)/i);
      const currentStepNum = currentStepMatch ? parseInt(currentStepMatch[1], 10) : 1;
      const nextEmailIndex = currentStepNum - 1; // 0-indexed: Step 1 is index 0

      if (nextEmailIndex < 0 || nextEmailIndex >= sequenceEmails.length) {
        debugLogs.push({ email: lead.email, currentStepNum, nextEmailIndex, totalEmails: sequenceEmails.length, reason: "Step index out of bounds" });
        continue;
      }

      const nextEmail = sequenceEmails[nextEmailIndex];
      const targetCumulativeMinutes = sequenceEmails
        .slice(0, nextEmailIndex + 1)
        .reduce((sum: number, item: any) => sum + (Number(item.delayMinutes) || 0), 0);

      if (elapsedMinutes < targetCumulativeMinutes) {
        debugLogs.push({ email: lead.email, elapsedMinutes, targetCumulativeMinutes, reason: "Cumulative delay time not yet reached" });
        continue;
      }

      processedCount++;

      const formattedSubject = (nextEmail.subject || `Follow-up on ${pageDoc.name}`)
        .replace(/\{name\}/gi, lead.name || "there");

      let rawBody = (nextEmail.body || `Hi {name},\n\nJust checking in to see if you had a chance to look at ${pageDoc.name}! Let me know if you have any questions.\n\nBest regards`)
        .replace(/\{name\}/gi, lead.name || "there")
        .replace(/\{email\}/gi, lead.email || "");

      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
      let formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

      // Auto-convert standalone YouTube links into clickable video cards
      formattedBodyHtml = formattedBodyHtml.replace(
        /(?<!href=["'])(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/g,
        (_match: string, url: string, ytId: string) => {
          const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          return `<div style="text-align: center; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumb}" alt="Watch Video on YouTube" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a><br/><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066B2; font-weight: 600; text-decoration: underline;">▶ Watch Video on YouTube</a></div>`;
        }
      );

      const brandColor = ownerAccount?.brandColor || "#0066B2";
      const senderName = ownerAccount?.senderDisplayName || ownerAccount?.name || "LeadMagnets";
      const defaultFrom = process.env.SMTP_FROM || "non-reply@bdatech.in";
      const accessUrl = `${req.nextUrl.origin}/r/${pageDoc.id}`;

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">
              ${formattedSubject}
            </h2>
            <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              ${formattedBodyHtml}
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${accessUrl}" style="background-color: ${brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 102, 178, 0.25);">
                📥 Access Resource →
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
              Sent by ${senderName} · <a href="${accessUrl}" style="color: #64748b; text-decoration: underline;">Access Deliverable</a>
            </p>
          </div>
        </div>
      `;

      const sendResult = await sendMail({
        to: lead.email.trim(),
        from: `${senderName} <${defaultFrom}>`,
        subject: formattedSubject,
        html: htmlBody,
      });

      if (sendResult.success) {
        deliveredCount++;
      }

      // Advance lead to next sequence step in MongoDB
      const updatedStepNum = nextEmailIndex + 2; // Step number for the upcoming email
      if (nextEmailIndex + 1 >= sequenceEmails.length) {
        lead.sequenceStep = "Completed";
        lead.status = "completed";
      } else {
        lead.sequenceStep = `Step ${updatedStepNum} of ${sequenceEmails.length} (In Progress)`;
        lead.status = "delivered";
      }
      await lead.save();
      debugLogs.push({ email: lead.email, status: "SUCCESS", emailSubject: nextEmail.subject });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeLeadsChecked: activeLeads.length,
      processedCount,
      deliveredCount,
      debugLogs,
    });
  } catch (error: any) {
    console.error("Sequence Cron Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
