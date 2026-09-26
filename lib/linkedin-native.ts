/**
 * In-House Native LinkedIn Automation Engine (Zero 3rd-Party Dependencies)
 * 
 * Interacts directly with LinkedIn using authenticated session cookies (li_at, JSESSIONID).
 * Configured with anti-redirect loops (redirect: "manual") and full multi-endpoint fallbacks.
 */

interface LinkedInSession {
  liAt: string;
  jsessionId?: string;
}

interface LinkedInProfile {
  id: string;
  publicIdentifier?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  avatarUrl: string;
}

interface LinkedInPostItem {
  id: string;
  social_id: string;
  text: string;
  postUrl: string;
  commentsCount: number;
  createdAt: string;
}

interface LinkedInCommentItem {
  id: string;
  social_id: string;
  text: string;
  author_id: string;
  author_details: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    headline: string;
    avatar_url: string;
    public_profile_url: string;
  };
}

/**
 * Standard headers required by LinkedIn Voyager APIs
 */
function buildVoyagerHeaders(session: LinkedInSession, customHeaders: Record<string, string> = {}) {
  const rawInput = (session.liAt || "").trim();
  let cookieString = "";
  let cleanJSessionId = (session.jsessionId || "").trim().replace(/^"|"$/g, "");

  if (rawInput.includes("li_at=") || rawInput.includes(";")) {
    cookieString = rawInput;
    // Extract JSESSIONID from cookie string if not provided separately
    if (!cleanJSessionId) {
      const match = rawInput.match(/JSESSIONID="?([^";]+)"?/i);
      if (match) cleanJSessionId = match[1];
    }
  } else {
    const cleanLiAt = rawInput.replace(/^"|"$/g, "");
    if (!cleanJSessionId) cleanJSessionId = "ajax:9182374650192837";
    if (!cleanJSessionId.startsWith("ajax:")) {
      cleanJSessionId = `ajax:${cleanJSessionId}`;
    }
    cookieString = `li_at=${cleanLiAt}; JSESSIONID="${cleanJSessionId}"`;
  }

  if (!cleanJSessionId) cleanJSessionId = "ajax:9182374650192837";
  if (!cleanJSessionId.startsWith("ajax:")) {
    cleanJSessionId = `ajax:${cleanJSessionId}`;
  }

  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Accept": "application/vnd.linkedin.normalized+json+2.1, application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "csrf-token": cleanJSessionId,
    "x-li-lang": "en_US",
    "x-restli-protocol-version": "2.0.0",
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "referer": "https://www.linkedin.com/feed/",
    "Cookie": cookieString,
    ...customHeaders,
  };
}

/**
 * 1. Validate LinkedIn Session and Fetch User Profile
 */
export async function validateLinkedInSession(liAt: string, jsessionId?: string): Promise<{
  success: boolean;
  profile?: LinkedInProfile;
  error?: string;
}> {
  if (!liAt || liAt.trim().length < 15) {
    return { success: false, error: "Invalid li_at cookie format." };
  }

  try {
    const headers = buildVoyagerHeaders({ liAt, jsessionId });
    
    // Fetch Me profile from Voyager API with redirect manual to avoid loops
    const res = await fetch("https://www.linkedin.com/voyager/api/me", {
      method: "GET",
      headers,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      // If redirected to login, session is expired
      const loc = res.headers.get("location") || "";
      if (loc.includes("login") || loc.includes("checkpoint") || loc.includes("auth")) {
        return { success: false, error: "LinkedIn session cookie expired. Please copy a fresh li_at cookie." };
      }
    }

    if (!res.ok && res.status !== 200) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, error: "LinkedIn session cookie expired or unauthorized. Please refresh your li_at cookie." };
      }
      return { success: false, error: `LinkedIn returned status code: ${res.status}` };
    }

    const data = await res.json();
    
    // 1. Extract from miniProfile or root object or included objects
    let miniProfile = data.miniProfile || {};
    
    // Check included array if present
    if (Array.isArray(data.included)) {
      const foundMini = data.included.find(
        (item: any) =>
          item.$type?.includes("MiniProfile") ||
          item.$type?.includes("MemberActor") ||
          item.firstName ||
          item.publicIdentifier
      );
      if (foundMini) {
        miniProfile = { ...foundMini, ...miniProfile };
      }
    }

    let firstName = miniProfile.firstName || data.firstName || data.localizedFirstName || "";
    let lastName = miniProfile.lastName || data.lastName || data.localizedLastName || "";
    let fullName = `${firstName} ${lastName}`.trim() || data.name || data.formattedName || "LinkedIn User";
    let headline = miniProfile.occupation || miniProfile.headline || data.headline || data.occupation || "";
    let id = miniProfile.entityUrn ? miniProfile.entityUrn.replace("urn:li:fs_miniProfile:", "").replace("urn:li:fsd_profile:", "") : (miniProfile.plainId || data.plainId || "me");
    let publicIdentifier = miniProfile.publicIdentifier || data.publicIdentifier || id;

    // Resolve picture url using robust vector extractor
    let avatarUrl = extractVectorImageUrl(miniProfile.picture || data.picture || data.profilePicture);

    // If avatarUrl or fullName is still empty, fetch from profileView
    if ((!avatarUrl || fullName === "LinkedIn User") && publicIdentifier && publicIdentifier !== "me") {
      try {
        const pRes = await fetch(`https://www.linkedin.com/voyager/api/identity/profiles/${encodeURIComponent(publicIdentifier)}`, {
          headers,
          redirect: "manual",
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          firstName = pData.firstName || firstName;
          lastName = pData.lastName || lastName;
          fullName = `${firstName} ${lastName}`.trim() || pData.localizedFirstName || fullName;
          headline = pData.headline || headline;
          if (!avatarUrl && pData.profilePicture) {
            avatarUrl = extractVectorImageUrl(pData.profilePicture);
          }
          if (!avatarUrl && Array.isArray(pData.included)) {
            for (const inc of pData.included) {
              if (inc.picture) {
                avatarUrl = extractVectorImageUrl(inc.picture);
                if (avatarUrl) break;
              }
            }
          }
        }
      } catch (pErr) {
        console.warn("[LinkedIn Native] ProfileView enrichment fallback:", pErr);
      }
    }

    return {
      success: true,
      profile: {
        id,
        publicIdentifier,
        firstName,
        lastName,
        fullName,
        headline,
        avatarUrl,
      },
    };
  } catch (err: any) {
    console.error("[LinkedIn Native] Validation error:", err);
    return { success: false, error: err.message || "Failed to reach LinkedIn API." };
  }
}

function extractVectorImageUrl(pic: any): string {
  if (!pic) return "";
  if (typeof pic === "string" && pic.startsWith("http")) return pic;
  const vector = pic["com.linkedin.common.VectorImage"] || pic.vectorImage || pic;
  if (vector && vector.rootUrl) {
    const rootUrl = vector.rootUrl;
    const artifacts = vector.artifacts || [];
    if (artifacts.length > 0) {
      const best = artifacts[artifacts.length - 1];
      const segment = best.fileIdentifyingUrlPathSegment || best.url || "";
      return `${rootUrl}${segment}`;
    }
  }
  return "";
}

/**
 * 2. Fetch User's Latest Posts with Multi-Endpoint Fallbacks
 */
export async function fetchUserLinkedInPosts(
  liAt: string,
  profileUrnOrId: string,
  jsessionId?: string,
  limit: number = 20
): Promise<{ success: boolean; posts: LinkedInPostItem[]; error?: string }> {
  try {
    const headers = buildVoyagerHeaders({ liAt, jsessionId });
    
    // Normalize profile URN
    const cleanId = (profileUrnOrId || "me").replace("urn:li:fsd_profile:", "").replace("urn:li:fs_miniProfile:", "");
    const profileUrn = cleanId.startsWith("urn:li:") ? cleanId : `urn:li:fsd_profile:${cleanId}`;

    const endpoints = [
      `https://www.linkedin.com/voyager/api/identity/profileUpdatesV2?profileUrn=${encodeURIComponent(profileUrn)}&q=memberShareFeed&count=${limit}`,
      `https://www.linkedin.com/voyager/api/identity/profileUpdatesV2?q=memberShareFeed&count=${limit}`,
      `https://www.linkedin.com/voyager/api/feed/updates?q=memberShareFeed&count=${limit}`,
      `https://www.linkedin.com/voyager/api/feed/updates?moduleKey=member-shares%3Aphone&count=${limit}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers,
          redirect: "manual",
        });

        if (res.ok) {
          const data = await res.json();
          const parsed = parseVoyagerPosts(data);
          if (parsed.posts.length > 0) {
            return parsed;
          }
        }
      } catch (endpointErr) {
        console.warn(`[LinkedIn Native] Endpoint ${url} warning:`, endpointErr);
      }
    }

    return { success: true, posts: [] };
  } catch (err: any) {
    console.error("[LinkedIn Native] Fetch posts error:", err);
    return { success: false, posts: [], error: err.message };
  }
}

function parseVoyagerPosts(data: any): { success: boolean; posts: LinkedInPostItem[] } {
  const posts: LinkedInPostItem[] = [];
  const rawList = [
    ...(data.elements || []),
    ...(data.included || []),
    ...(data.data?.elements || []),
  ];

  for (const el of rawList) {
    const urn = el.urn || el.entityUrn || el.id;
    if (!urn || typeof urn !== "string") continue;

    // Only process update / activity objects
    if (!urn.includes("update") && !urn.includes("activity") && !urn.includes("share")) {
      continue;
    }

    // Extract commentary text across various LinkedIn schema versions
    let text = "";
    if (el.commentary?.text?.text) {
      text = el.commentary.text.text;
    } else if (typeof el.commentary?.text === "string") {
      text = el.commentary.text;
    } else if (el.specificContent?.["com.linkedin.voyager.feed.ShareContent"]?.shareCommentary?.text) {
      text = el.specificContent["com.linkedin.voyager.feed.ShareContent"].shareCommentary.text;
    } else if (typeof el.text === "string") {
      text = el.text;
    } else if (typeof el.summary === "string") {
      text = el.summary;
    } else if (el.header?.text?.text) {
      text = el.header.text.text;
    }

    // Extract comments count
    let commentsCount = 0;
    if (el.totalShareStatistics && typeof el.totalShareStatistics.numComments === "number") {
      commentsCount = el.totalShareStatistics.numComments;
    } else if (el.socialDetail?.totalSocialActivityCounts?.numComments) {
      commentsCount = el.socialDetail.totalSocialActivityCounts.numComments;
    } else if (el.socialActivityCounts?.numComments) {
      commentsCount = el.socialActivityCounts.numComments;
    }

    const cleanUrn = urn.replace("urn:li:fs_updateV2:", "").replace("urn:li:activity:", "").replace("urn:li:share:", "");
    const postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${cleanUrn}`;

    // Deduplicate by cleanUrn
    if (!posts.some((p) => p.social_id === cleanUrn)) {
      posts.push({
        id: urn,
        social_id: cleanUrn,
        text: text || "LinkedIn Post",
        postUrl,
        commentsCount,
        createdAt: el.created ? new Date(el.created.time || el.created).toISOString() : new Date().toISOString(),
      });
    }
  }

  return { success: true, posts };
}

/**
 * 3. Fetch Comments for a specific Post with Multi-Endpoint Fallbacks
 */
export async function fetchPostCommentsNative(
  liAt: string,
  postUrn: string,
  jsessionId?: string,
  limit: number = 100
): Promise<{ success: boolean; comments: LinkedInCommentItem[]; error?: string }> {
  try {
    const headers = buildVoyagerHeaders({ liAt, jsessionId });
    
    // Normalize URN to urn:li:activity:ID
    const cleanId = postUrn.replace("urn:li:activity:", "").replace("urn:li:share:", "").replace("urn:li:fs_updateV2:", "");
    const targetUrn = `urn:li:activity:${cleanId}`;

    const endpoints = [
      `https://www.linkedin.com/voyager/api/feed/comments?q=comments&sortOrder=CHRONOLOGICAL&updateUrn=${encodeURIComponent(targetUrn)}&count=${limit}`,
      `https://www.linkedin.com/voyager/api/feed/comments?q=comments&sortOrder=RELEVANCE&updateUrn=${encodeURIComponent(targetUrn)}&count=${limit}`,
      `https://www.linkedin.com/voyager/api/feed/comments?q=comments&updateUrn=${encodeURIComponent(targetUrn)}&count=${limit}`,
      `https://www.linkedin.com/voyager/api/feed/updates/${encodeURIComponent(targetUrn)}/comments?count=${limit}`,
    ];

    let comments: LinkedInCommentItem[] = [];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers,
          redirect: "manual",
        });

        if (res.ok) {
          const data = await res.json();
          comments = parseVoyagerComments(data);
          if (comments.length > 0) {
            console.log(`[LinkedIn Native] Found ${comments.length} comments from ${url}`);
            return { success: true, comments };
          }
        }
      } catch (endpointErr) {
        console.warn(`[LinkedIn Native] Comment endpoint warning (${url}):`, endpointErr);
      }
    }

    return { success: true, comments: [] };
  } catch (err: any) {
    console.error("[LinkedIn Native] Fetch comments error:", err);
    return { success: false, comments: [], error: err.message };
  }
}

function parseVoyagerComments(data: any): LinkedInCommentItem[] {
  const comments: LinkedInCommentItem[] = [];
  const rawElements = [
    ...(data.elements || []),
    ...(data.included || []),
    ...(data.data?.elements || []),
  ];

  // Build miniProfile lookup map from included array
  const profileMap = new Map<string, any>();
  if (Array.isArray(data.included)) {
    for (const inc of data.included) {
      const urn = inc.entityUrn || inc.urn || inc.id;
      if (urn) profileMap.set(urn, inc);
    }
  }

  for (const el of rawElements) {
    const commentId = el.urn || el.entityUrn || el.id;
    if (!commentId || typeof commentId !== "string") continue;

    // Must be a comment object or component
    if (!commentId.includes("comment") && !el.commentary && !el.commenter) {
      continue;
    }

    // Extract comment text
    let commentText = "";
    if (el.commentary?.text?.text) {
      commentText = el.commentary.text.text;
    } else if (typeof el.commentary?.text === "string") {
      commentText = el.commentary.text;
    } else if (typeof el.text === "string") {
      commentText = el.text;
    } else if (el.value?.commentary?.text?.text) {
      commentText = el.value.commentary.text.text;
    }

    if (!commentText) continue;

    // Resolve author
    let commenter = el.commenter || el.actor || {};
    let miniProfile =
      commenter["com.linkedin.voyager.feed.MemberActor"]?.miniProfile ||
      commenter.miniProfile ||
      commenter;

    // Check profile lookup map if empty
    if (!miniProfile.firstName && el.actor?.miniProfileUrn && profileMap.has(el.actor.miniProfileUrn)) {
      miniProfile = profileMap.get(el.actor.miniProfileUrn);
    }

    const authorFirstName = miniProfile.firstName || miniProfile.localizedFirstName || "";
    const authorLastName = miniProfile.lastName || miniProfile.localizedLastName || "";
    const authorFullName =
      `${authorFirstName} ${authorLastName}`.trim() ||
      miniProfile.name ||
      miniProfile.formattedName ||
      "LinkedIn Prospect";

    const authorId = miniProfile.entityUrn
      ? miniProfile.entityUrn.replace("urn:li:fs_miniProfile:", "").replace("urn:li:fsd_profile:", "")
      : miniProfile.plainId || "";

    const authorHeadline = miniProfile.occupation || miniProfile.headline || "";
    const publicIdentifier = miniProfile.publicIdentifier || authorId;

    let avatarUrl = extractVectorImageUrl(miniProfile.picture || miniProfile.profilePicture);

    if (!comments.some((c) => c.id === commentId)) {
      comments.push({
        id: commentId,
        social_id: commentId,
        text: commentText,
        author_id: authorId,
        author_details: {
          id: authorId,
          first_name: authorFirstName,
          last_name: authorLastName,
          name: authorFullName,
          headline: authorHeadline,
          avatar_url: avatarUrl,
          public_profile_url: publicIdentifier ? `https://www.linkedin.com/in/${publicIdentifier}` : "",
        },
      });
    }
  }

  return comments;
}

/**
 * 4. Post Reply to Comment on LinkedIn
 */
export async function replyToCommentNative(
  liAt: string,
  postUrn: string,
  parentCommentUrn: string,
  replyText: string,
  jsessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = buildVoyagerHeaders(
      { liAt, jsessionId },
      { "Content-Type": "application/json" }
    );

    const targetPostUrn = postUrn.startsWith("urn:li:") ? postUrn : `urn:li:activity:${postUrn}`;

    const payload = {
      commentary: {
        text: {
          text: replyText,
        },
      },
      parentComment: parentCommentUrn,
    };

    const res = await fetch(`https://www.linkedin.com/voyager/api/feed/comments?updateUrn=${encodeURIComponent(targetPostUrn)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Reply failed (${res.status}): ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[LinkedIn Native] Comment reply error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. Send Direct Message (DM) to LinkedIn Prospect
 */
export async function sendDirectMessageNative(
  liAt: string,
  recipientProfileId: string,
  messageText: string,
  jsessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = buildVoyagerHeaders(
      { liAt, jsessionId },
      { "Content-Type": "application/json" }
    );

    const recipientUrn = recipientProfileId.startsWith("urn:li:")
      ? recipientProfileId
      : `urn:li:fsd_profile:${recipientProfileId}`;

    const payload = {
      keyVersion: "LEGACY_INBOX",
      conversationCreate: {
        recipients: [recipientUrn],
        eventCreate: {
          value: {
            "com.linkedin.voyager.messaging.create.MessageCreate": {
              body: messageText,
            },
          },
        },
        subtype: "MEMBER_TO_MEMBER",
      },
    };

    const res = await fetch("https://www.linkedin.com/voyager/api/messaging/conversations?action=create", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
    });

    if (!res.ok) {
      // If direct DM requires existing connection, attempt sending Invitation with Note
      const inviteHeaders = buildVoyagerHeaders(
        { liAt, jsessionId },
        { "Content-Type": "application/json" }
      );

      const invitePayload = {
        invitee: {
          "com.linkedin.voyager.growth.invitation.InviteeProfile": {
            profileId: recipientProfileId.replace("urn:li:fsd_profile:", ""),
          },
        },
        message: messageText,
      };

      const inviteRes = await fetch("https://www.linkedin.com/voyager/api/growth/normInvitations", {
        method: "POST",
        headers: inviteHeaders,
        body: JSON.stringify(invitePayload),
        redirect: "manual",
      });

      if (inviteRes.ok) {
        return { success: true };
      }

      return { success: false, error: `DM and invite request failed (${res.status})` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[LinkedIn Native] DM send error:", err);
    return { success: false, error: err.message };
  }
}
