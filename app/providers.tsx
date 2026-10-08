"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext, SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";

export function Providers({
  children,
  authConfigured,
}: {
  children: ReactNode;
  authConfigured: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {authConfigured ? (
        <SessionProvider>{children}</SessionProvider>
      ) : (
        <SessionContext.Provider
          value={{
            data: null,
            status: "unauthenticated",
            update: async () => null,
          }}
        >
          {children}
        </SessionContext.Provider>
      )}
    </QueryClientProvider>
  );
}