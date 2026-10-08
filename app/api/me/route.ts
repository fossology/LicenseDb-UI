import { getServerSession } from "next-auth";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };

  if (!isAuthConfigured()) {
    return Response.json(
      { error: "Authentication is not configured" },
      { status: 503, headers },
    );
  }

  const session = await getServerSession(getAuthOptions());

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  return Response.json({ user: session.user }, { headers });
}