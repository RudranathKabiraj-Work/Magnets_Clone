import mongoose from "mongoose";

const uri = "mongodb://rudranath_db_user:NuEj8QmDZaj3HA7s@ac-dgiugxg-shard-00-00.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-01.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-02.sppagny.mongodb.net:27017/magnets?ssl=true&replicaSet=atlas-hj066z-shard-0&authSource=admin&appName=Cluster0";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const acc = await db.collection("accounts").findOne({ email: "rudranath@bda.co.in" });
  console.log("Account found:", acc.email, "liAt exists:", !!acc.linkedinLiAt);

  const liAt = acc.linkedinLiAt;
  const jsessionId = acc.linkedinJSessionId;
  const postId = "7509131466631540736";
  const targetUrn = `urn:li:activity:${postId}`;

  const cleanJsession = (jsessionId || "").replace(/"/g, "").trim();
  const csrf = cleanJsession.startsWith("ajax:") ? cleanJsession : `ajax:${cleanJsession}`;

  const headers = {
    "Cookie": `li_at=${liAt}; JSESSIONID="${cleanJsession}"`,
    "csrf-token": csrf,
    "Accept": "application/vnd.linkedin.normalized+json+2.1, application/json, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Sec-Ch-Ua": '"Chromium";v="133", "Google Chrome";v="133"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };

  const endpoints = [
    `https://www.linkedin.com/voyager/api/feed/comments?q=comments&updateUrn=${encodeURIComponent(targetUrn)}&count=50`,
    `https://www.linkedin.com/voyager/api/feed/updates/${encodeURIComponent(targetUrn)}/comments?count=50`,
    `https://www.linkedin.com/voyager/api/feed/comments?q=comments&sortOrder=RELEVANCE&updateUrn=${encodeURIComponent(targetUrn)}&count=50`,
    `https://www.linkedin.com/voyager/api/identity/profiles/me`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers, redirect: "manual" });
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`Body length: ${text.length}`);
        if (text.length < 500) console.log("Body:", text);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
