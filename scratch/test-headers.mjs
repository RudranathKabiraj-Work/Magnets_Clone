import https from "https";

const liAt = "AQEDAW7OpR8Cwd28AAABoN1Rk8AAAAGhAV4XwE4Awj8ytn9sh8soLNH6KBvH_xoAKNRMmp73f3rqiHtlMRV77ML-_jCQeNGKC5KWdj7tnQlZ7NAl0EYEyHr1l6O6G424fno4CfFf4pqhIbXCRPaJXGND";
const jsessionId = "ajax:0642475461929512614";

const options = {
  hostname: "www.linkedin.com",
  port: 443,
  path: "/voyager/api/me",
  method: "GET",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "csrf-token": jsessionId,
    "Cookie": `li_at=${liAt}; JSESSIONID="${jsessionId}"`,
  },
};

const req = https.request(options, (res) => {
  console.log("Status:", res.statusCode);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
});

req.end();
