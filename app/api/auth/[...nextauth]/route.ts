// SPDX-FileCopyrightText: © 2026 Siemens AG
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>
// SPDX-License-Identifier: GPL-2.0-only

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
