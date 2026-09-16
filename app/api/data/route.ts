import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { account as seedAccount, pages as seedPages, leads as seedLeads, sequences as seedSequences, integrations as seedIntegrations } from "@/lib/data";
import { sendInstantLeadAlert } from "@/lib/email-alerts";
import { sendMail } from "@/lib/email";
import { clearAuthCookie, getAuthenticatedUserEmail, setAuthCookie } from "@/lib/auth";
import { hashPassword, comparePassword } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authEmail = await getAuthenticatedUserEmail();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const normEmail = authEmail || (email ? email.trim().toLowerCase() : null);

    if (!normEmail) {
      return NextResponse.json({
        account: null,
        pages: [],
        leads: [],
        sequences: [],
        integrations: [],
        resources: [],
      });
    }

    const pageFilter = { userEmail: normEmail };
    const userFilter = { userEmail: normEmail };

    const [account, pages, leads, sequences, integrations, resources] = await Promise.all([
      AccountModel.findOne({ email: normEmail }).lean(),
      MagnetPageModel.find(pageFilter).lean(),
      LeadModel.find(userFilter).lean(),
      SequenceModel.find(userFilter).lean(),
      IntegrationModel.find(userFilter).lean(),
      ResourceModel.find({ userEmail: normEmail, isPageAsset: { $ne: true }, type: { $ne: "page_asset" } }).lean(),
    ]);

    let finalLeads = leads;
    if (pages.length > 0) {
      const pageNames = pages.map((p: any) => p.name).filter(Boolean);
      const pageIds = pages.map((p: any) => p.id).filter(Boolean);
      const fallbackLeads = await LeadModel.find({
        $or: [
          { userEmail: normEmail },
          { pageId: { $in: pageIds } },
          { page: { $in: pageNames } },
        ],
      }).lean();
      finalLeads = fallbackLeads;
    }

    return NextResponse.json({
      account,
      pages,
      leads: finalLeads,
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

    const publicActions = [
      "addLead",
      "checkEmail",
      "login",
      "resetPassword",
      "sendResetEmail",
      "sendVerificationEmail",
      "sendForgotPasswordEmail",
      "verifyEmailToken",
    ];

    // Skip the expensive getServerSession/NextAuth call for public actions (e.g. login).
    // Previously this ran for every POST — including unauthenticated ones — causing a
    // 2–5 second delay on login because getServerSession times out with no session.
    const isPublic = publicActions.includes(action);
    const authEmail = isPublic ? null : await getAuthenticatedUserEmail();

    const normEmail = authEmail || (email ? email.trim().toLowerCase() : (body.userEmail || "").trim().toLowerCase());

    if (!normEmail && !isPublic && action !== "saveAccount") {
      return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
    }

    if (action === "savePages") {
      if (Array.isArray(data) && data.length > 0) {
        const ops = data.map((item: any) => {
          const itemEmail = normEmail || item.userEmail || "";
          return {
            updateOne: {
              filter: { id: item.id },
              update: { $set: { ...item, userEmail: itemEmail } },
              upsert: true,
            },
          };
        });
        await MagnetPageModel.bulkWrite(ops);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "deletePage") {
      const { id } = data;
      const filter = normEmail
        ? { id, userEmail: { $regex: new RegExp(`^${normEmail}$`, "i") } }
        : { id };
      await MagnetPageModel.deleteOne(filter);
      return NextResponse.json({ success: true });
    }

    if (action === "addPage") {
      const pageToInsert = normEmail ? { ...data, userEmail: normEmail } : data;
      await MagnetPageModel.findOneAndUpdate(
        { id: data.id },
        pageToInsert,
        { upsert: true, returnDocument: 'after' }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "saveSequences") {
      if (Array.isArray(data) && data.length > 0) {
        const ops = data.map((item: any) => {
          const itemEmail = normEmail || item.userEmail || "";
          return {
            updateOne: {
              filter: { id: item.id },
              update: { $set: { ...item, userEmail: itemEmail } },
              upsert: true,
            },
          };
        });
        await SequenceModel.bulkWrite(ops);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "deleteSequence") {
      const { id } = data;
      const filter = normEmail ? { id, userEmail: normEmail } : { id };
      const targetSeq = await SequenceModel.findOne(filter).lean();
      const pageIdToUpdate = (targetSeq as any)?.pageId || id;

      await SequenceModel.deleteOne(filter);
      await MagnetPageModel.updateMany(
        { $or: [{ id }, { id: pageIdToUpdate }] },
        { $set: { sequenceEnabled: false, sequenceEmails: [] } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "saveAccount") {
      let normalizedEmail = authEmail;
      if (!normalizedEmail && data?.email) {
        normalizedEmail = data.email.trim().toLowerCase();
      }

      if (!normalizedEmail) {
        return NextResponse.json({ error: "Unauthorized. Please log in to update your account." }, { status: 401 });
      }

      data.email = normalizedEmail;
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
        if (data.password) {
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
        if (data.password) {
          data.password = await hashPassword(data.password);
        }
        account = await AccountModel.create(data);
      }

      const res = NextResponse.json({ success: true, account });
      setAuthCookie(res, normalizedEmail, account?.name);
      return res;
    }

    if (action === "checkEmail") {
      const existing = await AccountModel.findOne({ email: data.email.trim().toLowerCase() });
      return NextResponse.json({ exists: !!existing });
    }

    if (action === "deleteAccount") {
      const { email, password } = data;

      // SECURITY: Must be logged in with a valid session
      if (!authEmail) {
        return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
      }

      // SECURITY: The logged-in session must match the account being deleted.
      // Prevents an attacker with a stolen password from deleting another user's account.
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

    if (action === "login") {
      const { email, password } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "No account found with this email. Sign up instead." }, { status: 400 });
      }
      const { isValid, needsRehash } = await comparePassword(password, account.password);
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
      }

      // Seamlessly upgrade legacy plain-text passwords to bcrypt hashes
      if (needsRehash) {
        account.password = await hashPassword(password);
        await account.save();
      }

      return NextResponse.json({ success: true, account });
    }

    if (action === "updatePassword") {
      const { email, currentPassword, newPassword } = data;

      // SECURITY: Must be logged in with a valid session
      if (!authEmail) {
        return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
      }

      // SECURITY: The logged-in session must match the account being updated.
      // Prevents an attacker with a stolen password from changing another user's password.
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

    if (action === "getAccountByEmail") {
      // SECURITY: Only use the server-verified session email.
      // Never trust data.email from the request body — any authenticated user
      // could supply another user's email and read their account data (IDOR attack).
      if (!authEmail) {
        return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
      }
      const account = await AccountModel.findOne({ email: authEmail }).select("-password").lean();
      return NextResponse.json({ account });
    }

    if (action === "deleteLead") {
      const { id } = data;
      // SECURITY: Only delete the lead if it belongs to the logged-in user
      await LeadModel.deleteOne({ id, userEmail: normEmail });
      return NextResponse.json({ success: true });
    }

    if (action === "saveLeads") {
      let pageNames: string[] = [];
      let pageIds: string[] = [];
      if (normEmail) {
        const userPages = await MagnetPageModel.find({ userEmail: normEmail }).lean();
        pageNames = userPages.map((p: any) => p.name).filter(Boolean);
        pageIds = userPages.map((p: any) => p.id).filter(Boolean);
      }
      const deleteFilter = normEmail
        ? {
          $or: [
            { userEmail: normEmail },
            ...(pageIds.length > 0 ? [{ pageId: { $in: pageIds } }] : []),
            ...(pageNames.length > 0 ? [{ page: { $in: pageNames } }] : []),
          ],
        }
        : {};
      await LeadModel.deleteMany(deleteFilter);
      if (Array.isArray(data) && data.length > 0) {
        const leadsToInsert = data.map((item: any) => {
          const { _id, ...cleanItem } = item;
          return {
            ...cleanItem,
            userEmail: normEmail || item.userEmail || "",
          };
        });
        await LeadModel.insertMany(leadsToInsert);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "addLead") {
      let ownerEmail = normEmail || data.userEmail;
      let pageTitle = data.page || "Lead Magnet";
      let foundPageDoc: any = null;

      // Prevent duplicate lead submissions for the same email & page
      if (data.email && (data.pageId || data.page)) {
        const leadQuery: any = {
          email: data.email.trim().toLowerCase(),
        };
        if (data.pageId) leadQuery.pageId = data.pageId;
        else if (data.page) leadQuery.page = data.page;

        const existingLead = await LeadModel.findOne(leadQuery);
        if (existingLead) {
          return NextResponse.json({ success: true, lead: existingLead, alreadySubscribed: true });
        }
      }

      if (data.pageId || data.page || data.pageSlug) {
        const query: any[] = [];
        if (data.pageId) query.push({ id: data.pageId });
        if (data.page) query.push({ name: data.page });
        if (data.pageSlug) query.push({ slug: data.pageSlug });
        foundPageDoc = await MagnetPageModel.findOne({ $or: query });
        if (foundPageDoc) {
          if (foundPageDoc.userEmail) ownerEmail = foundPageDoc.userEmail;
          if (foundPageDoc.name) pageTitle = foundPageDoc.name;
          const seqList = (foundPageDoc.sequenceEmails && foundPageDoc.sequenceEmails.length > 0) ? foundPageDoc.sequenceEmails : [];
          if (foundPageDoc.sequenceEnabled || seqList.length > 0) {
            data.sequence = `${pageTitle} Follow-up`;
            data.sequenceStep = `Step 1 of ${Math.max(1, seqList.length)}`;
          }
        }
      }

      const userAgent = req.headers.get("user-agent") || "";
      const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
      const rawReferrer = req.headers.get("referer") || req.headers.get("referrer") || "";
      let cleanReferrer = "Direct";
      if (rawReferrer) {
        try {
          const host = new URL(rawReferrer).hostname;
          cleanReferrer = host.replace(/^www\./, "");
        } catch (e) {
          cleanReferrer = "Direct";
        }
      }

      const createdLead = await LeadModel.create({
        ...data,
        deviceType: data.deviceType || (isMobile ? "mobile" : "desktop"),
        referrer: data.referrer || cleanReferrer,
        userEmail: ownerEmail || "",
      });

      // Also increment the signup count on the corresponding magnet page
      if (data.pageId) {
        const page = await MagnetPageModel.findOne({ id: data.pageId });
        if (page) {
          page.signups = (page.signups || 0) + 1;
          if (data.isVariantB) {
            page.variantBSignups = (page.variantBSignups || 0) + 1;
          } else {
            page.variantASignups = (page.variantASignups || 0) + 1;
          }
          if (page.views > 0) {
            page.conversionRate = parseFloat(((page.signups / page.views) * 100).toFixed(1));
          }
          await page.save();
        }
      }

      // Fire owner account alerts & third-party webhooks — using waitUntil so Vercel
      // keeps the function alive until ALL background work completes (emails, webhooks, CRM syncs).
      // queueMicrotask was unreliable: Vercel could kill the function after sending the HTTP response,
      // silently dropping emails and webhook calls mid-execution.
      if (ownerEmail) {
        waitUntil((async () => {
          try {
            const ownerAccount = await AccountModel.findOne({ email: ownerEmail.trim().toLowerCase() });
            const alertsEnabled = ownerAccount ? ownerAccount.leadAlertsEnabled !== false : true;
            const targetInbox = (ownerAccount && ownerAccount.notifyEmail) ? ownerAccount.notifyEmail : ownerEmail;

            if (alertsEnabled) {
              sendInstantLeadAlert({
                ownerEmail: targetInbox,
                leadEmail: data.email,
                leadName: data.name,
                pageTitle: pageTitle,
                signedUpAt: data.signedUpAt || new Date().toLocaleString(),
                customAnswer: data.customAnswer,
              }).catch((err) => console.error("Lead Alert Background Error:", err));
            }

            // Send instant deliverable email directly to the subscriber
            if (data.email) {
              const reqHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
              const reqProto = req.headers.get("x-forwarded-proto") || "https";
              const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : "http://localhost:3000";
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || dynamicOrigin;

              const targetUser = ownerAccount?.username || "u";
              const targetSlug = data.pageSlug || data.pageId || "resource";
              const resourceAccessUrl = `${appUrl}/${encodeURIComponent(targetUser)}/${encodeURIComponent(targetSlug)}/thank-you?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name || "")}`;

              const subject = (foundPageDoc?.emailSubject && foundPageDoc.emailSubject.trim())
                ? foundPageDoc.emailSubject.replace(/{name}/g, data.name || "there")
                : `Here is your resource: ${pageTitle}`;

              let rawBody = (foundPageDoc?.emailBody && foundPageDoc.emailBody.trim())
                ? foundPageDoc.emailBody
                : `Hey {name},\n\nThank you for requesting ${pageTitle}! Click the button below to access your resource instantly.\n\nEnjoy!`;

              rawBody = rawBody.replace(/{name}/g, data.name || "there");
              const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
              const formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

              const subscriberHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc;">
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                      ${pageTitle}
                    </h1>
                    <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
                      ${formattedBodyHtml}
                    </div>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${resourceAccessUrl}" style="background-color: ${ownerAccount?.brandColor || "#0066B2"}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 102, 178, 0.25);">
                        📥 Access Your Lead Magnet →
                      </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                      Sent by ${ownerAccount?.name || "LeadMagnets"} · Instant Lead Magnet Delivery
                    </p>
                  </div>
                </div>
              `;

              sendMail({
                to: data.email.trim(),
                subject: subject,
                html: subscriberHtml,
              }).then((res) => {
                if (res.success) {
                  console.log(`✅ Deliverable email successfully sent to subscriber: ${data.email}`);
                } else {
                  console.error(`❌ Deliverable email sending failed for subscriber ${data.email}:`, res.error);
                }
              }).catch((err) => console.error("Subscriber Email Dispatch Error:", err));
            }

            // Dispatch Slack incoming webhook notification if configured
            if (ownerAccount?.slackWebhookUrl) {
              fetch(ownerAccount.slackWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `🚀 *New Lead Alert!*\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Lead Magnet:* ${pageTitle}`,
                }),
              }).catch((err) => console.error("Slack Webhook dispatch error:", err));
            }

            // Dispatch Zapier Catch Hook payload if configured
            if (ownerAccount?.zapierWebhookUrl) {
              fetch(ownerAccount.zapierWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "new_lead",
                  lead_id: createdLead.id || data.id,
                  name: data.name,
                  email: data.email,
                  lead_magnet_title: pageTitle,
                  signed_up_at: data.signedUpAt || new Date().toISOString(),
                  custom_answer: data.customAnswer || "",
                }),
              }).catch((err) => console.error("Zapier Webhook dispatch error:", err));
            }

            // Sync lead to Pipedrive CRM if API Token configured
            if (ownerAccount?.pipedriveApiToken) {
              const apiToken = ownerAccount.pipedriveApiToken.trim();
              fetch(`https://api.pipedrive.com/v1/persons?api_token=${encodeURIComponent(apiToken)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: data.name || "Lead Subscriber",
                  email: [{ value: data.email, primary: true }],
                }),
              }).catch((err) => console.error("Pipedrive API sync error:", err));
            }

            // Sync lead to Kit (ConvertKit) via Tag subscription
            if (ownerAccount?.kitApiKey || ownerAccount?.kitConnected) {
              const kitKey = (ownerAccount.kitApiKey || "").trim();
              if (kitKey) {
                try {
                  const tagsRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(kitKey)}&api_key=${encodeURIComponent(kitKey)}`);
                  const tagsData = await tagsRes.json();
                  let tagId = tagsData.tags && tagsData.tags[0] ? tagsData.tags[0].id : null;

                  if (!tagId) {
                    const createTagRes = await fetch("https://api.convertkit.com/v3/tags", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ api_secret: kitKey, api_key: kitKey, tag: { name: "LeadMagnets Signups" } }),
                    });
                    const createTagData = await createTagRes.json();
                    tagId = createTagData.tag ? createTagData.tag.id : null;
                  }

                  if (tagId) {
                    await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        api_secret: kitKey,
                        api_key: kitKey,
                        email: data.email,
                        first_name: data.name || "",
                        fields: { lead_magnet: pageTitle },
                      }),
                    });
                  }
                } catch (err) {
                  console.error("Kit Tag Sync Error:", err);
                }
              }
            }
          } catch (err) {
            console.error("Background lead alerts error:", err);
          }
        })());
      }

      return NextResponse.json({ success: true, lead: createdLead });
    }

    if (action === "sendTestKitAlert") {
      const apiKey = data?.apiKey || (await AccountModel.findOne({ email: normEmail }))?.kitApiKey;
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json({ error: "No Kit API key or secret provided." }, { status: 400 });
      }

      try {
        const kitKey = apiKey.trim();
        // Fetch account info if API Secret was provided
        const accountRes = await fetch(`https://api.convertkit.com/v3/account?api_secret=${encodeURIComponent(kitKey)}`);
        const accountData = (await accountRes.json().catch(() => null)) || {};
        const accountName = accountData.name || accountData.primary_email_address;

        const tagsRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(kitKey)}&api_key=${encodeURIComponent(kitKey)}`);
        const tagsData = (await tagsRes.json().catch(() => null)) || {};

        if (tagsRes.ok && Array.isArray(tagsData.tags)) {
          let tagId = tagsData.tags[0]?.id;
          if (!tagId) {
            const createTagRes = await fetch("https://api.convertkit.com/v3/tags", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ api_secret: kitKey, api_key: kitKey, tag: { name: "LeadMagnets Signups" } }),
            });
            const createTagData = (await createTagRes.json().catch(() => null)) || {};
            tagId = createTagData.tag?.id;
          }

          if (tagId) {
            await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                api_secret: kitKey,
                api_key: kitKey,
                email: "sample.subscriber@example.com",
                first_name: "Sample Lead",
                fields: { lead_magnet: "Test Lead Magnet" },
              }),
            });
          }

          return NextResponse.json({ success: true, user: accountName || "Kit Creator" });
        }

        return NextResponse.json({ error: tagsData.message || accountData.message || "Invalid Kit API Key or Secret. Copy from Kit Settings -> Advanced." }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to reach Kit API." }, { status: 500 });
      }
    }

    if (action === "sendTestPipedriveAlert") {
      const apiToken = data?.apiToken || (await AccountModel.findOne({ email: normEmail }))?.pipedriveApiToken;
      if (!apiToken || !apiToken.trim()) {
        return NextResponse.json({ error: "No Pipedrive API token provided." }, { status: 400 });
      }

      try {
        const pdRes = await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${encodeURIComponent(apiToken.trim())}`);
        const pdData = (await pdRes.json().catch(() => null)) || {};
        if (pdRes.ok && pdData.success) {
          return NextResponse.json({ success: true, user: pdData.data?.name || "Pipedrive User" });
        } else {
          return NextResponse.json({ error: pdData.error || "Invalid Pipedrive API token." }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to reach Pipedrive API." }, { status: 500 });
      }
    }

    if (action === "sendTestZapierAlert") {
      const webhookUrl = data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.zapierWebhookUrl;
      if (!webhookUrl) {
        return NextResponse.json({ error: "No Zapier Catch Hook URL provided." }, { status: 400 });
      }

      try {
        const zapRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "test_signup",
            lead_id: "test-lead-123",
            name: "Sample Lead",
            email: "sample.subscriber@example.com",
            lead_magnet_title: "Sample Lead Magnet",
            signed_up_at: new Date().toISOString(),
            custom_answer: "Testing Zapier Integration!",
          }),
        });

        if (!zapRes.ok) {
          const text = await zapRes.text();
          return NextResponse.json({ error: `Zapier returned error: ${text}` }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to reach Zapier webhook." }, { status: 500 });
      }
    }

    if (action === "sendTestSlackAlert") {
      const webhookUrl = data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.slackWebhookUrl;
      if (!webhookUrl) {
        return NextResponse.json({ error: "No Slack Webhook URL provided." }, { status: 400 });
      }

      try {
        const slackRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "🎉 *LeadMagnets Test Alert!*\nSlack integration is connected and working! New lead signups will post here automatically.",
          }),
        });

        if (!slackRes.ok) {
          const text = await slackRes.text();
          return NextResponse.json({ error: `Slack returned error: ${text}` }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to reach Slack webhook." }, { status: 500 });
      }
    }

    if (action === "sendTestLeadAlert") {
      const targetEmail = data.email || normEmail;
      if (!targetEmail) {
        return NextResponse.json({ error: "Target email required for test alert." }, { status: 400 });
      }

      const result = await sendInstantLeadAlert({
        ownerEmail: targetEmail,
        leadEmail: "sample.subscriber@example.com",
        leadName: "Sample Lead",
        pageTitle: "Test Lead Magnet Guide",
        signedUpAt: `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        customAnswer: "Looking to scale leads and email conversions!",
      });

      return NextResponse.json(result);
    }

    if (action === "resendLeadEmail") {
      const { leadId, email: leadEmail, name: leadName, pageTitle } = data;
      const ownerEmail = normEmail || data.ownerEmail;
      if (!ownerEmail || !leadEmail) {
        return NextResponse.json({ error: "Lead and owner email required." }, { status: 400 });
      }

      const result = await sendInstantLeadAlert({
        ownerEmail,
        leadEmail,
        leadName: leadName || "Subscriber",
        pageTitle: pageTitle || "Lead Magnet",
        signedUpAt: new Date().toLocaleString(),
      });

      if (leadId) {
        await LeadModel.updateOne({ id: leadId }, { status: "delivered" });
      }

      return NextResponse.json(result);
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
      if (normEmail) {
        await IntegrationModel.deleteMany({ userEmail: normEmail });
      }
      if (Array.isArray(data) && data.length > 0) {
        const docs = data.map((item: any) => {
          const { _id, ...cleanItem } = item;
          return {
            ...cleanItem,
            userEmail: normEmail || item.userEmail || "",
          };
        });
        await IntegrationModel.insertMany(docs);
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
      // SECURITY: Only delete the resource if it belongs to the logged-in user
      // The duplicate block below this was also removed (dead code that never ran)
      await ResourceModel.deleteOne({ id, userEmail: normEmail });
      return NextResponse.json({ success: true });
    }

    if (action === "addResource") {
      await ResourceModel.create(data);
      return NextResponse.json({ success: true });
    }

    if (action === "sendResetEmail") {
      const { email } = data;
      const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
      if (!account) {
        return NextResponse.json({ error: "Account not found." }, { status: 400 });
      }

      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

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

    if (action === "resetPassword") {
      const { token, newPassword } = data;
      if (!token || !newPassword) {
        return NextResponse.json({ error: "Invalid request parameters." }, { status: 400 });
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

    if (action === "sendVerificationEmail") {
      const { email, name } = data;

      const sendResult = await sendMail({
        to: email.trim(),
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
      });

      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error || "Failed to send verification email." }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
