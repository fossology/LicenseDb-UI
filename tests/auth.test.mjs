import assert from "node:assert/strict";
import { test } from "node:test";
import { createOAuthProvider, getAuthConfiguration } from "../lib/auth-configuration.ts";
import { loginWithCredentials, refreshBackendTokens } from "../lib/backend-auth.ts";

const common = { NEXTAUTH_URL: "https://licenses.example.com", NEXTAUTH_SECRET: "test-only-secret", NODE_ENV: "production" };
const backend = "https://backend.example.com/api/v1";
const tokenData = { access_token: "test-access-token", refresh_token: "test-refresh-token", expires_at: "2099-01-01T00:00:00Z" };

test("credentials mode uses backend configuration, not OAuth secrets", () => {
  const config = getAuthConfiguration({ ...common, AUTH_MODE: "credentials", LICENSEDB_API_URL: backend });
  assert.equal(config.mode, "credentials");
  assert.equal(config.configured, true);
});

test("OAuth supports discovery or complete explicit endpoints", () => {
  const env = { ...common, AUTH_MODE: "oauth", OAUTH_CLIENT_ID: "test-client", OAUTH_CLIENT_SECRET: "test-client-secret" };
  assert.equal(getAuthConfiguration(env).configured, false);
  assert.equal(getAuthConfiguration({ ...env, OAUTH_WELL_KNOWN_URL: "https://identity.example.com/discovery" }).configured, true);
  assert.equal(getAuthConfiguration({ ...env, OAUTH_AUTHORIZATION_URL: "https://identity.example.com/authorize", OAUTH_TOKEN_URL: "https://identity.example.com/token", OAUTH_USERINFO_URL: "https://identity.example.com/userinfo" }).configured, true);
});

test("invalid modes, missing secrets and insecure production URLs fail closed", () => {
  const valid = { ...common, AUTH_MODE: "credentials", LICENSEDB_API_URL: backend };
  for (const override of [{ AUTH_MODE: "unknown" }, { AUTH_MODE: undefined }, { NEXTAUTH_SECRET: "" }, { NEXTAUTH_URL: "http://licenses.example.com" }, { LICENSEDB_API_URL: "http://backend.example.com/api/v1" }, { LICENSEDB_API_URL: "https://user:password@backend.example.com/api/v1" }]) {
    assert.equal(getAuthConfiguration({ ...valid, ...override }).configured, false);
  }
  assert.equal(getAuthConfiguration({ ...valid, NODE_ENV: "development", NEXTAUTH_URL: "http://localhost:3000", LICENSEDB_API_URL: "http://127.0.0.1:4000/api/v1" }).configured, true);
});

test("generic OAuth maps stable identities and enables protocol checks", () => {
  const provider = createOAuthProvider({ OAUTH_WELL_KNOWN_URL: "https://identity.example.com/discovery" });
  assert.equal(provider.id, "oauth");
  assert.equal(provider.idToken, true);
  assert.deepEqual(provider.checks, ["pkce", "state", "nonce"]);
  assert.equal(provider.profile({ sub: "user-123", name: "Example" }).id, "user-123");
  assert.throws(() => provider.profile({ email: "user@example.com" }), /InvalidOAuthProfile/);
  assert.equal(createOAuthProvider({ OAUTH_PROFILE_ID_CLAIM: "account_id" }).profile({ account_id: 42 }).id, "42");
});

test("credentials use the documented login and profile contracts", async (context) => {
  context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    if (url.endsWith("/login")) {
      assert.equal(url, `${backend}/login`);
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body), { username: "fossy", password: "test-password" });
      return Response.json({ status: 200, data: tokenData });
    }
    assert.equal(url, `${backend}/users/profile`);
    assert.equal(options.headers.Authorization, "Bearer test-access-token");
    return Response.json({ status: 200, data: [{ id: "user-123", display_name: "Fossy", user_email: "fossy@example.com", user_level: "ADMIN" }] });
  });
  const result = await loginWithCredentials({ username: " fossy ", password: "test-password" }, backend);
  assert.deepEqual(result.user, { id: "user-123", name: "Fossy", email: "fossy@example.com" });
  assert.equal(result.tokens.accessToken, tokenData.access_token);
  assert.equal(result.tokens.refreshToken, tokenData.refresh_token);
});

test("invalid input and wrong passwords never produce a user", async (context) => {
  const fetchMock = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
  assert.equal(await loginWithCredentials({ username: "", password: "password" }, backend), null);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(await loginWithCredentials({ username: "fossy", password: "wrong-password" }, backend), null);
});

test("token refresh uses the backend refresh-token contract", async (context) => {
  context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `${backend}/refresh-token`);
    assert.deepEqual(JSON.parse(options.body), { refresh_token: "old-refresh-token" });
    return Response.json({ status: 200, data: tokenData });
  });
  assert.equal((await refreshBackendTokens({ accessToken: "expired", refreshToken: "old-refresh-token", expiresAt: 0 }, backend)).refreshToken, tokenData.refresh_token);
});

test("invalid backend responses and errors fail without exposing sensitive details", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ data: { access_token: "invalid" } }));
  await assert.rejects(loginWithCredentials({ username: "fossy", password: "password" }, backend), /AuthenticationUnavailable/);
  context.mock.method(globalThis, "fetch", async () => { throw new Error("sensitive backend detail"); });
  await assert.rejects(loginWithCredentials({ username: "fossy", password: "password" }, backend), { message: "AuthenticationUnavailable" });
});