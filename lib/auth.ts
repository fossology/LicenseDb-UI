import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createOAuthProvider, getAuthConfiguration } from "./auth-configuration";
import { loginWithCredentials, refreshBackendTokens } from "./backend-auth";

export function isAuthConfigured() {
  return getAuthConfiguration().configured;
}

export function getAuthOptions(): NextAuthOptions {
  const config = getAuthConfiguration();
  const providerKey = config.mode === "credentials"
    ? process.env.LICENSEDB_API_URL
    : [process.env.OAUTH_CLIENT_ID, process.env.OAUTH_WELL_KNOWN_URL ?? process.env.OAUTH_AUTHORIZATION_URL].join("|");

  return {
    secret: process.env.NEXTAUTH_SECRET,
    providers: !config.configured
      ? []
      : config.mode === "credentials"
        ? [CredentialsProvider({
            name: "Username and password",
            credentials: {
              username: { label: "Username", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const result = await loginWithCredentials(credentials, process.env.LICENSEDB_API_URL!);
              return result ? { ...result.user, backendTokens: result.tokens } : null;
            },
          })]
        : [createOAuthProvider()],
    session: {
      strategy: "jwt",
      maxAge: 8 * 60 * 60,
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user && account) {
          token.sub = `${account.provider}:${user.id}`;
          token.authMode = config.mode ?? undefined;
          token.authProvider = providerKey;
          token.backendTokens = user.backendTokens;
        }
        if (token.authMode !== config.mode || token.authProvider !== providerKey) return {};
        if (token.backendTokens && Date.now() >= token.backendTokens.expiresAt - 30_000) {
          try {
            token.backendTokens = await refreshBackendTokens(token.backendTokens, process.env.LICENSEDB_API_URL!);
          } catch {
            return {};
          }
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub ?? "";
          if (!token.sub) {
            session.user.name = null;
            session.user.email = null;
            session.user.image = null;
          }
        }
        return session;
      },
    },
  };
}