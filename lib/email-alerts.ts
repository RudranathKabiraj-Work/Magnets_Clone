import { sendMail } from "@/lib/email";

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

  // Use the public production URL by default so image assets load reliably across all email clients
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;
  const initialLetter = (leadName?.trim() || leadEmail?.trim() || "S").charAt(0).toUpperCase();
  const leadDisplayName = leadName?.trim() || "New Subscriber";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Captured</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <div style="background-color: #f1f5f9; padding: 40px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto;">
      
      <!-- Top Brand Header with Official Logo -->
      <tr>
        <td style="padding-bottom: 24px; text-align: center;">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoUrl}" 
              alt="LeadMagnets" 
              height="36" 
              style="height: 36px; width: auto; max-height: 40px; display: inline-block; border: 0; outline: none; vertical-align: middle;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);">
            
            <!-- Pill Badge -->
            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
              ✨ New Subscriber Signup
            </div>

            <!-- Main Heading -->
            <h1 style="color: #0f172a; font-size: 23px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.3; letter-spacing: -0.02em;">
              You just captured a new lead!
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
              A new visitor has signed up through your lead magnet:
              <strong style="color: #0f172a; background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block; margin-top: 4px;">
                ${pageTitle || "Lead Magnet"}
              </strong>
            </p>

            <!-- Subscriber Profile Card -->
            <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
              
              <!-- Avatar & Header info -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px;">
                <tr>
                  <td style="width: 44px; vertical-align: middle;">
                    <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #0066B2 0%, #2563eb 100%); border-radius: 50%; text-align: center; line-height: 42px; color: #ffffff; font-weight: 700; font-size: 17px; box-shadow: 0 2px 8px rgba(0, 102, 178, 0.25);">
                      ${initialLetter}
                    </div>
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle;">
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.2;">
                      ${leadDisplayName}
                    </div>
                    <div style="font-size: 13px; color: #0066B2; font-weight: 500; margin-top: 2px;">
                      ${leadEmail}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Metadata Grid -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0; width: 34%; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                    Email Address
                  </td>
                  <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a;">
                    <a href="mailto:${leadEmail}" style="color: #0f172a; text-decoration: none;">${leadEmail}</a>
                  </td>
                </tr>

                ${leadName ? `
                <tr>
                  <td style="padding: 5px 0; width: 34%; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                    Full Name
                  </td>
                  <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #334155;">
                    ${leadName}
                  </td>
                </tr>
                ` : ""}

                <tr>
                  <td style="padding: 5px 0; width: 34%; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                    Lead Magnet
                  </td>
                  <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #334155;">
                    ${pageTitle || "Lead Magnet"}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 5px 0; width: 34%; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                    Signup Time
                  </td>
                  <td style="padding: 5px 0; font-size: 13px; color: #64748b;">
                    ${signedUpAt}
                  </td>
                </tr>
              </table>

              ${customAnswer ? `
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                  Custom Form Response
                </div>
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #0066B2; border-radius: 6px; padding: 10px 12px; font-size: 13px; color: #1e293b; line-height: 1.45;">
                  ${customAnswer}
                </div>
              </div>
              ` : ""}
            </div>

            <!-- Automation Status Callout -->
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin-bottom: 26px;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 20px; vertical-align: top; font-size: 14px; line-height: 1.3;">
                    ⚡
                  </td>
                  <td style="padding-left: 8px; font-size: 12px; color: #1e40af; line-height: 1.45;">
                    <strong>Automated Status:</strong> This lead has been recorded in your database, and your automated email sequences have been scheduled.
                  </td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-top: 10px; margin-bottom: 12px;">
              <a href="${appUrl}/dashboard/leads" style="background: linear-gradient(135deg, #0066B2 0%, #004d88 100%); color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 102, 178, 0.28); letter-spacing: 0.01em;">
                View All Leads in Dashboard →
              </a>
            </div>

            <div style="text-align: center; margin-bottom: 26px;">
              <a href="mailto:${leadEmail}?subject=Thank%20you%20for%20accessing%20${encodeURIComponent(pageTitle || 'our resources')}" style="color: #64748b; font-size: 12px; text-decoration: none; font-weight: 500;">
                Or <span style="text-decoration: underline; color: #0066B2;">reply directly to ${leadEmail}</span>
              </a>
            </div>

            <!-- Footer Details -->
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; text-align: center;">
              <tr>
                <td>
                  <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                    Sent by <strong>LeadMagnets</strong> · Instant Lead Alert<br />
                    You received this email because instant lead notifications are enabled for your account.<br />
                    <a href="${appUrl}/dashboard/settings" style="color: #0066B2; text-decoration: underline;">Notification Preferences</a>
                  </div>
                </td>
              </tr>
            </table>

          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `;

  return sendMail({
    to: ownerEmail.trim(),
    subject: `🎉 New Lead: ${leadEmail} on ${pageTitle || "LeadMagnet"}`,
    html: htmlContent,
  });
}
