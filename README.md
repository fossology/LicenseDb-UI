# LicenseDB Frontend

Next.js App Router with pinned stable releases of `next-intl`, NextAuth.js v4,
and TanStack Query. No prerelease integration libraries are used.

## Getting Started

Install dependencies with `npm ci`. Create `.env.local` from `.env.example` and
configure the values below, then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The root URL redirects to `/en` or `/de` based on the locale cookie and browser
language. Pages and their root layout live in `app/[locale]`.

## Internationalisation

- Supported locales and the default locale are defined in `i18n/routing.ts`.
- Translations live in `messages/en.json` and `messages/de.json`.
- Use `getTranslations` from `next-intl/server` in Server Components and
	`useTranslations` from `next-intl` in Client Components.
- Import locale-aware `Link`, `useRouter`, and `redirect` from `i18n/navigation.ts`.
- `proxy.ts` handles locale detection; API routes and static assets are excluded.
- `i18n/request.ts` uses the stable `next/root-params` API. Locales are prerendered
	with `generateStaticParams`, preserving the existing Cache Components setup.
	The provider tree streams inside Suspense and checks OAuth availability at
	request time, so secrets can be supplied at deployment runtime.
- Translation keys and locales are typed through `i18n/types.d.ts`. When adding a
	locale, update routing, the message loader, the selector, and the message catalog.

## Authentication

Set `AUTH_MODE=credentials` or `AUTH_MODE=oauth`. Only the selected provider is
registered. Missing/invalid configuration disables login and returns `503` from
auth endpoints. All configuration is server-only; never use `NEXT_PUBLIC_` for
secrets. Restart the server after changing auth mode or provider settings.

| Variable | Value |
| --- | --- |
| `NEXTAUTH_URL` | Canonical application origin, HTTPS in production |
| `NEXTAUTH_SECRET` | A strong random secret, generated with `openssl rand -base64 32` |
| `AUTH_MODE` | `credentials` or `oauth` |
| `LICENSEDB_API_URL` | Credentials mode: API base including `/api/v1` |

Production requires HTTPS URLs. HTTP is permitted only for loopback development
URLs. Use a deployment secret manager and never commit `.env.local`.

### Credentials Mode

The supplied backend contract uses **username/password**, not email/password.
The form submits `POST /api/v1/login` with `{username, password}`. An email can
only be used as the username if the backend supports it; this spec does not promise
email login. No browser-side password storage or local password verification is used.

Login returns `{data: {access_token, refresh_token, expires_at}}`. The server
uses that token to fetch `GET /api/v1/users/profile`, expecting `data` to contain
one user, and maps `id`, `display_name`, and `user_email` into the session.
Backend tokens stay in the encrypted HTTP-only NextAuth JWT and are never included
in the browser session JSON. Passwords are never included in the session.

Before expiry, the JWT callback calls `POST /api/v1/refresh-token` with
`{refresh_token}`. Invalid or failed refresh invalidates the app identity. Backend
requests have a ten-second timeout, reject redirects, and do not use public caches.
The backend must enforce password hashing, rate limiting, lockout, and user access
policies. Configure gateway rate limits for frontend auth endpoints as well.
Concurrent requests near expiry can cause concurrent refreshes; configure a safe
refresh-token rotation policy or shared server-side session storage if required.

### OAuth Mode

Configure `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, and optionally `OAUTH_NAME`.
`OAUTH_WELL_KNOWN_URL` is the only endpoint setting and is required. It must point
to a standards-compliant OIDC discovery document; authorization, token, and userinfo
endpoints are discovered automatically. Explicit endpoint settings are not supported.
`OAUTH_SCOPE` defaults to `openid profile email`; any override must include `openid`.
OAuth mode uses ID-token validation and requires PKCE, state, and nonce. Providers
must support these protocol checks. Nonstandard provider protocols require a
dedicated adapter.

Register the callback URL `http://localhost:3000/api/auth/callback/oauth` locally,
or `https://YOUR_ORIGIN/api/auth/callback/oauth` in production. ID-token claims must supply
a stable `sub` or `id`; `OAUTH_PROFILE_ID_CLAIM` can select another top-level claim.
Optional `name`, `email`, and `picture` are mapped into the session.

OAuth mode authenticates the frontend through the identity provider. The supplied
Swagger spec does not document the token/header contract for `/users/oidc`, or how
provider tokens are accepted by protected LicenseDB APIs. No backend OAuth token
exchange or user provisioning is guessed here. That contract must be confirmed
before wiring OAuth users into backend domain operations.

`lib/auth.ts` owns the provider configuration. NextAuth's handlers are exposed at
`/api/auth/[...nextauth]`. The header supports sign-in/sign-out and preserves the
current locale on return. Configuration is read at request time. Switching auth mode
or provider rejects old session identities. User IDs are namespaced by provider.

Sessions use encrypted JWT cookies with an eight-hour lifetime. Provider access
tokens are not exposed to the browser; the session includes a stable user ID for
scoping personal-data query keys. This supplies authentication, not a complete
authorization policy: enforce application permissions on the server at every
protected operation. JWT sessions do not provide immediate server-side revocation;
use a database session adapter if that is required.

`/api/me` is a protected example: it validates the session on the server, returns
`401` for an unauthenticated caller, and never publicly caches personal data. When
using `getServerSession(getAuthOptions())` in Server Components with Cache Components,
keep the session read inside a Suspense boundary, not at the top of a layout.

## Data Fetching

`app/providers.tsx` creates one TanStack `QueryClient` per mounted app instance,
with a 60-second default stale time and one retry. Use `useQuery` and `useMutation`
in Client Components; Server Components can continue using Next.js `fetch`.

`lib/api.ts` provides `fetchJson<T>` with HTTP error handling and AbortSignal
support. `hooks/use-current-user.ts` is an authenticated query example for
`/api/me`, with a user-specific key, no retained inactive cache, and no retries
for client errors. Handle its loading, error, and success states in consuming UI.
The generic return type is a compile-time contract, not runtime JSON validation.

The header clears the query cache before sign-in/sign-out. Scope any additional
personal-data query keys by user identity and never publicly cache protected data.

## Validation

```bash
npm run lint
npm test
npx next typegen
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

Full verification requires a running LicenseDB backend for credentials mode, or
real provider credentials and a registered callback URL for OAuth mode. Check
sign-in, session retrieval, refresh, the protected API, sign-out, and rejection of
unauthenticated requests before deployment.

The unit tests use Node.js native TypeScript stripping; run them with Node.js 22.18+
or Node.js 24+.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
