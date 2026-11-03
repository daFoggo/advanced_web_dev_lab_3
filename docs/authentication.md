# Authentication

How authentication works in the dashboard app (`apps/studio`; `apps/web` is a public landing page with no session) and why. The code lives in
`packages/auth` (`@workspace/auth`) and `packages/db` (`@workspace/db`) so every app shares it.
Applies to Next.js 16.4 with Cache Components enabled.

## 1. Overview

One provider per deployment, chosen by `AUTH_PROVIDER`; it also picks the data path (the whole "stack", see
[providers.md](providers.md) for switching and the seams):

| Provider | Description | Session lives in |
|---|---|---|
| `neon-auth` | Neon Auth (managed Better Auth hosted by Neon); the app proxies `/api/auth/*` and verifies sessions through the SDK | Signed session cookie kept by `@neon/auth` (`__Secure-neon-auth.*`) |
| `supabase` | Supabase Auth via `@supabase/ssr`; ES256 JWT checked locally with `getClaims()`; data through PostgREST + RLS | `sb-<ref>-auth-token` cookies, refreshed only in `proxy.ts` |
| `keycloak` | Keycloak 26 OIDC provider backed by PostgreSQL; RS256 JWT verified locally via JWKS | Split `httpOnly` cookies (`<name>.{access,refresh,id}`), refreshed only in `proxy.ts` |
| `fastapi-oauth` | The FastAPI backend itself is the IdP (OAuth2 password flow, `python-jose`-free: plain `PyJWT` + `bcrypt`); HS256 JWT verified locally with a secret shared between the two services | Split `httpOnly` cookies (`<name>.{access,refresh}`), refreshed only in `proxy.ts` |

All implement `AuthProvider` and expose `Session { userId, accessToken, role, name, email, calendar? }`, so the DAL,
Server Actions and data clients interact through a standard, decoupled contract. The base can run on `supabase`,
`neon-auth`, `keycloak` or `fastapi-oauth` ([providers.md](providers.md)).

Principles:

1. **No network call to learn who the user is on each request**: sessions are validated locally via the session cookie and verified via cached JWKS on the FastAPI backend.
2. **Tokens are refreshed transparently in `proxy.ts`**: Server Components cannot write cookies; proxy manages session extension.
3. **Authorize next to the data** (DAL, Server Actions), not in layouts; `proxy.ts` performs optimistic redirects.
4. **Server Actions are public endpoints**: each authenticates and validates its own input.
5. **Per-user data uses `"use cache: private"`**; secrets never become cache keys or tags. The DAL's `getSession()` is
   private too, so all queries in one request share a single session read and token mint (not one per cache scope).

## 2. Architecture

```
Browser ─cookie─▶ proxy.ts ─▶ updateSession (provider): optimistic cookie check / refresh, isAuthenticated
                     ▼
   Server Component / Action / Route Handler ─▶ lib/dal.ts (getSession · verifySession · verifySessionFresh)
                     ▼
        getAuthProvider() ─▶ packages/auth/src/{neon-auth,supabase,keycloak,fastapi-oauth}/server.ts
                     ▼
         apiFetch ─Bearer JWT─▶ FastAPI Backend (/v1/*)
                                  ▼
                              JWKS (RS256/ES256) or HS256 verification at backend
```

Paths in `apps/studio/` unless they start with `packages/`:
- `proxy.ts`: calls `updateSession(request, AUTH_OPTIONS)` from `@workspace/auth/proxy`, which refreshes the active
  provider's session; `redirectWithSession` keeps the refreshed cookies on redirects.
- `config/auth.ts`: `AUTH_OPTIONS` (this app's cookie name); `lib/auth.ts`: `getAuthProvider()` bound to it.
- `packages/auth/src/neon-auth/{auth,server,proxy,handler}.ts`: `createNeonAuth` singleton, `createNeonAuthProvider()` implementing `AuthProvider`, the optimistic cookie check (and the Google verifier exchange) for `proxy.ts`, and the `/api/auth/*` proxy.
- `packages/auth/src/supabase/{server,proxy}.ts`: `createSupabaseProvider(options)`; `getClaims()` verifies identity, `getUser()` backs
  `verifySessionFresh`, `getSession()` only forwards the already verified token. `app/auth/callback/route.ts` finishes OAuth.
  When a Custom Access Token Hook adds `timezone`, `week_start`, `adopted_on` claims they become `Session.calendar`
  ([providers.md](providers.md) §5); `refreshSession()` reissues the token after settings change (`refreshSessionClaims()`
  in the DAL).
- `@workspace/db/server`: `createDataClient(accessToken)` for feature data on the Supabase stack (RLS applies).
- `app/api/auth/[...path]/route.ts`: `createAuthHandler()` (Neon Auth proxy; 404 on the other stacks).
- `lib/http.ts`: `apiFetch` sending Bearer JWT to FastAPI backend (`API_BASE_URL`).
- `packages/auth/src/fastapi-oauth/{server,proxy}.ts`: `createFastApiOAuthProvider(options)`;
  `client.ts` calls the backend's own `/api/v1/auth/{register,token,refresh}`, `jwt.ts` verifies
  the HS256 signature locally with the secret shared via `JWT_SECRET_KEY` (no JWKS: this backend
  is both issuer and verifier). No OAuth/social login — the backend doesn't implement any.

## 3. Verifying tokens in FastAPI

Only the `keycloak` and `fastapi-oauth` stacks send a Bearer token to FastAPI. Keycloak publishes a JWKS (RS256) the backend caches and checks for `sub`, `aud`, `iss` and `exp`; `fastapi-oauth` signs and verifies its own HS256 tokens.

## Shared packages, per-app cookies and roles

**Auth UI (`apps/studio/features/auth/components`).** The forms hold no logic, so they copy cleanly into another
project: `SignInForm`, `SignUpForm`, `DemoSignInButton`, `OAuthButton`, `SignOutButton`, `SignOutMenuItem`,
`PasswordInput` and `FormError` take the Server Action as an `action` prop (`<SignInForm action={signInAction} />`) and
share the state types in `features/auth/types.ts`. `features/auth/actions.ts` owns the provider, cookie and redirects.
Like Supabase (its sign-in form lives in `apps/studio/components/interfaces/SignIn`, not in a package), the forms stay
in the app that owns the login; they become a package only when a second app needs them. The page frame
(`app/(auth)/_components`, the stack showcase) is the product's look and stays in the app too.

| Export | What it gives |
| :--- | :--- |
| `@workspace/auth/config` | `authConfig`: the `AUTH_PROVIDER` union and each stack's env (not `server-only`; the proxy reads it) |
| `@workspace/auth/server` | `getAuthProvider(options)`: the active provider for one app (`server-only`) |
| `@workspace/auth/proxy` | `updateSession(request, options)`, `redirectWithSession(url, session)` |
| `@workspace/auth/auth-handler` | `createAuthHandler()` for `app/api/auth/[...path]` |
| `@workspace/auth/permissions` | `Role`, `hasPermission`, `parseRole`, `isStaff` |
| `@workspace/auth/types`, `/schemas` | `Session`, `AuthProvider`, `AuthOptions`; `SignInSchema`, `SignUpSchema` |
| `@workspace/db/{public,server,errors,format,types}` | Supabase clients (`createPublicClient` for `"use cache"`, `createDataClient(token)` for RLS as the user), `unwrap`, `DataError`, `formatVnd`, `slugify`, generated `Database` |

**One cookie per app.** `AuthOptions.cookieName` becomes the Supabase cookie name (`cookieOptions.name`) and the Better
Auth cookie prefix (`advanced.cookiePrefix`). The studio uses `nmb-studio-auth`. A second app (a back office) would pick its own name:
in dev apps share `localhost` (ports do not separate cookies), and in production they sit on different domains anyway,
so signing in or out of one never touches the other.

**Roles.** `customer` (default, and the fallback for any missing or unknown value), `editor` (content and records,
may open a staff area), `admin` (editor plus settings and staff). Supabase stores the role in `app_metadata.role`, which
only an admin path can write; never authorize from `user_metadata`. RLS reads the same claim from the JWT, so a role
change applies after the user's token refreshes (sign out and back in to see it at once).

**First admin (once, by hand).** In the Supabase SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = '<email>';
```

Then sign out and back in. Later an admin grants `editor` or `admin` the same way.
