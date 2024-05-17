import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google";

function getGoogleCredentionals() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecure = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || clientID.length === 0) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }
  if (!clientSecure || clientSecure.length === 0) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }

  return { clientID, clientSecure };
}

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(db), // Generation ID staff
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentionals().clientID,
      clientSecret: getGoogleCredentionals().clientSecure,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const dbUser = (await db.get(`user:${token.id}`)) as User | null;

      if (!dbUser) {
        token.id = user!.id;
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
    async session(session, token) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
    },
    redirect() {
      return "/dashboard";
    },
  },
};
