/**
 * LeadMagnets — LinkedIn Auto-Reply & Comment Engine Service Worker (MV3)
 * 100% In-House | Genuine Browser Execution | Zero Cloudflare Challenges
 */

const DEFAULT_SERVER_URL = "https://magnets.bdatech.in";
const LOCAL_SERVER_URL = "http://localhost:3000";

// Natural text spinning variations for comment replies
const COMMENT_VARIATIONS = [
  "Sent to your DM! Check your inbox 📬",
  "Just sent the resource link to your messages! 🚀",
  "Check your DMs, it's waiting for you! ✨",
  "Resource link is in your inbox now! Enjoy 🎁",
  "Sent you a DM with the access link! Let me know what you think 📩",
  "Check your inbox, just sent it over! 🙌"
];

function getSpinCommentReply() {
  const index = Math.floor(Math.random() * COMMENT_VARIATIONS.length);
  return COMMENT_VARIATIONS[index];
}

function getSpinDMText(firstName, resourceUrl) {
  const templates = [
    `Hey ${firstName}! 👋 Here is your free resource: ${resourceUrl} — enjoy! Let me know if you have any questions.`,
    `Hi ${firstName}! Thanks for reaching out on LinkedIn. You can grab the resource right here: ${resourceUrl} 🚀`,
    `Hey ${firstName}! As requested, here is your access link: ${resourceUrl} — hope you find it valuable!`,
    `Hi ${firstName}, here is the resource you asked for: ${resourceUrl} 🎁 Let me know your thoughts!`
  ];
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Initialize background sync alarm on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[LeadMagnets Extension] Installed. Setting up 5-minute sync alarm...");
  await chrome.alarms.create("linkedin_sync_alarm", { periodInMinutes: 5 });
  await chrome.storage.local.set({
    autoSyncEnabled: true,
    serverUrl: LOCAL_SERVER_URL,
    lastSyncTime: null,
    totalDmsSent: 0,
    totalCommentsReplied: 0
  });
});

// 2. Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "linkedin_sync_alarm") {
    const { autoSyncEnabled } = await chrome.storage.local.get("autoSyncEnabled");
    if (autoSyncEnabled !== false) {
      await runLinkedInSync();
    }
  }
});

// 3. Message passing listener for Popup & Content Scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "RUN_SYNC_NOW") {
    runLinkedInSync()
      .then(res => sendResponse({ success: true, result: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === "GET_STATUS") {
    chrome.storage.local.get([
      "autoSyncEnabled",
      "serverUrl",
      "userEmail",
      "lastSyncTime",
      "lastSyncResult",
      "totalDmsSent",
      "totalCommentsReplied"
    ]).then(data => sendResponse(data));
    return true;
  }
});

/**
 * Executes full LinkedIn comment scan & auto-reply from genuine browser context
 */
async function runLinkedInSync() {
  console.log("[LeadMagnets Extension] Starting sync cycle...");
  const { serverUrl = LOCAL_SERVER_URL, userEmail = "rudranath@bda.co.in" } = await chrome.storage.local.get([
    "serverUrl",
    "userEmail"
  ]);

  // A. Extract active session cookies from browser
  const cookies = await chrome.cookies.getAll({ domain: ".linkedin.com" });
  let liAt = "";
  let jsessionId = "";

  cookies.forEach(c => {
    if (c.name === "li_at") liAt = c.value;
    if (c.name === "JSESSIONID") jsessionId = c.value.replace(/"/g, "");
  });

  if (!liAt) {
    const msg = "No active LinkedIn session found in browser. Please log into LinkedIn in Chrome.";
    await chrome.storage.local.set({ lastSyncResult: msg, lastSyncTime: new Date().toISOString() });
    return { success: false, message: msg };
  }

  // B. Fetch user campaign config from LeadMagnets server
  let config = null;
  try {
    const cfgRes = await fetch(`${serverUrl}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getLinkedInRecentPosts",
        email: userEmail
      })
    });
    if (cfgRes.ok) {
      config = await cfgRes.json();
    }
  } catch (err) {
    console.warn("[LeadMagnets Extension] Server config fetch error:", err.message);
  }

  const posts = config?.posts || [
    {
      postId: "7509131466631540736",
      triggerWord: "resource",
      enabled: true,
      magnetId: "page-1789991531895"
    }
  ];

  let commentsReplied = 0;
  let dmsSent = 0;

  // C. Build browser headers with genuine CSRF token
  const headers = {
    "csrf-token": jsessionId.startsWith("ajax:") ? jsessionId : `ajax:${jsessionId}`,
    "accept": "application/vnd.linkedin.normalized+json+2.1, application/json, text/plain, */*",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US"
  };

  for (const post of posts) {
    if (post.enabled === false) continue;
    const postId = post.postId;
    const targetUrn = `urn:li:activity:${postId.replace(/[^0-9]/g, '')}`;

    try {
      // Fetch comments directly using the active browser session
      const commentUrl = `https://www.linkedin.com/voyager/api/feed/comments?count=50&sortOrder=CHRONOLOGICAL&updateId=${encodeURIComponent(targetUrn)}`;
      const cRes = await fetch(commentUrl, { headers });
      
      if (!cRes.ok) {
        console.warn(`[LeadMagnets] Post ${postId} comments query returned status:`, cRes.status);
        continue;
      }

      const cData = await cRes.json();
      const elements = cData.elements || [];
      const included = cData.included || [];

      // Parse comments
      for (const el of elements) {
        const text = (el.commentary?.text?.text || el.text || "").toLowerCase();
        const trigger = (post.triggerWord || "resource").toLowerCase();

        if (text.includes(trigger) || text.includes("resource") || text.includes("pdf") || text.includes("guide")) {
          const commentUrn = el.urn || el.entityUrn || el.id;
          const commenterUrn = el.commenter?.["com.linkedin.voyager.feed.MemberActor"]?.miniProfile?.entityUrn || "";
          const commenterId = commenterUrn.replace("urn:li:fs_miniProfile:", "").replace("urn:li:fsd_profile:", "");
          const commenterName = el.commenter?.["com.linkedin.voyager.feed.MemberActor"]?.miniProfile?.firstName || "there";

          console.log(`[LeadMagnets] Matched comment by ${commenterName}: "${text}" on post ${postId}`);

          // Anti-ban delay before replying
          await delay(3000);

          // 1. Reply to comment
          const replyText = getSpinCommentReply();
          try {
            await fetch(`https://www.linkedin.com/voyager/api/feed/comments`, {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({
                commentary: { text: { text: replyText } },
                parentCommentUrn: commentUrn
              })
            });
            commentsReplied++;
          } catch (rErr) {
            console.error("Reply error:", rErr);
          }

          // Anti-ban delay before DM
          await delay(4000);

          // 2. Send Direct Message
          const resourceUrl = `https://magnets.bdatech.in/rudranath/hhoo?li_lead=ext_${Date.now()}`;
          const dmText = getSpinDMText(commenterName, resourceUrl);

          if (commenterId) {
            try {
              await fetch(`https://www.linkedin.com/voyager/api/messaging/conversations`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipients: [`urn:li:fsd_profile:${commenterId}`],
                  message: { body: dmText }
                })
              });
              dmsSent++;
            } catch (dmErr) {
              console.error("DM error:", dmErr);
            }
          }
        }
      }
    } catch (postErr) {
      console.error(`[LeadMagnets] Error scanning post ${postId}:`, postErr);
    }
  }

  const { totalDmsSent = 0, totalCommentsReplied = 0 } = await chrome.storage.local.get([
    "totalDmsSent",
    "totalCommentsReplied"
  ]);

  const summary = `Sync completed! Processed and sent ${dmsSent} DMs and ${commentsReplied} comment replies.`;
  await chrome.storage.local.set({
    lastSyncTime: new Date().toISOString(),
    lastSyncResult: summary,
    totalDmsSent: totalDmsSent + dmsSent,
    totalCommentsReplied: totalCommentsReplied + commentsReplied
  });

  return { success: true, dmsSent, commentsReplied, summary };
}
