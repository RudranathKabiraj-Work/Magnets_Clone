export interface LeadAlertPayload {
  ownerEmail: string;
  leadEmail: string;
  leadName?: string;
  pageTitle: string;
  signedUpAt: string;
  customAnswer?: string;
}

export async function sendInstantLeadAlert(payload: LeadAlertPayload): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, leadEmail, leadName, pageTitle, signedUpAt, customAnswer } = payload;

  if (!ownerEmail || !ownerEmail.includes("@")) {
    return { success: false, error: "Invalid target owner email address" };
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">
          🎉 New Lead Captured
        </div>

        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.3;">
          You just got a new subscriber!
        </h1>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
          A new visitor just signed up on your lead magnet: <strong style="color: #0f172a;">${pageTitle || "Lead Magnet"}</strong>
        </p>

        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">SUBSCRIBER EMAIL</span>
            <span style="font-size: 15px; font-weight: 700; color: #0f172a;">${leadEmail}</span>
          </div>

          ${leadName ? `
          <div style="margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">NAME</span>
            <span style="font-size: 14px; font-weight: 600; color: #334155;">${leadName}</span>
          </div>
          ` : ""}

          ${customAnswer ? `
          <div style="margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">CUSTOM RESPONSE / ANSWERS</span>
            <span style="font-size: 14px; font-weight: 600; color: #1e293b; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; display: inline-block; border: 1px solid #e2e8f0;">${customAnswer}</span>
          </div>
          ` : ""}

          <div>
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">SIGNUP TIME</span>
            <span style="font-size: 13px; color: #64748b;">${signedUpAt}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="http://localhost:3000/dashboard/signups" style="background-color: #0066B2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 8px rgba(0, 102, 178, 0.25);">
            View All Subscribers →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Sent by LeadMagnets Platform · Instant Lead Alert
        </p>
      </div>
    </div>
  `;

  if (!resendApiKey) {
    console.log("ℹ️ [Instant Lead Alert] Simulated email dispatch to", ownerEmail, "for lead:", leadEmail);
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "alerts@resend.dev",
        to: [ownerEmail.trim()],
        subject: `🎉 New Lead: ${leadEmail} on ${pageTitle || "Lead Magnet"}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.warn("Resend API notice:", err?.message || err);
      if (err?.message && err.message.toLowerCase().includes("testing emails")) {
        return {
          success: true,
          error: "Resend Free Tier Notice: Email alerts are sent to your registered Resend inbox. Verify a custom domain at resend.com to deliver to any external inbox."
        };
      }
      return { success: false, error: err?.message || "Failed to send email alert" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Instant Lead Alert exception:", error);
    return { success: false, error: error.message };
  }
}
