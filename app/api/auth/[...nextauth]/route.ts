import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        // Check if user account already exists in MongoDB
        const checkRes = await fetch(`${baseUrl}/api/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getAccountByEmail", data: { email: user.email } }),
        });
        const checkData = await checkRes.json();
        
        if (!checkData || !checkData.account) {
          const baseName = user.name || user.email.split("@")[0];
          const generatedUsername = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";

          // Save Google User directly into MongoDB via /api/data endpoint
          await fetch(`${baseUrl}/api/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveAccount",
              data: {
                name: user.name || "Google User",
                email: user.email.trim(),
                username: generatedUsername,
                password: "",
                plan: "Free",
                brandColor: "#0066B2",
                logo: user.image || null,
                joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                isNewAccount: true,
              },
            }),
          });
        }
        return true;
      } catch (err) {
        console.error("Error saving Google OAuth user to database:", err);
        return true;
      }
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/register/onboarding`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
