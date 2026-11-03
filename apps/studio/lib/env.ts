import "server-only"

import { z } from "zod"

/**
 * Validated server-side environment. Server-only: secrets never reach the client.
 * Public (`NEXT_PUBLIC_*`) variables live in `env.public.ts`.
 *
 * Every variable read here must also be declared in `turbo.json` (`build.env`),
 * otherwise Turborepo's strict env mode hides it from the task.
 */
const serverSchema = z
  .object({
    API_BASE_URL: z.url().default("http://localhost:8000"),
    // Data path, independent of AUTH_PROVIDER (docs/providers.md section 0): `mock` = in-memory demo, `neon` = Neon Postgres.
    DATA_PROVIDER: z.enum(["mock", "neon"]).default("mock"),
    AUTH_PROVIDER: z.string().default("neon-auth"),
    DATABASE_URL: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.DATA_PROVIDER !== "neon") return
    // A data path pairs with its own identity: Neon Postgres with Neon Auth.
    if (value.AUTH_PROVIDER !== "neon-auth") {
      ctx.addIssue({
        code: "custom",
        path: ["DATA_PROVIDER"],
        message: `DATA_PROVIDER=neon requires AUTH_PROVIDER=neon-auth (got ${value.AUTH_PROVIDER})`,
      })
    }
  })

export type ServerEnv = z.infer<typeof serverSchema>

/**
 * `next build` runs without live runtime secrets (same rule as `parseAuthConfig`): `DATABASE_URL` is required
 * for `neon` only at runtime, where the first query would otherwise fail with a less clear message.
 */
export function parseServerEnv(
  raw: Record<string, string | undefined> = process.env
): ServerEnv {
  const isBuildPhase =
    raw.NEXT_PHASE === "phase-production-build" ||
    raw.SKIP_ENV_VALIDATION === "true" ||
    raw.SKIP_ENV_VALIDATION === "1"
  const env = serverSchema.parse({
    API_BASE_URL: raw.API_BASE_URL || undefined,
    DATA_PROVIDER: raw.DATA_PROVIDER || undefined,
    AUTH_PROVIDER: raw.AUTH_PROVIDER || undefined,
    DATABASE_URL: raw.DATABASE_URL || undefined,
  })
  if (env.DATA_PROVIDER === "neon" && !env.DATABASE_URL && !isBuildPhase) {
    throw new Error("DATABASE_URL is required when DATA_PROVIDER=neon")
  }
  return env
}

export const env = parseServerEnv()
