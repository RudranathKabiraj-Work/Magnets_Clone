import { LeadModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { dbConnect } from "@/lib/mongodb";

const UNIPILE_DSN = "https://api36.unipile.com:16619";
const UNIPILE_API_KEY = "wOFSf6du.f/PTCdwTaeOqSSw5PaLUCTPVwks++2G3tUtqBXh8gfU=";

/**
 * Executes a native LinkedIn post & comment sync for a specific account.
 * Automatically checks new comments, matches triggers, dispatches DMs,
 * posts public replies, and creates pending leads in MongoDB.
 */
export async function syncUserLinkedInComments(account: any) {
  if (!account || !account.linkedinAccountId || !account.linkedinConnected) {
    return { success: false, message: "LinkedIn account not connected." };
  }

  await dbConnect();
  const accountId = account.linkedinAccountId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const userEmail = account.email.trim().toLowerCase();

  // 1. Fetch user's live lead magnets
  const livePages = await MagnetPageModel.find({
    userEmail: userEmail,
    status: "live",
  }).lean();

  if (livePages.length === 0) {
    return { success: false, message: "No live lead magnets found for this account." };
  }

  // Determine default active magnet
  let defaultMagnet = livePages.find((p: any) => p.id === account.linkedinDefaultMagnetId) || livePages[0];

  // 2. Resolve LinkedIn Profile info (ID, name, profile picture)
  let profileId = account.linkedinProfileId;
  let profileImage = account.linkedinProfileImage;
  let accountName = account.linkedinAccountName;

  if (!profileId || !profileImage || !accountName) {
    try {
      const meRes = await fetch(`${UNIPILE_DSN}/api/v1/users/me?account_id=${encodeURIComponent(accountId)}`, {
        headers: { "X-API-KEY": UNIPILE_API_KEY },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        profileId = meData.id || meData.provider_id || profileId;
        profileImage = meData.profile_picture_url || meData.profile_picture || meData.avatar_url || meData.avatar || meData.picture_url || profileImage;
        accountName = meData.name || meData.full_name || meData.formatted_name || accountName;

        const updateFields: Record<string, any> = {};
        if (profileId) updateFields.linkedinProfileId = profileId;
        if (profileImage) updateFields.linkedinProfileImage = profileImage;
        if (accountName) updateFields.linkedinAccountName = accountName;

        if (Object.keys(updateFields).length > 0) {
          await AccountModel.updateOne({ email: userEmail }, updateFields);
        }
      }
    } catch (e) {
      console.warn("[LinkedIn Automation] Could not fetch me profile:", e);
    }
  }

  // 3. Fetch user's latest LinkedIn posts
  let posts: any[] = [];
  try {
    const postEndpoint = profileId
      ? `${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(profileId)}/posts?account_id=${encodeURIComponent(accountId)}&limit=3`
      : `${UNIPILE_DSN}/api/v1/posts?account_id=${encodeURIComponent(accountId)}&limit=3`;

    const postRes = await fetch(postEndpoint, {
      headers: { "X-API-KEY": UNIPILE_API_KEY },
    });

    if (postRes.ok) {
      const postData = await postRes.json();
      posts = postData.items || [];
    }
  } catch (e) {
    console.error("[LinkedIn Automation] Failed to fetch posts:", e);
    return { success: false, message: "Failed to fetch LinkedIn posts." };
  }

  if (posts.length === 0) {
    return { success: true, processedCount: 0, message: "No posts found on LinkedIn." };
  }

  let processedCount = 0;
  let dmsSent = 0;
  const globalTriggerWord = (account.linkedinTriggerWord || "resource").toLowerCase().trim();
  const savedCampaigns = account.linkedinPostCampaigns || [];

  // 4. Iterate over posts and inspect comments
  for (const post of posts) {
    const postUrn = post.social_id || post.id;
    if (!postUrn) continue;

    // Check if this post has custom campaign settings
    const postCampaign = savedCampaigns.find((c: any) => c.postId === postUrn || c.postId === post.id);
    if (postCampaign && postCampaign.enabled === false) {
      // Automation is paused for this specific post
      continue;
    }

    const postTriggerWord = (postCampaign?.triggerWord || globalTriggerWord).toLowerCase().trim();
    let postMagnet = defaultMagnet;
    if (postCampaign?.magnetId) {
      const matchedPage = livePages.find((p: any) => p.id === postCampaign.magnetId);
      if (matchedPage) postMagnet = matchedPage;
    }

    try {
      const commentRes = await fetch(`${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postUrn)}/comments?account_id=${encodeURIComponent(accountId)}`, {
        headers: { "X-API-KEY": UNIPILE_API_KEY },
      });

      if (!commentRes.ok) continue;
      const commentData = await commentRes.json();
      const comments = commentData.items || [];

      for (const comment of comments) {
        const text = (comment.text || "").toLowerCase().trim();
        const authorDetails = comment.author_details || {};
        const authorId = authorDetails.id || comment.author_id;
        const authorName = `${authorDetails.first_name || ""} ${authorDetails.last_name || ""}`.trim() || "LinkedIn Prospect";
        const authorProfile = authorDetails.public_profile_url || `https://linkedin.com/in/${authorId}`;
        const networkDistance = authorDetails.network_distance || "DISTANCE_1";

        // Filter for trigger word or "pdf" or "resource"
        const hasTrigger = text.includes(postTriggerWord) || text.includes("resource") || text.includes("pdf") || text.includes("guide");
        if (!hasTrigger) continue;

        // Route to the matching magnet (if comment specifically mentions a different magnet name, or the post's assigned magnet)
        let targetMagnet = postMagnet;
        for (const page of livePages) {
          const nameLower = page.name.toLowerCase();
          const slugLower = page.slug.toLowerCase();
          if (text.includes(nameLower) || text.includes(slugLower)) {
            targetMagnet = page;
            break;
          }
        }

        // Deduplication check in LeadModel
        const existingLead = await LeadModel.findOne({
          userEmail: userEmail,
          pageId: targetMagnet.id,
          $or: [
            { "customFields.linkedinProfile": authorProfile },
            { name: authorName },
          ],
        });

        if (existingLead) {
          // Already sent & logged — skip to avoid duplicate DMs
          continue;
        }

        // If 1st Degree Connection -> Send DM & Reply on Comment
        if (networkDistance === "DISTANCE_1" && authorId) {
          const username = account.username || "u";
          const pageSlug = targetMagnet.slug || targetMagnet.id;
          const resourceUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(pageSlug)}`;

          const dmText = `Hey ${authorDetails.first_name || authorName}! 👋 Here is your free resource: ${resourceUrl} — enjoy! Let me know if you have any questions.`;

          // A. Send Direct Message via Unipile
          try {
            await fetch(`${UNIPILE_DSN}/api/v1/chats`, {
              method: "POST",
              headers: {
                "X-API-KEY": UNIPILE_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                account_id: accountId,
                attendees_ids: [authorId],
                text: dmText,
              }),
            });
            dmsSent++;
          } catch (dmErr) {
            console.error("[LinkedIn Automation] DM send error:", dmErr);
          }

          // B. Reply to the public comment
          try {
            await fetch(`${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postUrn)}/comments`, {
              method: "POST",
              headers: {
                "X-API-KEY": UNIPILE_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                account_id: accountId,
                comment_id: comment.id,
                text: "Sent to your DM! Check your inbox 📬",
              }),
            });
          } catch (replyErr) {
            console.error("[LinkedIn Automation] Comment reply error:", replyErr);
          }

          // C. Save Lead in Magnets Database as pending_email
          const signedUpAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
          const leadId = `lead_li_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const effectiveEmail = `${authorName.toLowerCase().replace(/[^a-z0-9]/g, "")}@linkedin-prospect.com`;

          await LeadModel.create({
            id: leadId,
            userEmail: userEmail,
            name: authorName,
            email: effectiveEmail,
            page: targetMagnet.name,
            pageId: targetMagnet.id,
            status: "pending_email",
            source: "linkedin-comment",
            signedUpAt,
            referrer: "linkedin.com",
            deviceType: "desktop",
            tags: ["linkedin", "auto-reply", "dm-sent"],
            customFields: {
              linkedinProfile: authorProfile,
              linkedinPost: post.social_id ? `https://www.linkedin.com/feed/update/${post.social_id}` : "",
              commentText: comment.text,
              dmSentAt: signedUpAt,
              isConverted: false,
            },
          });

          processedCount++;
        }
      }
    } catch (commentFetchErr) {
      console.error("[LinkedIn Automation] Error reading comments for post:", commentFetchErr);
    }
  }

  return {
    success: true,
    processedCount,
    dmsSent,
    message: `Sync completed. ${dmsSent} new DMs sent & logged.`,
  };
}
