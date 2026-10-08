import { AppSidebar } from "@/components/app-sidebar";
import { getAuthConfiguration } from "@/lib/auth-configuration";
import { isAuthConfigured } from "@/lib/auth";

export default function Home() {
  const { mode, providerName } = getAuthConfiguration();

  return (
    <AppSidebar
      authConfigured={isAuthConfigured()}
      authMode={mode}
      providerName={providerName}
    />
  );
}