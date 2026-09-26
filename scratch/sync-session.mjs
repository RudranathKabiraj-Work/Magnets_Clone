import mongoose from "mongoose";

const uri = "mongodb://rudranath_db_user:NuEj8QmDZaj3HA7s@ac-dgiugxg-shard-00-00.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-01.sppagny.mongodb.net:27017,ac-dgiugxg-shard-00-02.sppagny.mongodb.net:27017/magnets?ssl=true&replicaSet=atlas-hj066z-shard-0&authSource=admin&appName=Cluster0";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const src = await db.collection("accounts").findOne({ email: "kabirajrnkrudra@gmail.com" });
  if (src && src.linkedinLiAt) {
    await db.collection("accounts").updateOne(
      { email: "rudranath@bda.co.in" },
      {
        $set: {
          linkedinConnected: true,
          linkedinLiAt: src.linkedinLiAt,
          linkedinJSessionId: src.linkedinJSessionId,
          linkedinAccountName: src.linkedinAccountName,
          linkedinProfileId: src.linkedinProfileId,
          linkedinProfileImage: src.linkedinProfileImage,
        }
      }
    );
    console.log("SUCCESS: Synced LinkedIn credentials to rudranath@bda.co.in");
  } else {
    console.log("Source account credentials not found");
  }

  const p = await db.collection("magnetpages").find({}).toArray();
  console.log("=== MAGNET PAGES ===");
  console.log(p.map(x => ({ id: x.id, slug: x.slug, title: x.title, userEmail: x.userEmail })));

  await mongoose.disconnect();
}

main().catch(console.error);
