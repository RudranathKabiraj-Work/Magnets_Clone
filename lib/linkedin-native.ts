/**
 * In-House Native LinkedIn Automation Engine (Zero 3rd-Party Dependencies)
 * 
 * Interacts directly with LinkedIn using authenticated session cookies (li_at, JSESSIONID).
 * Provides end-to-end functionality:
 * 1. Session verification & Profile info retrieval
 * 2. Fetching user's latest posts & comment counts
 * 3. Fetching comments with rich commenter profiles
 * 4. Replying to comments automatically
 * 5. Sending direct messages (DMs) with personalized lead magnet links
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
  const cleanLiAt = session.liAt.trim().replace(/^"|"$/g, "");
  let cleanJSessionId = (session.jsessionId || "ajax:9182374650192837").trim().replace(/^"|"$/g, "");
  if (!cleanJSessionId.startsWith("ajax:")) {
    cleanJSessionId = `ajax:${cleanJSessionId}`;
  }

  const cookieString = `li_at=${cleanLiAt}; JSESSIONID="${cleanJSessionId}"`;

  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/vnd.linkedin.normalized+json+2.1",
    "Accept-Language": "en-US,en;q=0.9",
    "csrf-token": cleanJSessionId,
    "x-li-lang": "en_US",
    "x-restli-protocol-version": "2.0.0",
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
    
    // Fetch Me profile from Voyager API
    const res = await fetch("https://www.linkedin.com/voyager/api/me", {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, error: "LinkedIn session cookie expired or unauthorized. Please refresh your li_at cookie." };
      }
      return { success: false, error: `LinkedIn returned status code: ${res.status}` };
    }

    const data = await res.json();
    
    // Extract profile info from standard voyager response structure
    const miniProfile = data.miniProfile || data.plainId || {};
    const firstName = miniProfile.firstName || data.firstName || "";
    const lastName = miniProfile.lastName || data.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || miniProfile.localizedFirstName || "LinkedIn User";
    const headline = miniProfile.occupation || data.headline || "";
    const id = miniProfile.entityUrn ? miniProfile.entityUrn.replace("urn:li:fs_miniProfile:", "") : (miniProfile.plainId || data.plainId || "unknown");
    const publicIdentifier = miniProfile.publicIdentifier || id;

    // Resolve picture url
    let avatarUrl = "";
    if (miniProfile.picture && miniProfile.picture["com.linkedin.common.VectorImage"]) {
      const vector = miniProfile.picture["com.linkedin.common.VectorImage"];
      const rootUrl = vector.rootUrl || "";
      const artifacts = vector.artifacts || [];
      if (artifacts.length > 0) {
        const bestArtifact = artifacts[artifacts.length - 1];
        avatarUrl = `${rootUrl}${bestArtifact.fileIdentifyingUrlPathSegment}`;
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

/**
 * 2. Fetch User's Latest Posts
 */
export async function fetchUserLinkedInPosts(
  liAt: string,
  profileUrnOrId: string,
  jsessionId?: string,
  limit: number = 20
): Promise<{ success: boolean; posts: LinkedInPostItem[]; error?: string }> {
  try {
    const headers = buildVoyagerHeaders({ liAt, jsessionId });
    
    // Call Voyager feed updates for the profile
    const profileUrn = profileUrnOrId.startsWith("urn:li:fsd_profile:") 
      ? profileUrnOrId 
      : (profileUrnOrId.startsWith("urn:li:") ? profileUrnOrId : `urn:li:fsd_profile:${profileUrnOrId}`);

    const url = `https://www.linkedin.com/voyager/api/identity/profileUpdatesV2?profileUrn=${encodeURIComponent(profileUrn)}&q=memberShareFeed&count=${limit}`;
    
    const res = await fetch(url, { method: "GET", headers });

    if (!res.ok) {
      // Fallback to feed updates
      const fallbackUrl = `https://www.linkedin.com/voyager/api/feed/updates?q=memberShareFeed&count=${limit}`;
      const fallbackRes = await fetch(fallbackUrl, { method: "GET", headers });
      if (!fallbackRes.ok) {
        return { success: false, posts: [], error: `Failed to fetch posts (${res.status})` };
      }
      const data = await fallbackRes.json();
      return parseVoyagerPosts(data);
    }

    const data = await res.json();
    return parseVoyagerPosts(data);
  } catch (err: any) {
    console.error("[LinkedIn Native] Fetch posts error:", err);
    return { success: false, posts: [], error: err.message };
  }
}

function parseVoyagerPosts(data: any): { success: boolean; posts: LinkedInPostItem[] } {
  const posts: LinkedInPostItem[] = [];
  const elements = data.elements || data.included || [];

  for (const el of elements) {
    const urn = el.urn || el.entityUrn || el.id;
    if (!urn) continue;

    // Extract commentary text
    let text = "";
    if (el.commentary && el.commentary.text) {
      text = el.commentary.text.text || el.commentary.text || "";
    } else if (el.text && typeof el.text === "string") {
      text = el.text;
    } else if (el.summary) {
      text = el.summary;
    }

    // Extract social metrics (comments count)
    let commentsCount = 0;
    if (el.totalShareStatistics && typeof el.totalShareStatistics.numComments === "number") {
      commentsCount = el.totalShareStatistics.numComments;
    } else if (el.socialDetail && el.socialDetail.totalSocialActivityCounts) {
      commentsCount = el.socialDetail.totalSocialActivityCounts.numComments || 0;
    }

    const cleanUrn = urn.replace("urn:li:fs_updateV2:", "").replace("urn:li:activity:", "");
    const postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${cleanUrn}`;

    posts.push({
      id: urn,
      social_id: cleanUrn,
      text: text || "LinkedIn Post",
      postUrl,
      commentsCount,
      createdAt: el.created ? new Date(el.created.time).toISOString() : new Date().toISOString(),
    });
  }

  return { success: true, posts };
}

/**
 * 3. Fetch Comments for a specific Post
 */
export async function fetchPostCommentsNative(
  liAt: string,
  postUrn: string,
  jsessionId?: string,
  limit: number = 100
): Promise<{ success: boolean; comments: LinkedInCommentItem[]; error?: string }> {
  try {
    const headers = buildVoyagerHeaders({ liAt, jsessionId });
    
    // Normalize URN
    const targetUrn = postUrn.startsWith("urn:li:") ? postUrn : `urn:li:activity:${postUrn}`;
    const url = `https://www.linkedin.com/voyager/api/feed/comments?q=comments&sortOrder=RELEVANCE&updateUrn=${encodeURIComponent(targetUrn)}&count=${limit}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      return { success: false, comments: [], error: `Failed to fetch comments (${res.status})` };
    }

    const data = await res.json();
    const comments: LinkedInCommentItem[] = [];
    const elements = data.elements || [];

    for (const el of elements) {
      const commentId = el.urn || el.entityUrn || el.id;
      const commentText = el.commentary?.text?.text || el.commentary?.text || el.text || "";
      const commenter = el.commenter || {};
      const miniProfile = commenter["com.linkedin.voyager.feed.MemberActor"]?.miniProfile || commenter.miniProfile || {};

      const authorFirstName = miniProfile.firstName || "";
      const authorLastName = miniProfile.lastName || "";
      const authorFullName = `${authorFirstName} ${authorLastName}`.trim() || miniProfile.localizedFirstName || "LinkedIn User";
      const authorId = miniProfile.entityUrn ? miniProfile.entityUrn.replace("urn:li:fs_miniProfile:", "") : (miniProfile.plainId || "");
      const authorHeadline = miniProfile.occupation || "";
      const publicIdentifier = miniProfile.publicIdentifier || authorId;

      let avatarUrl = "";
      if (miniProfile.picture && miniProfile.picture["com.linkedin.common.VectorImage"]) {
        const vector = miniProfile.picture["com.linkedin.common.VectorImage"];
        const rootUrl = vector.rootUrl || "";
        const artifacts = vector.artifacts || [];
        if (artifacts.length > 0) {
          avatarUrl = `${rootUrl}${artifacts[artifacts.length - 1].fileIdentifyingUrlPathSegment}`;
        }
      }

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

    return { success: true, comments };
  } catch (err: any) {
    console.error("[LinkedIn Native] Fetch comments error:", err);
    return { success: false, comments: [], error: err.message };
  }
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
    });

    if (!res.ok) {
      // If direct DM requires existing connection, attempt sending InMail or Invitation with Note
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
