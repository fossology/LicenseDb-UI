import type { OAuthConfig } from "next-auth/providers/oauth";

export type AuthMode = "credentials" | "oauth";
type AuthEnvironment = Record<string, string | undefined>;

function isAllowedUrl(value: string | undefined, production: boolean) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash || url.search) return false;
    return (
      url.protocol === "https:" ||
      (!production &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    );
  } catch {
    return false;
  }
}

export function getAuthConfiguration(env: AuthEnvironment = process.env) {
  const mode: AuthMode | null =
    env.AUTH_MODE === "credentials" || env.AUTH_MODE === "oauth"
      ? env.AUTH_MODE
      : null;
  const production = env.NODE_ENV === "production";
  const commonConfigured = Boolean(
    env.NEXTAUTH_SECRET && isAllowedUrl(env.NEXTAUTH_URL, production),
  );
  const oauthEndpointsConfigured = env.OAUTH_WELL_KNOWN_URL
    ? isAllowedUrl(env.OAUTH_WELL_KNOWN_URL, production)
    : [env.OAUTH_AUTHORIZATION_URL, env.OAUTH_TOKEN_URL, env.OAUTH_USERINFO_URL]
        .every((url) => isAllowedUrl(url, production));
  const providerConfigured =
    mode === "credentials"
      ? isAllowedUrl(env.LICENSEDB_API_URL, production)
      : mode === "oauth" &&
        Boolean(env.OAUTH_CLIENT_ID && env.OAUTH_CLIENT_SECRET) &&
        oauthEndpointsConfigured;

  return {
    mode,
    configured: commonConfigured && Boolean(providerConfigured),
    providerName: env.OAUTH_NAME?.trim() || "OAuth",
  };
}

export function createOAuthProvider(
  env: AuthEnvironment = process.env,
): OAuthConfig<Record<string, unknown>> {
  const discovery = Boolean(env.OAUTH_WELL_KNOWN_URL);
  const scope = env.OAUTH_SCOPE ?? (discovery ? "openid profile email" : "");

  return {
    id: "oauth",
    name: env.OAUTH_NAME?.trim() || "OAuth",
    type: "oauth",
    clientId: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    wellKnown: discovery ? env.OAUTH_WELL_KNOWN_URL : undefined,
    authorization: {
      url: discovery ? undefined : env.OAUTH_AUTHORIZATION_URL,
      params: scope ? { scope } : {},
    },
    token: discovery ? undefined : env.OAUTH_TOKEN_URL,
    userinfo: discovery ? undefined : env.OAUTH_USERINFO_URL,
    idToken: discovery,
    checks: discovery ? ["pkce", "state", "nonce"] : ["pkce", "state"],
    profile(profile) {
      const id = env.OAUTH_PROFILE_ID_CLAIM
        ? profile[env.OAUTH_PROFILE_ID_CLAIM]
        : (profile.sub ?? profile.id);
      if (
        !(typeof id === "string" && id.trim()) &&
        !(typeof id === "number" && Number.isFinite(id))
      ) {
        throw new Error("InvalidOAuthProfile");
      }
      return {
        id: String(id),
        name: typeof profile.name === "string" ? profile.name : null,
        email: typeof profile.email === "string" ? profile.email : null,
        image: typeof profile.picture === "string" ? profile.picture : null,
      };
    },
  };
}