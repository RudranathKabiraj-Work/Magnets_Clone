import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
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
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const defaultFrom = process.env.SMTP_FROM || "non-reply@bdatech.in";
    const mailOptions = {
      from: options.from || `LeadMagnets <${defaultFrom}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    };

    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    console.log("📧 [SocketLabs SMTP] Email sent successfully:", info.messageId, "to:", options.to);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ [SocketLabs SMTP] Email sending failed:", error);
    return { success: false, error: error.message || "Failed to send email via SMTP" };
  }
}
