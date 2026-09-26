import https from "https";

const liAt = "AQEDAW7OpR8Cwd28AAABoN1Rk8AAAAGhAV4XwE4Awj8ytn9sh8soLNH6KBvH_xoAKNRMmp73f3rqiHtlMRV77ML-_jCQeNGKC5KWdj7tnQlZ7NAl0EYEyHr1l6O6G424fno4CfFf4pqhIbXCRPaJXGND";
const jsessionId = "ajax:0642475461929512614";

function makeReq(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.linkedin.com",
      port: 443,
      path: path,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/vnd.linkedin.normalized+json+2.1, application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "csrf-token": jsessionId,
        "x-restli-protocol-version": "2.0.0",
        "Cookie": `li_at=${liAt}; JSESSIONID="${jsessionId}"`,
        "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function test() {
  console.log("--- 1. Testing /voyager/api/me ---");
  const r1 = await makeReq("/voyager/api/me");
  console.log("Status:", r1.statusCode);
  console.log("Headers location:", r1.headers["location"]);
  console.log("Body length:", r1.data.length);
  if (r1.data.length < 500) console.log("Body:", r1.data);

  console.log("\n--- 2. Testing Comments ---");
  const r2 = await makeReq("/voyager/api/feed/comments?q=comments&sortOrder=CHRONOLOGICAL&updateUrn=urn%3Ali%3Aactivity%3A7509131466631540736&count=100");
  console.log("Status:", r2.statusCode);
  console.log("Body length:", r2.data.length);
  if (r2.statusCode === 200) {
    try {
      const parsed = JSON.parse(r2.data);
      console.log("Elements count:", parsed.elements?.length);
      console.log("Included count:", parsed.included?.length);
      if (parsed.elements?.length > 0) {
        console.log("First comment:", JSON.stringify(parsed.elements[0], null, 2));
      }
    } catch(e) {
      console.log("Parse error:", e.message);
    }
  }
}

test().catch(console.error);
