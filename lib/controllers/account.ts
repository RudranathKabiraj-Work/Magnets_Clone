import { NextResponse } from "next/server";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { type MagnetPage, type Resource } from "@/lib/data";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { hashPassword, comparePassword } from "@/lib/auth-helpers";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { sendMail } from "@/lib/email";
import { randomBytes } from "crypto";

/** Generates a cryptographically random 64-char hex webhook secret. */
function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

function serverValidatePassword(pass: string): string | null {
  if (!pass || pass.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pass)) return "Password must contain at least one number (0–9).";
  if (!/[^a-zA-Z0-9]/.test(pass)) return "Password must contain at least one special symbol (e.g. !@#$%).";
  return null;
}

export async function handleSaveAccount(data: any, authEmail: string | null) {
  let normalizedEmail = authEmail;
  if (!normalizedEmail && data?.email) {
    normalizedEmail = data.email.trim().toLowerCase();
  }

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to update your account." }, { status: 401 });
  }

  data.email = normalizedEmail;
  if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password)) {
    const pwdErr = serverValidatePassword(data.password);
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 });
    }
  }
  let existing = await AccountModel.findOne({ email: normalizedEmail });
  if (!existing && data.id) {
    existing = await AccountModel.findOne({ id: data.id, email: normalizedEmail });
  }

  let account;
  if (existing) {
    existing.name = data.name || existing.name;
    existing.username = data.username || existing.username;
    existing.brandColor = data.brandColor || existing.brandColor;
    existing.logo = data.logo !== undefined ? data.logo : existing.logo;
    existing.avatar = data.avatar !== undefined ? data.avatar : existing.avatar;
    existing.leadAlertsEnabled = data.leadAlertsEnabled !== undefined ? data.leadAlertsEnabled : existing.leadAlertsEnabled;
    existing.notifyEmail = data.notifyEmail !== undefined ? data.notifyEmail : existing.notifyEmail;
    existing.themeMode = data.themeMode || existing.themeMode;
    existing.highlightIntensity = data.highlightIntensity ?? existing.highlightIntensity;
    existing.templateId = data.templateId || existing.templateId;
    existing.slackWebhookUrl = data.slackWebhookUrl !== undefined ? data.slackWebhookUrl : existing.slackWebhookUrl;
    existing.zapierWebhookUrl = data.zapierWebhookUrl !== undefined ? data.zapierWebhookUrl : existing.zapierWebhookUrl;
    existing.pipedriveApiToken = data.pipedriveApiToken !== undefined ? data.pipedriveApiToken : existing.pipedriveApiToken;
    existing.kitConnected = data.kitConnected !== undefined ? data.kitConnected : existing.kitConnected;
    existing.kitApiKey = data.kitApiKey !== undefined ? data.kitApiKey : existing.kitApiKey;
    existing.senderDisplayName = data.senderDisplayName !== undefined ? data.senderDisplayName : existing.senderDisplayName;
    existing.senderAddress = data.senderAddress !== undefined ? data.senderAddress : existing.senderAddress;
    existing.calendarProvider = data.calendarProvider || existing.calendarProvider;
    existing.calendarToken = data.calendarToken !== undefined ? data.calendarToken : existing.calendarToken;
    existing.calendarConnected = data.calendarConnected !== undefined ? data.calendarConnected : existing.calendarConnected;
    existing.customDomain = data.customDomain !== undefined ? data.customDomain : existing.customDomain;
    existing.customSubdomain = data.customSubdomain !== undefined ? data.customSubdomain : existing.customSubdomain;
    existing.domainVerified = data.domainVerified !== undefined ? data.domainVerified : existing.domainVerified;
    existing.cnameVerified = data.cnameVerified !== undefined ? data.cnameVerified : existing.cnameVerified;
    existing.sslStatus = data.sslStatus || existing.sslStatus;
    existing.ga4MeasurementId = data.ga4MeasurementId !== undefined ? data.ga4MeasurementId : existing.ga4MeasurementId;
    existing.metaPixelId = data.metaPixelId !== undefined ? data.metaPixelId : existing.metaPixelId;
    existing.faviconUrl = data.faviconUrl !== undefined ? data.faviconUrl : existing.faviconUrl;
    existing.ogImageUrl = data.ogImageUrl !== undefined ? data.ogImageUrl : existing.ogImageUrl;
    existing.spfVerified = data.spfVerified !== undefined ? data.spfVerified : existing.spfVerified;
    existing.dkimVerified = data.dkimVerified !== undefined ? data.dkimVerified : existing.dkimVerified;

    if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password) && data.password !== existing.password) {
      existing.password = await hashPassword(data.password);
    }
    account = await existing.save();
  } else {
    let username = data.username || "user";
    let count = 0;
    let uniqueUsername = username;
    while (await AccountModel.findOne({ username: uniqueUsername })) {
      count++;
      uniqueUsername = `${username.slice(0, 15 - String(count).length)}${count}`;
    }
    data.username = uniqueUsername;
    if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password)) {
      data.password = await hashPassword(data.password);
    }
    // Auto-provision a unique LinkedIn webhook secret for every new account.
    // This mirrors how Stripe, Twilio, and other SaaS platforms automatically
    // generate API keys at signup — no extra step needed from the user.
    if (!data.linkedinWebhookSecret) {
      data.linkedinWebhookSecret = generateWebhookSecret();
    }
    account = await AccountModel.create(data);
  }

  const res = NextResponse.json({ success: true, account });
  setAuthCookie(res, normalizedEmail, account?.name);
  return res;
}

export async function handleCheckEmail(data: any) {
  const existing = await AccountModel.findOne({ email: data.email.trim().toLowerCase() });
  return NextResponse.json({ exists: !!existing });
}

export async function handleDeleteAccount(data: any, authEmail: string | null) {
  const { email, password } = data;
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
  }

  if (authEmail !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Forbidden. You can only delete your own account." }, { status: 403 });
  }

  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }
  if (account.password) {
    const { isValid } = await comparePassword(password, account.password);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }
  }
  const normDelEmail = email.trim().toLowerCase();

  const userPages = (await MagnetPageModel.find({ userEmail: normDelEmail }).lean()) as unknown as MagnetPage[];
  const userResources = (await ResourceModel.find({ userEmail: normDelEmail }).lean()) as unknown as Resource[];

  const allUserAssets: string[] = [];
  userPages.forEach((p) => {
    if (p.imageUrl) allUserAssets.push(p.imageUrl);
    if (p.variantBImage) allUserAssets.push(p.variantBImage);
    if (Array.isArray(p.pdfPages)) {
      p.pdfPages.forEach((u: string) => { if (u) allUserAssets.push(u); });
    }
  });
  userResources.forEach((r) => {
    const u = r.url || r.fileUrl;
    if (u) allUserAssets.push(u);
  });

  if (allUserAssets.length > 0) {
    deleteCloudinaryAssets(allUserAssets).catch((err) =>
      console.error("Cloudinary cleanup error on deleteAccount:", err)
    );
  }

  await AccountModel.deleteOne({ email: normDelEmail });
  await MagnetPageModel.deleteMany({ userEmail: normDelEmail });
  await LeadModel.deleteMany({ userEmail: normDelEmail });
  await SequenceModel.deleteMany({ userEmail: normDelEmail });
  await IntegrationModel.deleteMany({ userEmail: normDelEmail });
  await ResourceModel.deleteMany({ userEmail: normDelEmail });
  const res = NextResponse.json({ success: true });
  clearAuthCookie(res);
  return res;
}

export async function handleLogin(data: any) {
  const { email, password } = data;
  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "No account found with this email. Sign up instead." }, { status: 400 });
  }
  const { isValid, needsRehash } = await comparePassword(password, account.password);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
  }

  if (needsRehash) {
    account.password = await hashPassword(password);
    await account.save();
  }

  // Set the HttpOnly session cookie right here — identity is verified above.
  // The login page no longer needs a separate POST to /api/auth/login.
  const res = NextResponse.json({ success: true, account });
  setAuthCookie(res, account.email, account.name);
  return res;
}

export async function handleUpdatePassword(data: any, authEmail: string | null) {
  const { email, currentPassword, newPassword } = data;
  const pwdErr = serverValidatePassword(newPassword);
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }

  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
  }

  if (authEmail !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Forbidden. You can only update your own password." }, { status: 403 });
  }

  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }
  if (account.password) {
    const { isValid } = await comparePassword(currentPassword, account.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }
  account.password = await hashPassword(newPassword);
  await account.save();
  return NextResponse.json({ success: true });
}

export async function handleGetAccountByEmail(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }
  const account = await AccountModel.findOne({ email: authEmail }).select("-password").lean();
  return NextResponse.json({ account });
}

export async function handleSendResetEmail(data: any) {
  const { email } = data;
  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  account.resetPasswordToken = token;
  account.resetPasswordExpires = expires;
  await account.save();

  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const resetUrl = `${origin}/reset-password?token=${token}`;

  const sendResult = await sendMail({
    to: email.trim(),
    subject: "Reset your LeadMagnets password",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #FE6F34; text-align: center;">Reset your password</h2>
        <p>Hi ${account.name || "there"},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #FE6F34; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #666;">This link will expire in 1 hour.</p>
        <p style="font-size: 11px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function handleResetPassword(data: any) {
  const { token, newPassword } = data;
  if (!token || !newPassword) {
    return NextResponse.json({ error: "Invalid request parameters." }, { status: 400 });
  }

  const pwdErr = serverValidatePassword(newPassword);
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }

  const account = await AccountModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!account) {
    return NextResponse.json({ error: "Password reset token is invalid or has expired." }, { status: 400 });
  }

  account.password = await hashPassword(newPassword);
  account.resetPasswordToken = null;
  account.resetPasswordExpires = null;
  await account.save();

  return NextResponse.json({ success: true });
}

export async function handleSendVerificationEmail(data: any, reqHostOrigin: string) {
  const { email } = data;

  const sendResult = await sendMail({
    to: email.trim(),
    subject: "Verify your LeadMagnets email",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #fafafa;">
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #eaeaea; text-align: center;">
          <h2 style="color: #0E0E10; margin-top: 0; font-size: 20px; font-weight: bold;">Verify your email</h2>
          <p style="color: #4a4a4a; font-size: 13px; margin-bottom: 24px;">Confirm this email address to finish creating your LeadMagnets account.</p>
          <div style="margin: 24px 0;">
            <a href="${reqHostOrigin}/register/confirm?email=${encodeURIComponent(email.trim())}" style="background-color: #0E0E10; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Verify email address</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 24px; line-height: 1.5;">This link expires in 24 hours. If you did not create a LeadMagnets account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || "Failed to send verification email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ---------------------------------------------------------------------------
// LinkedIn Automation Handlers
// ---------------------------------------------------------------------------

/**
 * Returns the user's personal LinkedIn webhook URL and their secret.
 * If the account was created before this feature existed and has no secret,
 * we auto-generate one now (lazy provisioning — same as GitHub's PAT system).
 */
export async function handleGetLinkedInConfig(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Lazy provisioning: generate secret for existing accounts that predate this feature
  if (!account.linkedinWebhookSecret) {
    account.linkedinWebhookSecret = generateWebhookSecret();
    await account.save();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";

  return NextResponse.json({
    success: true,
    webhookUrl: `${appUrl}/api/webhooks/linkedin`,
    secret: account.linkedinWebhookSecret,
  });
}

/**
 * Generates a brand-new webhook secret for the user and saves it.
 * Invalidates the old secret immediately — any Make.com scenarios using
 * the old secret must be updated. Same "Regenerate" pattern as Stripe API keys.
 */
export async function handleRegenerateLinkedInSecret(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const newSecret = generateWebhookSecret();
  account.linkedinWebhookSecret = newSecret;
  await account.save();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";

  return NextResponse.json({
    success: true,
    webhookUrl: `${appUrl}/api/webhooks/linkedin`,
    secret: newSecret,
    message: "New secret generated. Update your Make.com scenario with this new secret.",
  });
}
