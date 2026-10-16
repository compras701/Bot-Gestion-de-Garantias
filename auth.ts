
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      const email = profile?.email?.toLowerCase();
      const emailVerificado =
        profile?.email_verified === true;

      const dominioCorporativo =
        email?.endsWith("@icomsalud.com.ar");

      const dominioGoogle =
        profile?.hd === "icomsalud.com.ar";

      return Boolean(
        emailVerificado &&
        dominioCorporativo &&
        dominioGoogle
      );
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  trustHost: true,
});
