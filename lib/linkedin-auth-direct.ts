/**
 * Direct LinkedIn Authentication Module (Email & Password + 2FA PIN Support)
 * 
 * Securely handles direct user login, extracts session cookies (li_at),
 * and manages two-factor authentication (2FA/OTP) challenges without third-party services.
 */

import { validateLinkedInSession } from "./linkedin-native";

interface LoginResult {
  success: boolean;
  requiresPin?: boolean;
  challengeId?: string;
  challengeType?: string;
  transactionData?: string;
  session?: {
    liAt: string;
    jsessionId: string;
  };
  profile?: any;
  error?: string;
}

/**
 * Standard User-Agent mimicking a genuine modern browser
 */
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Parse cookies from response 'set-cookie' headers
 */
function parseSetCookies(res: Response): { liAt?: string; jsessionId?: string; cookieHeader: string } {
  const cookieHeader = res.headers.get("set-cookie") || "";
  let liAt = "";
  let jsessionId = "";

  const liAtMatch = cookieHeader.match(/li_at=([^;]+)/);
  if (liAtMatch) liAt = liAtMatch[1];

  const jsessionMatch = cookieHeader.match(/JSESSIONID="?([^;"]+)"?/);
  if (jsessionMatch) jsessionId = jsessionMatch[1];

  return { liAt, jsessionId, cookieHeader };
}

/**
 * Step 1: Login with Email & Password
 */
export async function loginWithLinkedInCredentials(
  email: string,
  pass: string
): Promise<LoginResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: "Please provide both LinkedIn email and password." };
  }

  try {
    // 1. Initial request to obtain CSRF tokens & session cookie
    const initRes = await fetch("https://www.linkedin.com/uas/authenticate", {
      method: "GET",
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const initCookies = initRes.headers.get("set-cookie") || "";
    let csrfToken = "";
    const csrfMatch = initCookies.match(/JSESSIONID="?([^;"]+)"?/);
    if (csrfMatch) csrfToken = csrfMatch[1];

    const bodyParams = new URLSearchParams({
      session_key: cleanEmail,
      session_password: cleanPass,
      isJsEnabled: "true",
      source_alias: "uas-fe-signin",
    });

    if (csrfToken) {
      bodyParams.append("csrfToken", csrfToken);
    }

    // 2. Submit credentials
    const loginRes = await fetch("https://www.linkedin.com/uas/authenticate", {
      method: "POST",
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initCookies,
        "Referer": "https://www.linkedin.com/uas/login",
      },
      body: bodyParams.toString(),
      redirect: "manual",
    });

    const { liAt, jsessionId, cookieHeader } = parseSetCookies(loginRes);

    // If li_at is returned, login is immediately successful!
    if (liAt) {
      const validRes = await validateLinkedInSession(liAt, jsessionId);
      if (validRes.success && validRes.profile) {
        return {
          success: true,
          session: { liAt, jsessionId: jsessionId || "ajax:9182374650192837" },
          profile: validRes.profile,
        };
      }
    }

    // Check if challenge / 2FA is presented
    const location = loginRes.headers.get("location") || "";
    const responseText = await loginRes.text();

    if (location.includes("checkpoint") || location.includes("challenge") || responseText.includes("PIN") || responseText.includes("verification")) {
      // Challenge required
      return {
        success: false,
        requiresPin: true,
        challengeId: `challenge_${Date.now()}`,
        challengeType: "email_or_sms_pin",
        transactionData: cookieHeader || initCookies,
        error: "Two-Factor Verification Required: LinkedIn sent a 6-digit PIN code to your email or phone.",
      };
    }

    // If login failed
    if (loginRes.status === 401 || responseText.includes("incorrect") || responseText.includes("wrong password")) {
      return { success: false, error: "Incorrect LinkedIn email or password. Please check your credentials." };
    }

    return {
      success: false,
      error: "LinkedIn requested additional browser verification. You can also paste your session cookie directly for instant connection.",
    };
  } catch (err: any) {
    console.error("[LinkedIn Direct Auth] Error:", err);
    return { success: false, error: err.message || "Failed to reach LinkedIn login server." };
  }
}

/**
 * Step 2: Submit 2FA / Verification PIN
 */
export async function submitLinkedInChallengePin(
  pin: string,
  transactionData: string
): Promise<LoginResult> {
  const cleanPin = pin.trim();
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: "Please enter the 6-digit PIN sent by LinkedIn." };
  }

  try {
    const payload = new URLSearchParams({
      pin: cleanPin,
      csrfToken: "ajax:9182374650192837",
    });

    const res = await fetch("https://www.linkedin.com/checkpoint/challenge/submit", {
      method: "POST",
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": transactionData,
        "Referer": "https://www.linkedin.com/checkpoint/challenge",
      },
      body: payload.toString(),
      redirect: "manual",
    });

    const { liAt, jsessionId } = parseSetCookies(res);

    if (liAt) {
      const validRes = await validateLinkedInSession(liAt, jsessionId);
      if (validRes.success && validRes.profile) {
        return {
          success: true,
          session: { liAt, jsessionId: jsessionId || "ajax:9182374650192837" },
          profile: validRes.profile,
        };
      }
    }

    return {
      success: false,
      error: "Invalid or expired verification PIN. Please request a new code and try again.",
    };
  } catch (err: any) {
    console.error("[LinkedIn Challenge Submit] Error:", err);
    return { success: false, error: err.message || "Challenge verification failed." };
  }
}
