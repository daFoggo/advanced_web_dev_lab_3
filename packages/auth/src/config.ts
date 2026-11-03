import { z } from "zod"

/**
 * Auth environment (Neon Auth + Neon Postgres, `AUTH_PROVIDER=neon-auth`).
 * Not `server-only` so `proxy.ts` can read it; client components must not import it (ESLint rule).
 */
export function getAuthSchema(isProd = process.env.NODE_ENV === "production") {
  return z.object({
    AUTH_PROVIDER: z.literal("neon-auth"),
    // Branch Auth URL written by `neon deploy`; the cookie secret signs this app's session cache cookie.
    // `.invalid` never resolves: outside production a missing URL fails at the first request, not at build.
    NEON_AUTH_BASE_URL: isProd
      ? z.url()
      : z.url().default("https://neon-auth.invalid/auth"),
    NEON_AUTH_COOKIE_SECRET: isProd
      ? z
          .string()
          .min(
            32,
            "NEON_AUTH_COOKIE_SECRET must be at least 32 characters in production"
          )
      : z
          .string()
          .min(32)
          .default("placeholder-secret-at-least-32-characters-long"),
  })
}

export const authSchema = getAuthSchema()
export type AuthConfig = z.infer<ReturnType<typeof getAuthSchema>>

export function parseAuthConfig(
  env: Record<string, string | undefined> = process.env
): AuthConfig {
  const isBuildPhase =
    env.NEXT_PHASE === "phase-production-build" ||
    env.SKIP_ENV_VALIDATION === "true" ||
    env.SKIP_ENV_VALIDATION === "1"
  const isProd = env.NODE_ENV === "production" && !isBuildPhase
  return getAuthSchema(isProd).parse({
    AUTH_PROVIDER: env.AUTH_PROVIDER || "neon-auth",
    NEON_AUTH_BASE_URL: env.NEON_AUTH_BASE_URL || undefined,
    NEON_AUTH_COOKIE_SECRET:
      env.NEON_AUTH_COOKIE_SECRET ||
      (!isProd ? "placeholder-secret-at-least-32-characters-long" : undefined),
  })
}

export const authConfig: AuthConfig = parseAuthConfig()
