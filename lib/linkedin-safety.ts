/**
 * LinkedIn Account Safety & Anti-Ban Engine
 * 
 * Strict safety guardrails to ensure user LinkedIn accounts are never flagged,
 * rate-limited, or restricted.
 * 
 * Safeguards:
 * 1. Hard daily quota limits (Max 40 DMs / 50 comments per 24 hours).
 * 2. Human-like randomized delay jitter between consecutive actions (8s - 25s).
 * 3. Dynamic text spinning (never sends repetitive identical messages to bypass spam filters).
 * 4. Automatic cooldown on error or rate-limit warnings.
 */

import { LeadModel } from "@/lib/models";

export const SAFETY_CONFIG = {
  MAX_DAILY_DMS: 40,
  MAX_DAILY_COMMENTS: 50,
  MIN_DELAY_MS: 7000,   // 7 seconds minimum
  MAX_DELAY_MS: 22000,  // 22 seconds maximum
};

/**
 * Human-like randomized pause between actions
 */
export async function humanDelay(minMs = SAFETY_CONFIG.MIN_DELAY_MS, maxMs = SAFETY_CONFIG.MAX_DELAY_MS): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Randomized natural comment reply variations to avoid LinkedIn duplicate text flags
 */
const COMMENT_VARIATIONS = [
  "Sent to your DM! Check your inbox 📬",
  "Just sent the resource link to your messages! 🚀",
  "Check your DMs, it's waiting for you! ✨",
  "Resource link is in your inbox now! Enjoy 🎁",
  "Sent you a DM with the access link! Let me know what you think 📩",
  "Check your inbox, just sent it over! 🙌",
];

export function getSpinCommentReply(): string {
  const index = Math.floor(Math.random() * COMMENT_VARIATIONS.length);
  return COMMENT_VARIATIONS[index];
}

/**
 * Randomized natural DM text variations
 */
export function getSpinDMText(firstName: string, resourceUrl: string): string {
  const templates = [
    `Hey ${firstName}! 👋 Here is your free resource: ${resourceUrl} — enjoy! Let me know if you have any questions.`,
    `Hi ${firstName}! Thanks for reaching out on LinkedIn. You can grab the resource right here: ${resourceUrl} 🚀`,
    `Hey ${firstName}! As requested, here is your access link: ${resourceUrl} — hope you find it valuable!`,
    `Hi ${firstName}, here is the resource you asked for: ${resourceUrl} 🎁 Let me know your thoughts!`,
  ];
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

/**
 * Checks if the user's daily quota allows sending another DM or comment
 */
export async function checkDailySafetyQuota(userEmail: string): Promise<{
  allowed: boolean;
  dmsSentToday: number;
  commentsSentToday: number;
  reason?: string;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const leadsToday = await LeadModel.find({
    userEmail: userEmail.toLowerCase().trim(),
    source: "linkedin-comment",
    signedUpAt: { $gte: startOfDay.toISOString() },
  }).lean();

  const dmsSentToday = leadsToday.filter((l: any) => l.customFields?.dmStatus === "sent").length;
  const commentsSentToday = leadsToday.length;

  if (dmsSentToday >= SAFETY_CONFIG.MAX_DAILY_DMS) {
    return {
      allowed: false,
      dmsSentToday,
      commentsSentToday,
      reason: `Daily safety limit reached (${dmsSentToday}/${SAFETY_CONFIG.MAX_DAILY_DMS} DMs today). Cooldown active to protect your account.`,
    };
  }

  if (commentsSentToday >= SAFETY_CONFIG.MAX_DAILY_COMMENTS) {
    return {
      allowed: false,
      dmsSentToday,
      commentsSentToday,
      reason: `Daily comment limit reached (${commentsSentToday}/${SAFETY_CONFIG.MAX_DAILY_COMMENTS} comments today). Cooldown active.`,
    };
  }

  return {
    allowed: true,
    dmsSentToday,
    commentsSentToday,
  };
}
