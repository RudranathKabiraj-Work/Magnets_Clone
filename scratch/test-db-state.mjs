import mongoose from "mongoose";

const uri = "mongodb://rudranath_db_user:NuEj8QmDZaj3HA7s@ac-dgiugxg-shard-00-00.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-01.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-02.sppagny.mongodb.net:27017/magnets?ssl=true&replicaSet=atlas-hj066z-shard-0&authSource=admin&appName=Cluster0";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const pages = await db.collection("magnet_pages").find({}).toArray();
  console.log("\n=== ALL MAGNET PAGES ===");
  for (const p of pages) {
    console.log({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      userEmail: p.userEmail,
      url: `https://magnets.bdatech.in/${p.slug}`,
    });
  }

  const accounts = await db.collection("accounts").find({}).toArray();
  console.log(`Found ${accounts.length} accounts`);
  for (const acc of accounts) {
    console.log("-----------------------------------------");
    console.log("Account Email:", acc.email);
    console.log("Username:", acc.username);
    console.log("LinkedIn Connected:", acc.linkedinConnected);
    console.log("LinkedIn Account Name:", acc.linkedinAccountName);
    console.log("Has LiAt:", !!acc.linkedinLiAt);
    console.log("Has JSession:", !!acc.linkedinJSessionId);
    console.log("Default Magnet ID:", acc.linkedinDefaultMagnetId);
    console.log("Trigger Word:", acc.linkedinTriggerWord);
    console.log("Campaigns:", JSON.stringify(acc.linkedinPostCampaigns, null, 2));
  }

  const leads = await db.collection("leads").find({ source: "linkedin-comment" }).toArray();
  console.log("\nLinkedIn Leads Count:", leads.length);
  for (const l of leads.slice(-3)) {
    console.log(l);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
