import { z } from "zod"

/**
 * Auth environment. `AUTH_PROVIDER` picks the whole stack (docs/providers.md): `neon-auth` = Neon Auth + Neon
 * Postgres, `supabase` = Supabase Auth + PostgREST. Each branch lists only its own variables.
 * Not `server-only` so `proxy.ts` can read it; client components must not import it (ESLint rule).
 * `process.env.X` is referenced literally so `NEXT_PUBLIC_*` stay inlinable.
 */
export function getAuthSchema(isProd = process.env.NODE_ENV === "production") {
  return z.discriminatedUnion("AUTH_PROVIDER", [
    z.object({
      AUTH_PROVIDER: z.literal("supabase"),
      NEXT_PUBLIC_SUPABASE_URL: isProd
        ? z.url()
        : z.url().default("http://127.0.0.1:54321"),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: isProd
        ? z.string().min(1)
        : z.string().min(1).default("sb_publishable_placeholder"),
    }),
    z.object({
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
    }),
    z.object({
      AUTH_PROVIDER: z.literal("keycloak"),
      KEYCLOAK_ISSUER: z.url().default("http://localhost:8080/realms/studio"),
      KEYCLOAK_CLIENT_ID: z.string().min(1).default("studio-app"),
      KEYCLOAK_CLIENT_SECRET: isProd
        ? z.string().min(1, "KEYCLOAK_CLIENT_SECRET is required in production")
        : z
            .string()
            .min(1)
            .default("studio-dev-client-secret-at-least-32-chars"),
    }),
    z.object({
      AUTH_PROVIDER: z.literal("fastapi-oauth"),
      // The backend issues the tokens itself (OAuth2 password flow).
      API_BASE_URL: z.url().default("http://localhost:8000"),
      // HS256 secret shared with the backend's own JWT_SECRET_KEY: this service is
      // both issuer and verifier, so there is no JWKS endpoint to fetch a public key from.
      JWT_SECRET_KEY: isProd
        ? z
            .string()
            .min(
              32,
              "JWT_SECRET_KEY must be at least 32 characters in production"
            )
        : z.string().min(32).default("change-me-to-a-random-64-char-secret"),
    }),
  ])
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
  const schema = getAuthSchema(isProd)
  return schema.parse({
    AUTH_PROVIDER: env.AUTH_PROVIDER || "neon-auth",
    NEXT_PUBLIC_SUPABASE_URL:
      env.NEXT_PUBLIC_SUPABASE_URL ||
      (!isProd ? "http://127.0.0.1:54321" : undefined),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      (!isProd ? "sb_publishable_placeholder" : undefined),
    NEON_AUTH_BASE_URL: env.NEON_AUTH_BASE_URL || undefined,
    NEON_AUTH_COOKIE_SECRET:
      env.NEON_AUTH_COOKIE_SECRET ||
      (!isProd ? "placeholder-secret-at-least-32-characters-long" : undefined),
    KEYCLOAK_ISSUER: env.KEYCLOAK_ISSUER,
    KEYCLOAK_CLIENT_ID: env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET:
      env.KEYCLOAK_CLIENT_SECRET ||
      (!isProd ? "studio-dev-client-secret-at-least-32-chars" : undefined),
    API_BASE_URL: env.API_BASE_URL,
    JWT_SECRET_KEY:
      env.JWT_SECRET_KEY ||
      (!isProd ? "change-me-to-a-random-64-char-secret" : undefined),
  })
}

export const authConfig: AuthConfig = parseAuthConfig()
