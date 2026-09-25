import { LeadModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { dbConnect } from "@/lib/mongodb";

const UNIPILE_DSN = "https://api36.unipile.com:16619";
const UNIPILE_API_KEY = "wOFSf6du.f/PTCdwTaeOqSSw5PaLUCTPVwks++2G3tUtqBXh8gfU=";

/**
 * Production-ready LinkedIn post & comment automation engine.
 * Automatically checks new comments, resolves commenter profiles,
 * matches trigger keywords, dispatches personalized DMs & invites,
 * leaves clean comment acknowledgments, and logs complete prospect CRM leads.
 */
export async function syncUserLinkedInComments(account: any) {
  if (!account || !account.linkedinAccountId || !account.linkedinConnected) {
    return { success: false, message: "LinkedIn account not connected." };
  }

  await dbConnect();
  const accountId = account.linkedinAccountId;
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const appUrl = rawAppUrl.replace(/\/+$/, "");
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

  // 3. Fetch user's latest LinkedIn posts (fetch up to 20 posts)
  let posts: any[] = [];
  try {
    const postEndpoint = profileId
      ? `${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(profileId)}/posts?account_id=${encodeURIComponent(accountId)}&limit=20`
      : `${UNIPILE_DSN}/api/v1/posts?account_id=${encodeURIComponent(accountId)}&limit=20`;

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

  // Cache for resolved author profiles within this run to prevent duplicate API hits
  const authorProfileCache = new Map<string, any>();

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
      const commentRes = await fetch(
        `${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postUrn)}/comments?account_id=${encodeURIComponent(accountId)}&limit=100`,
        {
          headers: { "X-API-KEY": UNIPILE_API_KEY },
        }
      );

      if (!commentRes.ok) continue;
      const commentData = await commentRes.json();
      const comments = commentData.items || [];

      for (const comment of comments) {
        const text = (comment.text || "").toLowerCase().trim();
        const authorDetails = comment.author_details || {};
        const authorId = authorDetails.id || comment.author_id || authorDetails.provider_id;
        const commentId = comment.id || comment.social_id;

        // Skip comments authored by the account owner
        if (authorId && profileId && (authorId === profileId || authorId === accountId)) {
          continue;
        }

        // Filter for trigger word or standard lead magnet keywords
        const hasTrigger =
          (postTriggerWord && text.includes(postTriggerWord)) ||
          text.includes("resource") ||
          text.includes("pdf") ||
          text.includes("guide") ||
          text.includes("send") ||
          text.includes("link");

        if (!hasTrigger) continue;

        // Route to the matching magnet (if comment specifically mentions a different magnet name, or post's assigned magnet)
        let targetMagnet = postMagnet;
        for (const page of livePages) {
          const nameLower = page.name.toLowerCase();
          const slugLower = page.slug.toLowerCase();
          if (text.includes(nameLower) || text.includes(slugLower)) {
            targetMagnet = page;
            break;
          }
        }

        // Precise deduplication check: verify if THIS comment or author on THIS post was already processed
        const deduplicationFilters: any[] = [];
        if (commentId) {
          deduplicationFilters.push({ "customFields.commentId": commentId });
        }
        if (authorId && postUrn) {
          deduplicationFilters.push({
            pageId: targetMagnet.id,
            "customFields.authorId": authorId,
            "customFields.postUrn": postUrn,
          });
        }

        let existingLead = null;
        if (deduplicationFilters.length > 0) {
          existingLead = await LeadModel.findOne({
            userEmail: userEmail,
            $or: deduplicationFilters,
          });
        }

        if (existingLead) {
          // Already sent & logged for this post/comment — skip
          continue;
        }

        // Resolve rich commenter profile (Name, Headline, Public URL, Avatar)
        let authorFirstName = authorDetails.first_name || "";
        let authorLastName = authorDetails.last_name || "";
        let authorFullName = `${authorFirstName} ${authorLastName}`.trim();
        let authorProfileUrl = authorDetails.public_profile_url || (authorId ? `https://linkedin.com/in/${authorId}` : "");
        let authorAvatar = authorDetails.profile_picture_url || authorDetails.avatar_url || "";
        let authorHeadline = authorDetails.headline || "";
        let networkDistance = authorDetails.network_distance || "";

        if ((!authorFullName || authorFullName === "LinkedIn Prospect" || !authorFirstName) && authorId) {
          if (authorProfileCache.has(authorId)) {
            const cached = authorProfileCache.get(authorId);
            authorFirstName = cached.first_name || authorFirstName;
            authorLastName = cached.last_name || authorLastName;
            authorFullName = `${authorFirstName} ${authorLastName}`.trim() || cached.name || authorFullName;
            authorProfileUrl = cached.public_profile_url || authorProfileUrl;
            authorAvatar = cached.profile_picture_url || authorAvatar;
            authorHeadline = cached.headline || authorHeadline;
            networkDistance = cached.network_distance || networkDistance;
          } else {
            try {
              const uRes = await fetch(
                `${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(authorId)}?account_id=${encodeURIComponent(accountId)}`,
                { headers: { "X-API-KEY": UNIPILE_API_KEY } }
              );
              if (uRes.ok) {
                const uData = await uRes.json();
                authorProfileCache.set(authorId, uData);
                authorFirstName = uData.first_name || authorFirstName;
                authorLastName = uData.last_name || authorLastName;
                authorFullName = `${authorFirstName} ${authorLastName}`.trim() || uData.name || authorFullName;
                authorProfileUrl = uData.public_identifier
                  ? `https://www.linkedin.com/in/${uData.public_identifier}`
                  : uData.public_profile_url || authorProfileUrl;
                authorAvatar = uData.profile_picture_url || uData.avatar_url || authorAvatar;
                authorHeadline = uData.headline || authorHeadline;
                networkDistance = uData.network_distance || networkDistance;
              }
            } catch (uErr) {
              console.warn("[LinkedIn Automation] Profile fetch fallback:", uErr);
            }
          }
        }

        const resolvedName = authorFullName || "LinkedIn Prospect";
        const firstName = authorFirstName || resolvedName.split(" ")[0] || "there";

        // Generate Lead Magnet Resource Link with Tracking
        const username = account.username || "u";
        const pageSlug = targetMagnet.slug || targetMagnet.id;
        let baseResourceUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(pageSlug)}`;
        if (account.customDomain && account.domainVerified) {
          baseResourceUrl = `https://${account.customDomain}/${encodeURIComponent(pageSlug)}`;
        }

        const signedUpAt = new Date().toISOString();
        const leadId = `lead_li_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const resourceUrl = `${baseResourceUrl}?li_lead=${leadId}&li_author=${encodeURIComponent(authorId || "")}`;

        const dmText = `Hey ${firstName}! 👋 Here is your free resource: ${resourceUrl} — enjoy! Let me know if you have any questions.`;

        // A. Send Direct Message via Unipile
        let dmSuccess = false;
        if (authorId) {
          try {
            const chatRes = await fetch(`${UNIPILE_DSN}/api/v1/chats`, {
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
            if (chatRes.ok) {
              dmsSent++;
              dmSuccess = true;
            } else {
              // If 2nd/3rd degree connection, send a connection invite with the personal note & link
              try {
                const inviteRes = await fetch(`${UNIPILE_DSN}/api/v1/users/invite`, {
                  method: "POST",
                  headers: {
                    "X-API-KEY": UNIPILE_API_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    account_id: accountId,
                    provider_id: authorId,
                    message: `Hey ${firstName}! Here is the resource you requested: ${resourceUrl}`,
                  }),
                });
                if (inviteRes.ok) {
                  dmsSent++;
                  dmSuccess = true;
                }
              } catch (inviteErr) {
                console.warn("[LinkedIn Automation] Connection invite attempt:", inviteErr);
              }
            }
          } catch (dmErr) {
            console.error("[LinkedIn Automation] DM send error:", dmErr);
          }
        }

        // B. Reply to the public comment (Always keeps the resource link private)
        try {
          const replyText = "Sent to your DM! Check your inbox 📬";

          await fetch(`${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postUrn)}/comments`, {
            method: "POST",
            headers: {
              "X-API-KEY": UNIPILE_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              account_id: accountId,
              comment_id: commentId || comment.id,
              text: replyText,
            }),
          });
        } catch (replyErr) {
          console.error("[LinkedIn Automation] Comment reply error:", replyErr);
        }

        // C. Save Lead in Magnets Database as pending_email with rich profile details
        const cleanNameSlug = resolvedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "prospect";
        const effectiveEmail = `${cleanNameSlug}@linkedin-prospect.com`;

        await LeadModel.create({
          id: leadId,
          userEmail: userEmail,
          name: resolvedName,
          email: effectiveEmail,
          page: targetMagnet.name,
          pageId: targetMagnet.id,
          status: "pending_email",
          source: "linkedin-comment",
          signedUpAt,
          referrer: "linkedin.com",
          deviceType: "desktop",
          tags: ["linkedin", "auto-reply", dmSuccess ? "dm-sent" : "comment-replied"],
          customFields: {
            linkedinProfile: authorProfileUrl,
            linkedinPost: post.social_id ? `https://www.linkedin.com/feed/update/${post.social_id}` : "",
            postUrn: postUrn,
            commentId: commentId || comment.id,
            authorId: authorId,
            avatarUrl: authorAvatar,
            headline: authorHeadline,
            networkDistance: networkDistance,
            commentText: comment.text,
            dmSentAt: signedUpAt,
            dmStatus: dmSuccess ? "sent" : "invited",
            isConverted: false,
          },
        });

        processedCount++;
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

