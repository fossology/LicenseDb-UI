import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!isAuthConfigured()) {
    return Response.json(
      { error: "Authentication is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextAuth(getAuthOptions())(request, context);
}

export { handler as GET, handler as POST };