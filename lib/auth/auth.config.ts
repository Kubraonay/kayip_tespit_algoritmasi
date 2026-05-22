import type { NextAuthConfig } from "next-auth";
import { normalizeUserRole } from "@/lib/auth/permissions";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const rawRole = (user as { role?: string }).role;
        token.role = normalizeUserRole(rawRole) ?? rawRole;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const role = token.role as string | undefined;
        (session.user as { role?: string }).role =
          normalizeUserRole(role) ?? role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const isAuthPage = path === "/login" || path === "/register";

      if (path === "/") {
        return Response.redirect(
          new URL(isLoggedIn ? "/dashboard" : "/login", request.nextUrl)
        );
      }
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      if (path.startsWith("/saha/")) {
        return true;
      }
      if (path.startsWith("/dashboard") && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
};
