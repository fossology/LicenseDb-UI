"use client";

import { useQuery } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { ApiError, fetchJson } from "@/lib/api";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["current-user", session?.user?.id ?? null],
    queryFn: ({ signal }) =>
      fetchJson<{ user: NonNullable<Session["user"]> }>("/api/me", {
        signal,
        cache: "no-store",
      }),
    enabled: status === "authenticated" && Boolean(session?.user?.id),
    staleTime: 0,
    gcTime: 0,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 1,
  });
}