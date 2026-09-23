import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/mongodb";
import { EmailEventModel } from "@/lib/models";
import crypto from "crypto";

export interface EmailTrackingOptions {
  leadId?: string;
  pageId?: string;
  sequenceId?: string;
  stepId?: string;
  userEmail?: string;
  recipient?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tracking?: EmailTrackingOptions;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.socketlabs.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "[email] SMTP_USER and SMTP_PASS environment variables are required but not set. " +
      "Please add them to your .env.local file or Vercel environment settings."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    tls: {
      // Enforce TLS certificate verification in production.
      // false only in local dev to tolerate self-signed certs on dev SMTP servers.
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return transporter;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://magnets.bdatech.in";
}

export function injectTrackingPixel(html: string, tracking: EmailTrackingOptions): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  if (tracking.leadId) params.set("leadId", tracking.leadId);
  if (tracking.pageId) params.set("pageId", tracking.pageId);
  if (tracking.sequenceId) params.set("sequenceId", tracking.sequenceId);
  if (tracking.stepId) params.set("stepId", tracking.stepId);
  if (tracking.userEmail) params.set("userEmail", tracking.userEmail);
  if (tracking.recipient) params.set("recipient", tracking.recipient);

  const pixelUrl = `${baseUrl}/api/track/open?${params.toString()}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;outline:none;" />`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}\n</body>`);
  }
  return `${html}\n${pixelTag}`;
}

export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const defaultFrom = process.env.SMTP_FROM || "non-reply@bdatech.in";
    const recipientStr = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    const recipientClean = Array.isArray(options.to) ? options.to[0]?.trim().toLowerCase() : options.to.trim().toLowerCase();

    let finalHtml = options.html;
    if (options.tracking) {
      finalHtml = injectTrackingPixel(options.html, {
        ...options.tracking,
        recipient: options.tracking.recipient || recipientClean,
      });
    }

    const mailOptions = {
      from: options.from || `LeadMagnets <${defaultFrom}>`,
      to: recipientStr,
      subject: options.subject,
      html: finalHtml,
      replyTo: options.replyTo,
    };

    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    console.log("📧 [SocketLabs SMTP] Email sent successfully:", info.messageId, "to:", options.to);

    // Record 'sent' event in MongoDB if tracking is present
    if (options.tracking) {
      (async () => {
        try {
          await dbConnect();
          const eventId = `ev_sent_${crypto.randomBytes(8).toString("hex")}`;
          await EmailEventModel.create({
            id: eventId,
            userEmail: options.tracking?.userEmail || "",
            leadId: options.tracking?.leadId || "",
            pageId: options.tracking?.pageId || "",
            sequenceId: options.tracking?.sequenceId || "",
            stepId: options.tracking?.stepId || "",
            eventType: "sent",
            recipientEmail: recipientClean,
            subject: options.subject,
            messageId: info.messageId || "",
            createdAt: new Date(),
          });
        } catch (dbErr) {
          console.error("❌ Failed to log sent email event:", dbErr);
        }
      })();
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ [SocketLabs SMTP] Email sending failed:", error);
    return { success: false, error: error.message || "Failed to send email via SMTP" };
  }
}

