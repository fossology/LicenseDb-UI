// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

import { getToken } from "next-auth/jwt";
import { StatusCodes } from "http-status-codes";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { getDashboardData } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: StatusCodes.SERVICE_UNAVAILABLE },
    );
  }

  try {
    return NextResponse.json(
      { data: await getDashboardData(baseUrl, accessToken) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const status =
      error instanceof ApiError ? error.status : StatusCodes.BAD_GATEWAY;
    return NextResponse.json(
      { error: "Unable to load dashboard data" },
      { status },
    );
  }
}
