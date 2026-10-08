import type { DefaultSession } from "next-auth";
import type { AuthMode } from "@/lib/auth-configuration";
import type { BackendTokens } from "@/lib/backend-auth";

declare module "next-auth" {
  interface User {
    backendTokens?: BackendTokens;
  }

  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authMode?: AuthMode;
    authProvider?: string;
    backendTokens?: BackendTokens;
  }
}