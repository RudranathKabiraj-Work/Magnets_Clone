import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { LeadModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { sendInstantLeadAlert } from "@/lib/email-alerts";
import { sendMail } from "@/lib/email";

export async function handleAddLead(data: any, req: Request, normEmail: string | null) {
  let ownerEmail = normEmail || data.userEmail;
  let pageTitle = data.page || "Lead Magnet";
  let foundPageDoc: any = null;

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
        data.sequenceStep = `Step 1 of ${Math.max(1, seqList.length)} (In Progress)`;
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

  if (ownerEmail) {
    waitUntil((async () => {
      try {
        const ownerAccount = await AccountModel.findOne({ email: ownerEmail.trim().toLowerCase() });
        const alertsEnabled = ownerAccount ? ownerAccount.leadAlertsEnabled !== false : true;
        const targetInbox = (ownerAccount && ownerAccount.notifyEmail) ? ownerAccount.notifyEmail : ownerEmail;

        if (alertsEnabled) {
          try {
            await sendInstantLeadAlert({
              ownerEmail: targetInbox,
              leadEmail: data.email,
              leadName: data.name,
              pageTitle: pageTitle,
              signedUpAt: data.signedUpAt || new Date().toLocaleString(),
              customAnswer: data.customAnswer,
            });
          } catch (err) {
            console.error("Lead Alert Background Error:", err);
          }
        }

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
          let formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

          formattedBodyHtml = formattedBodyHtml.replace(
            /(?<!href=["'])(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/g,
            (_match: string, url: string, ytId: string) => {
              const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              return `<div style="text-align: center; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumb}" alt="Watch Video on YouTube" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a><br/><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066B2; font-weight: 600; text-decoration: underline;">▶ Watch Video on YouTube</a></div>`;
            }
          );

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

          try {
            const res = await sendMail({
              to: data.email.trim(),
              subject: subject,
              html: subscriberHtml,
            });
            if (res.success) {
              console.log(`✅ Deliverable email successfully sent to subscriber: ${data.email}`);
            } else {
              console.error(`❌ Deliverable email sending failed for subscriber ${data.email}:`, res.error);
            }
          } catch (err) {
            console.error("Subscriber Email Dispatch Error:", err);
          }
        }

        if (ownerAccount?.slackWebhookUrl) {
          fetch(ownerAccount.slackWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `🚀 *New Lead Alert!*\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Lead Magnet:* ${pageTitle}`,
            }),
          }).catch((err) => console.error("Slack Webhook dispatch error:", err));
        }

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

export async function handleDeleteLead(data: any, normEmail: string | null) {
  const { id } = data;
  await LeadModel.deleteOne({ id, userEmail: normEmail });
  return NextResponse.json({ success: true });
}

export async function handleSaveLeads(data: any, normEmail: string | null) {
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ success: true });
  }

  // Use bulkWrite upserts instead of deleteMany + insertMany.
  //
  // The old pattern (delete all → re-insert) had a race condition: if two browser
  // tabs saved simultaneously, the second save would overwrite the first, silently
  // dropping any leads the first tab had just written.
  //
  // bulkWrite with upsert:true is atomic per-document: each lead is independently
  // updated (if it exists) or created (if it doesn't). Concurrent saves from
  // multiple tabs can never destroy each other's changes.
  //
  // This matches the pattern already used correctly in handleSavePages.
  const ops = (data as any[]).map((item) => {
    const { _id, ...cleanItem } = item;
    const itemEmail = normEmail || cleanItem.userEmail || "";
    return {
      updateOne: {
        filter: {
          id: cleanItem.id,
          ...(normEmail ? { userEmail: normEmail } : {}),
        },
        update: { $set: { ...cleanItem, userEmail: itemEmail } },
        upsert: true,
      },
    };
  });

  await LeadModel.bulkWrite(ops);
  return NextResponse.json({ success: true });
}


export async function handleSendTestLeadAlert(data: any, normEmail: string | null) {
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

export async function handleResendLeadEmail(data: any, normEmail: string | null) {
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
