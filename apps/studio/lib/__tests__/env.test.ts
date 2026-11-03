import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { parseServerEnv } from "../env"

describe("parseServerEnv", () => {
  it("defaults to the mock data provider", () => {
    expect(parseServerEnv({}).DATA_PROVIDER).toBe("mock")
  })

  it("requires DATABASE_URL for neon at runtime", () => {
    expect(() => parseServerEnv({ DATA_PROVIDER: "neon" })).toThrow(
      "DATABASE_URL is required"
    )
  })

  it("lets next build run without DATABASE_URL", () => {
    expect(() =>
      parseServerEnv({
        DATA_PROVIDER: "neon",
        NEXT_PHASE: "phase-production-build",
      })
    ).not.toThrow()
  })

  it.each(["neon-auth"])("accepts neon data with %s", (AUTH_PROVIDER) => {
    expect(
      parseServerEnv({
        DATA_PROVIDER: "neon",
        DATABASE_URL: "postgresql://u:p@h/db",
        AUTH_PROVIDER,
      }).DATA_PROVIDER
    ).toBe("neon")
  })

  it.each(["supabase", "fastapi-oauth", "keycloak"])(
    "rejects neon data with %s",
    (AUTH_PROVIDER) => {
      expect(() =>
        parseServerEnv({
          DATA_PROVIDER: "neon",
          DATABASE_URL: "postgresql://u:p@h/db",
          AUTH_PROVIDER,
        })
      ).toThrow("requires AUTH_PROVIDER=neon-auth")
    }
  )

  it("rejects an unknown data provider", () => {
    expect(() => parseServerEnv({ DATA_PROVIDER: "mongo" })).toThrow()
  })
})
