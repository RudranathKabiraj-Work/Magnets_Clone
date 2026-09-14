import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, MagnetPageModel, SequenceModel } from "@/lib/models";

export const dynamic = "force-dynamic";

/**
 * Health Check Endpoint for Webhook Verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/booking",
    supportedProviders: ["Calendly", "Cal.com", "Custom Webhook"],
    message: "LeadMagnets Booking Webhook Engine is online",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Production Webhook Receiver for Calendly & Cal.com Booking Events
 * Automatically updates lead status to 'stopped' to pause follow-up sequences.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid or empty JSON payload" }, { status: 400 });
    }

    // Extract potential email addresses from various payload formats
    const emailsToProcess: string[] = [];

    // 1. Calendly payload parsing (e.g. invitee.created)
    if (body.event === "invitee.created" || body.event === "invitee.canceled" || body.payload) {
      const payload = body.payload || body;
      if (payload.email) emailsToProcess.push(payload.email);
      if (payload.invitee?.email) emailsToProcess.push(payload.invitee.email);
      if (payload.new_invitee?.email) emailsToProcess.push(payload.new_invitee.email);
      if (payload.resource?.email) emailsToProcess.push(payload.resource.email);
      if (Array.isArray(payload.questions_and_answers)) {
        for (const qa of payload.questions_and_answers) {
          if (qa.answer && typeof qa.answer === "string" && qa.answer.includes("@")) {
            emailsToProcess.push(qa.answer);
          }
        }
      }
    }

    // 2. Cal.com payload parsing (e.g. BOOKING_CREATED)
    if (body.triggerEvent === "BOOKING_CREATED" || body.triggerEvent === "BOOKING_CANCELLED" || body.payload?.attendees) {
      const payload = body.payload || body;
      if (Array.isArray(payload.attendees)) {
        for (const attendee of payload.attendees) {
          if (attendee.email) emailsToProcess.push(attendee.email);
        }
      }
      if (payload.user?.email) emailsToProcess.push(payload.user.email);
      if (payload.bookerUrl) {
        // Fallback email parsing if present
      }
    }

    // 3. Generic fallback (Direct email property or payload.email)
    if (body.email && typeof body.email === "string") emailsToProcess.push(body.email);
    if (body.payload?.email && typeof body.payload.email === "string") emailsToProcess.push(body.payload.email);
    if (body.attendeeEmail && typeof body.attendeeEmail === "string") emailsToProcess.push(body.attendeeEmail);

    // Filter, deduplicate, and normalize emails
    const uniqueEmails = Array.from(
      new Set(
        emailsToProcess
          .filter((e): e is string => typeof e === "string" && e.includes("@"))
          .map((e) => e.trim().toLowerCase())
      )
    );

    if (uniqueEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook received, but no valid email address could be extracted from payload",
          receivedKeys: Object.keys(body),
        },
        { status: 200 } // Return 200 so third-party webhook dispatchers don't retry endlessly
      );
    }

    await dbConnect();

    let totalLeadsStopped = 0;
    const updatedLeadIds: string[] = [];

    for (const email of uniqueEmails) {
      // Find active leads with this email address
      const matchingLeads = await LeadModel.find({
        email: email,
        status: { $ne: "stopped" },
      });

      for (const lead of matchingLeads) {
        // Check if magnet page or sequence has stopOnCall enabled (defaulting to true)
        let shouldStop = true;

        if (lead.pageId) {
          const magnetPage = await MagnetPageModel.findOne({ id: lead.pageId });
          if (magnetPage && magnetPage.stopOnCall === false) {
            shouldStop = false;
          }
        }

        if (shouldStop) {
          lead.status = "stopped";
          await lead.save();
          totalLeadsStopped++;
          updatedLeadIds.push(lead.id);

          // Update associated Sequence stats if applicable
          if (lead.pageId) {
            await SequenceModel.updateOne(
              { pageId: lead.pageId },
              { $inc: { "stats.stopped": 1 } }
            ).catch(() => null);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedEmails: uniqueEmails,
      totalLeadsStopped,
      stoppedLeadIds: updatedLeadIds,
    });
  } catch (error: any) {
    console.error("Booking Webhook Exception:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error", details: error.message },
      { status: 500 }
    );
  }
}
