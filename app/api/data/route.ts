import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { account as seedAccount, pages as seedPages, leads as seedLeads, sequences as seedSequences, integrations as seedIntegrations } from "@/lib/data";
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const normEmail = email ? email.trim().toLowerCase() : null;

    let account;
    if (normEmail) {
      account = await AccountModel.findOne({ email: normEmail });
    }

    if (!account) {
      // Check if any account exists, otherwise seed everything
      const anyAccount = await AccountModel.findOne();
      if (!anyAccount) {
        // Seed initial default account without sample pages
        await AccountModel.create(seedAccount);
        await LeadModel.insertMany(seedLeads);
        await SequenceModel.insertMany(seedSequences);
        await IntegrationModel.insertMany(seedIntegrations);
      }

      if (normEmail) {
        account = await AccountModel.findOne({ email: normEmail });
      }
      if (!account) {
        account = await AccountModel.findOne();
      }
    }

    const pageFilter = normEmail ? { userEmail: normEmail } : {};
    let pages = await MagnetPageModel.find(pageFilter).lean();

    const resourceFilter = normEmail
      ? { $or: [{ userEmail: normEmail }, { userEmail: { $exists: false } }, { userEmail: null }] }
      : {};

    const [leads, sequences, integrations, resources] = await Promise.all([
      LeadModel.find().lean(),
      SequenceModel.find().lean(),
      IntegrationModel.find().lean(),
      ResourceModel.find(resourceFilter).lean(),
    ]);

    return NextResponse.json({
      account,
      pages,
      leads,
      sequences,
      integrations,
      resources,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { action, data, email } = body;
    const normEmail = email ? email.trim().toLowerCase() : (body.userEmail || "").trim().toLowerCase();

    if (action === "savePages") {
      if (Array.isArray(data)) {
        for (const item of data) {
          const itemEmail = normEmail || item.userEmail || "";
          await MagnetPageModel.findOneAndUpdate(
            { id: item.id },
            { ...item, userEmail: itemEmail },
            { upsert: true, new: true }
          );
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "deletePage") {
      const { id } = data;
      await MagnetPageModel.deleteOne({ id });
      return NextResponse.json({ success: true });
    }

    if (action === "addPage") {
      const pageToInsert = normEmail ? { ...data, userEmail: normEmail } : data;
      await MagnetPageModel.findOneAndUpdate(
        { id: data.id },
        pageToInsert,
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "saveSequences") {
      if (Array.isArray(data)) {
        for (const item of data) {
          await SequenceModel.findOneAndUpdate(
            { id: item.id },
            item,
            { upsert: true, new: true }
          );
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "saveAccount") {
      let account;
      const normalizedEmail = data.email ? data.email.trim().toLowerCase() : "";
      if (normalizedEmail) {
        data.email = normalizedEmail;
      }
      let existing = normalizedEmail ? await AccountModel.findOne({ email: normalizedEmail }) : null;
      if (!existing && data.id) {
        existing = await AccountModel.findOne({ id: data.id });
      }
      if (!existing) {
        existing = await AccountModel.findOne();
      }

      if (existing) {
        existing.name = data.name || existing.name;
        existing.username = data.username || existing.username;
        existing.brandColor = data.brandColor || existing.brandColor;
        existing.logo = data.logo;
        existing.themeMode = data.themeMode || existing.themeMode;
        existing.highlightIntensity = data.highlightIntensity ?? existing.highlightIntensity;
        if (data.password) {
          existing.password = data.password;
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
        account = await AccountModel.create(data);
      }
      return NextResponse.json({ success: true, account });
    }

    if (action === "checkEmail") {
      const existing = await AccountModel.findOne({ email: data.email.trim().toLowerCase() });
      return NextResponse.json({ exists: !!existing });
    }

    if (action === "deleteAccount") {
      const { email, password } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "Account not found." }, { status: 400 });
      }
      const dbPassword = account.password || "password123";
      if (dbPassword !== password) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
      }
      await AccountModel.deleteOne({ email: email.trim().toLowerCase() });
      return NextResponse.json({ success: true });
    }

    if (action === "login") {
      const { email, password } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "No account found with this email. Sign up instead." }, { status: 400 });
      }
      const dbPassword = account.password || "password123";
      if (dbPassword !== password) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
      }
      return NextResponse.json({ success: true, account });
    }

    if (action === "updatePassword") {
      const { email, currentPassword, newPassword } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "Account not found." }, { status: 400 });
      }
      const dbPassword = account.password || "password123";
      if (dbPassword !== currentPassword) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      account.password = newPassword;
      await account.save();
      return NextResponse.json({ success: true });
    }

    if (action === "getAccountByEmail") {
      const account = await AccountModel.findOne({ email: data.email.trim().toLowerCase() });
      return NextResponse.json({ account });
    }

    if (action === "saveLeads") {
      await LeadModel.deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        await LeadModel.insertMany(data);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "addLead") {
      await LeadModel.create(data);
      
      // Also increment the signup count on the corresponding magnet page
      if (data.pageId) {
        const page = await MagnetPageModel.findOne({ id: data.pageId });
        if (page) {
          page.signups = (page.signups || 0) + 1;
          if (page.views > 0) {
            page.conversionRate = parseFloat(((page.signups / page.views) * 100).toFixed(1));
          }
          await page.save();
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "incrementViews") {
      const { pageId } = data;
      const page = await MagnetPageModel.findOne({ id: pageId });
      if (page) {
        page.views = (page.views || 0) + 1;
        if (page.views > 0) {
          page.conversionRate = parseFloat(((page.signups / page.views) * 100).toFixed(1));
        }
        await page.save();
      }
      return NextResponse.json({ success: true });
    }

    if (action === "saveIntegrations") {
      await IntegrationModel.deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        await IntegrationModel.insertMany(data);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "saveResources") {
      if (normEmail) {
        await ResourceModel.deleteMany({ userEmail: normEmail });
      }
      if (Array.isArray(data) && data.length > 0) {
        const docs = data.map((item) => ({ ...item, userEmail: normEmail || item.userEmail }));
        await ResourceModel.insertMany(docs);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "deleteResource") {
      const { id } = data;
      await ResourceModel.deleteOne({ id });
      return NextResponse.json({ success: true });
    }

    if (action === "addResource") {
      await ResourceModel.create(data);
      return NextResponse.json({ success: true });
    }

    if (action === "deleteResource") {
      await ResourceModel.deleteOne({ id: data.id });
      return NextResponse.json({ success: true });
    }

    if (action === "sendResetEmail") {
      const { email } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "Account not found." }, { status: 400 });
      }

      // Send email using Resend HTTP API
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [email.trim()],
          subject: "Reset your LeadMagnets password",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #FE6F34; text-align: center;">Reset your password</h2>
              <p>Hi ${account.name || "there"},</p>
              <p>We received a request to reset your password. Click the button below to choose a new one:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${req.headers.get("origin") || "http://localhost:3000"}/dashboard/settings" style="background-color: #FE6F34; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 11px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errData = await resendRes.json();
        console.error("Resend API error:", errData);
        return NextResponse.json({ error: errData.message || "Failed to send email." }, { status: 500 });
      }

      const emailData = await resendRes.json();
      return NextResponse.json({ success: true, emailData });
    }

    if (action === "sendVerificationEmail") {
      const { email, name } = data;

      // Send verification email using Resend HTTP API
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [email.trim()],
          subject: "Verify your LeadMagnets email",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #fafafa;">
              <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #eaeaea; text-align: center;">
                <h2 style="color: #0E0E10; margin-top: 0; font-size: 20px; font-weight: bold;">Verify your email</h2>
                <p style="color: #4a4a4a; font-size: 13px; margin-bottom: 24px;">Confirm this email address to finish creating your LeadMagnets account.</p>
                <div style="margin: 24px 0;">
                  <a href="${req.headers.get("origin") || "http://localhost:3000"}/register/confirm?email=${encodeURIComponent(email.trim())}" style="background-color: #0E0E10; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Verify email address</a>
                </div>
                <p style="font-size: 11px; color: #888; margin-top: 24px; line-height: 1.5;">This link expires in 24 hours. If you did not create a LeadMagnets account, you can ignore this email.</p>
              </div>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errData = await resendRes.json();
        console.error("Resend API error:", errData);
        return NextResponse.json({ error: errData.message || "Failed to send verification email." }, { status: 500 });
      }

      const emailData = await resendRes.json();
      return NextResponse.json({ success: true, emailData });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
