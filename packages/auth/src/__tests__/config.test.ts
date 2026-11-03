import { describe, expect, it } from "vitest"

import { parseAuthConfig } from "../config"

describe("parseAuthConfig", () => {
  it("uses default dev placeholders in development/test", () => {
    const config = parseAuthConfig({
      NODE_ENV: "test",
      AUTH_PROVIDER: "neon-auth",
    })
    expect(config.AUTH_PROVIDER).toBe("neon-auth")
    if (config.AUTH_PROVIDER === "neon-auth") {
      expect(config.NEON_AUTH_COOKIE_SECRET).toBe(
        "placeholder-secret-at-least-32-characters-long"
      )
    }
  })

  it("permits build phase without live secrets when NEXT_PHASE is phase-production-build", () => {
    const config = parseAuthConfig({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
      AUTH_PROVIDER: "neon-auth",
    })
    expect(config.AUTH_PROVIDER).toBe("neon-auth")
    if (config.AUTH_PROVIDER === "neon-auth") {
      expect(config.NEON_AUTH_COOKIE_SECRET).toBe(
        "placeholder-secret-at-least-32-characters-long"
      )
    }
  })

  it("permits build phase when SKIP_ENV_VALIDATION is true", () => {
    const config = parseAuthConfig({
      NODE_ENV: "production",
      SKIP_ENV_VALIDATION: "true",
      AUTH_PROVIDER: "neon-auth",
    })
    expect(config.AUTH_PROVIDER).toBe("neon-auth")
  })

  it("rejects any provider other than neon-auth", () => {
    expect(() =>
      parseAuthConfig({ NODE_ENV: "test", AUTH_PROVIDER: "supabase" })
    ).toThrow()
  })

  describe("neon-auth", () => {
    it("parses with the Neon URL and a dev cookie secret placeholder", () => {
      const config = parseAuthConfig({
        NODE_ENV: "test",
        AUTH_PROVIDER: "neon-auth",
        NEON_AUTH_BASE_URL: "https://ep-x.neonauth.test/neondb/auth",
      })
      expect(config.AUTH_PROVIDER).toBe("neon-auth")
      if (config.AUTH_PROVIDER === "neon-auth") {
        expect(config.NEON_AUTH_BASE_URL).toContain("neonauth")
        expect(config.NEON_AUTH_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32)
      }
    })

    it("fails in production without the cookie secret or URL", () => {
      expect(() =>
        parseAuthConfig({
          NODE_ENV: "production",
          AUTH_PROVIDER: "neon-auth",
          NEON_AUTH_BASE_URL: "https://ep-x.neonauth.test/neondb/auth",
        })
      ).toThrow()
      expect(() =>
        parseAuthConfig({
          NODE_ENV: "production",
          AUTH_PROVIDER: "neon-auth",
          NEON_AUTH_COOKIE_SECRET: "x".repeat(32),
        })
      ).toThrow()
    })

    it("lets next build run without live secrets", () => {
      expect(() =>
        parseAuthConfig({
          NODE_ENV: "production",
          NEXT_PHASE: "phase-production-build",
          AUTH_PROVIDER: "neon-auth",
        })
      ).not.toThrow()
    })

    it("rejects a short cookie secret in production", () => {
      expect(() =>
        parseAuthConfig({
          NODE_ENV: "production",
          AUTH_PROVIDER: "neon-auth",
          NEON_AUTH_BASE_URL: "https://ep-x.neonauth.test/neondb/auth",
          NEON_AUTH_COOKIE_SECRET: "short",
        })
      ).toThrow()
    })
  })
})
