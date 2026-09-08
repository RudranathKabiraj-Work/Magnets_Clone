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
    const txtDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(fullVerificationHost)}&type=TXT`;
    
    let isVerified = false;
    let dnsMessage = "";

    try {
      const dnsRes = await fetch(txtDnsUrl, { cache: "no-store" });
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
      console.warn("DNS TXT check failed:", dnsErr);
      dnsMessage = `Unable to reach DNS resolution server for ${fullVerificationHost}. Please try again shortly.`;
    }

    // Perform live DNS CNAME lookup for the subdomain
    const fullSubdomainHost = `${cleanSubdomain}.${cleanDomain}`;
    const cnameDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(fullSubdomainHost)}&type=CNAME`;
    const targetCname = "cname.leadmagnets.so";
    let cnameVerified = false;
    let cnameMessage = "";

    try {
      const cnameRes = await fetch(cnameDnsUrl, { cache: "no-store" });
      const cnameData = await cnameRes.json();

      if (cnameData.Answer && Array.isArray(cnameData.Answer)) {
        const cnameRecords = cnameData.Answer.map((ans: any) => (ans.data || "").replace(/\.$/, "").toLowerCase());
        if (cnameRecords.some((rec: string) => rec.includes("leadmagnets") || rec.includes(targetCname))) {
          cnameVerified = true;
          cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${targetCname}.`;
        }
      }

      if (!cnameVerified) {
        cnameMessage = `No CNAME record found pointing ${fullSubdomainHost} to ${targetCname}. Check your DNS settings.`;
      }
    } catch (cnameErr) {
      console.warn("DNS CNAME check failed:", cnameErr);
      cnameMessage = `Unable to reach CNAME resolution server for ${fullSubdomainHost}.`;
    }

    // Determine SSL certificate status
    const sslStatus = (isVerified || cnameVerified) ? "active" : "pending";

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      subdomain: cleanSubdomain,
      fullSubdomainHost,
      verificationHost,
      fullVerificationHost,
      expectedValue,
      cnameTarget: targetCname,
      isVerified,
      cnameVerified,
      sslStatus,
      message: dnsMessage,
      cnameMessage,
    });
  } catch (error: any) {
    console.error("Domain verification API error:", error);
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 });
  }
}
