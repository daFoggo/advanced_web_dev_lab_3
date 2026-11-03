import { createNeonAuth } from "@neon/auth/next/server"

import { authConfig } from "../config"

type NeonAuth = ReturnType<typeof createNeonAuth>

// On globalThis so dev hot reloads keep one instance.
const globalForAuth = globalThis as { __neonAuth?: NeonAuth }

/** Not `server-only`: the proxy uses it too. Managed Better Auth (Neon hosts the server; this app proxies `/api/auth/*` and keeps a signed session cookie). */
export function getNeonAuth(): NeonAuth {
  if (authConfig.AUTH_PROVIDER !== "neon-auth") {
    throw new Error("getNeonAuth() requires AUTH_PROVIDER=neon-auth")
  }
  return (globalForAuth.__neonAuth ??= createNeonAuth({
    baseUrl: authConfig.NEON_AUTH_BASE_URL,
    cookies: { secret: authConfig.NEON_AUTH_COOKIE_SECRET },
    // `NEON_AUTH_LOG_LEVEL=debug` shows why the SDK rejected an OAuth exchange or a session.
    logLevel:
      (process.env.NEON_AUTH_LOG_LEVEL as "debug" | "warn" | undefined) ??
      "warn",
  }))
}
