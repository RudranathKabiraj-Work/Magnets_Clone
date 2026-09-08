import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { domain, subdomain } = await req.json();

    if (!domain || !domain.trim()) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const cleanSubdomain = (subdomain || "get").toLowerCase().trim();

    // Generate deterministic hash for verification token
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("md5").update(`leadmagnets_${cleanDomain}`).digest("hex");
    const verificationHost = "leadmagnets-verify";
    const fullVerificationHost = `${verificationHost}.${cleanDomain}`;
    const expectedValue = `leadmagnets-verify-${tokenHash}`;

    // Perform live DNS TXT lookup using Google Public DNS API
    const googleDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(fullVerificationHost)}&type=TXT`;
    
    let isVerified = false;
    let dnsMessage = "";

    try {
      const dnsRes = await fetch(googleDnsUrl, { cache: "no-store" });
      const dnsData = await dnsRes.json();

      if (dnsData.Answer && Array.isArray(dnsData.Answer)) {
        const txtRecords = dnsData.Answer.map((ans: any) => (ans.data || "").replace(/^"|"$/g, ""));
        if (txtRecords.some((txt: string) => txt.includes(expectedValue) || txt.includes("leadmagnets-verify"))) {
          isVerified = true;
          dnsMessage = "Domain ownership successfully verified!";
        }
      }

      if (!isVerified) {
        dnsMessage = `No TXT record found at ${fullVerificationHost}. Check that the root domain above is spelled correctly and that your DNS provider did not append the domain twice. DNS can take 1 to 60 minutes to propagate.`;
      }
    } catch (dnsErr) {
      console.warn("DNS check failed, returning error status:", dnsErr);
      dnsMessage = `Unable to reach DNS resolution server for ${fullVerificationHost}. Please try again shortly.`;
    }

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      subdomain: cleanSubdomain,
      verificationHost,
      fullVerificationHost,
      expectedValue,
      cnameTarget: "cname.leadmagnets.so",
      isVerified,
      message: dnsMessage,
    });
  } catch (error: any) {
    console.error("Domain verification API error:", error);
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 });
  }
}
