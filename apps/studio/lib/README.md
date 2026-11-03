# lib/

App infrastructure, not tied to one feature. Server-only modules start with `import "server-only"`.

- `env.public.ts`: browser-safe env (`NEXT_PUBLIC_*`).
- `errors.ts`: `getErrorMessage`.
- `dal.ts`: Data Access Layer: `getSession` (`"use cache: private"`, one read per request), `verifySession`,
  `requireCan(action)` (`can(roleOf(session), action)`, else `forbidden()`), `verifySessionFresh`. Call next to the data.
- `auth.ts`: `getAuthProvider()`, the `@workspace/auth` provider (Neon Auth) bound to this app's cookie (`config/auth.ts`).
  The adapter (`neon-auth/`), the auth env (`@workspace/auth/config`) and the proxy session read
  (`@workspace/auth/proxy`) live in `packages/auth`.
