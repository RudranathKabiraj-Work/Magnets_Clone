import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        await dbConnect();
        const cleanEmail = user.email.trim().toLowerCase();

        // Check if user account already exists in MongoDB
        let existing = await AccountModel.findOne({ email: cleanEmail });

        if (!existing) {
          const baseName = user.name || user.email.split("@")[0];
          const rawUsername = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";
          let generatedUsername = rawUsername;
          
          const existingUsername = await AccountModel.findOne({ username: generatedUsername });
          if (existingUsername) {
            generatedUsername = `${rawUsername}${Math.floor(1000 + Math.random() * 9000)}`;
          }

          await AccountModel.create({
            name: user.name || "Google User",
            email: cleanEmail,
            username: generatedUsername,
            password: "",
            plan: "Free",
            brandColor: "#0066B2",
            logo: user.image || null,
            joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            isNewAccount: true,
          });
        }
        return true;
      } catch (err) {
        console.error("Error saving Google OAuth user to database:", err);
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url && url.startsWith("/")) return `${baseUrl}${url}`;
      if (url && new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/register/onboarding`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
