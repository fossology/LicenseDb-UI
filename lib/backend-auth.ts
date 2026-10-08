export type BackendTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function endpoint(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

function parseTokens(body: unknown, previousRefreshToken?: string): BackendTokens {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("AuthenticationUnavailable");
  }
  const { access_token: accessToken, expires_at: expiresAt } = body.data;
  const refreshToken = body.data.refresh_token ?? previousRefreshToken;
  const expiresAtMs = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  if (
    typeof accessToken !== "string" || !accessToken.trim() ||
    typeof refreshToken !== "string" || !refreshToken.trim() ||
    !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()
  ) {
    throw new Error("AuthenticationUnavailable");
  }
  return { accessToken, refreshToken, expiresAt: expiresAtMs };
}

async function backendRequest(url: string, options: RequestInit) {
  return fetch(url, {
    ...options,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
}

export async function loginWithCredentials(
  credentials: { username?: string; password?: string } | undefined,
  baseUrl: string,
) {
  const username = credentials?.username?.trim() ?? "";
  const password = credentials?.password ?? "";
  if (!username || username.length > 254 || !password || password.length > 4096) {
    return null;
  }

  try {
    const login = await backendRequest(endpoint(baseUrl, "login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (login.status === 401) return null;
    if (!login.ok) throw new Error("AuthenticationUnavailable");
    const tokens = parseTokens(await login.json());

    const profile = await backendRequest(endpoint(baseUrl, "users/profile"), {
      headers: { Authorization: `Bearer ${tokens.accessToken}`, Accept: "application/json" },
    });
    if (!profile.ok) throw new Error("AuthenticationUnavailable");
    const body: unknown = await profile.json();
    if (!isRecord(body) || !Array.isArray(body.data) || body.data.length !== 1) {
      throw new Error("AuthenticationUnavailable");
    }
    const user: unknown = body.data[0];
    if (!isRecord(user) || typeof user.id !== "string" || !user.id.trim()) {
      throw new Error("AuthenticationUnavailable");
    }

    return {
      user: {
        id: user.id,
        name: typeof user.display_name === "string" ? user.display_name : username,
        email: typeof user.user_email === "string" ? user.user_email : null,
      },
      tokens,
    };
  } catch {
    throw new Error("AuthenticationUnavailable");
  }
}

export async function refreshBackendTokens(tokens: BackendTokens, baseUrl: string) {
  try {
    const response = await backendRequest(endpoint(baseUrl, "refresh-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });
    if (!response.ok) throw new Error("AuthenticationUnavailable");
    return parseTokens(await response.json(), tokens.refreshToken);
  } catch {
    throw new Error("AuthenticationUnavailable");
  }
}