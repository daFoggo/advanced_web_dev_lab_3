import { describe, expect, it } from "vitest"

import { parseAuthConfig } from "../config"

describe("parseAuthConfig", () => {
  it("uses default dev placeholders in development/test", () => {
    const config = parseAuthConfig({
      NODE_ENV: "test",
      AUTH_PROVIDER: "better-auth",
    })
    expect(config.AUTH_PROVIDER).toBe("better-auth")
    if (config.AUTH_PROVIDER === "better-auth") {
      expect(config.BETTER_AUTH_SECRET).toBe(
        "placeholder-secret-at-least-32-characters-long"
      )
    }
  })

  it("fails in production if BETTER_AUTH_SECRET is omitted", () => {
    expect(() =>
      parseAuthConfig({
        NODE_ENV: "production",
        AUTH_PROVIDER: "better-auth",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/db",
      })
    ).toThrow()
  })

  it("fails in production if KEYCLOAK_CLIENT_SECRET is omitted", () => {
    expect(() =>
      parseAuthConfig({
        NODE_ENV: "production",
        AUTH_PROVIDER: "keycloak",
      })
    ).toThrow()
  })

  it("fails in production if JWT_SECRET_KEY is omitted for fastapi-oauth", () => {
    expect(() =>
      parseAuthConfig({
        NODE_ENV: "production",
        AUTH_PROVIDER: "fastapi-oauth",
      })
    ).toThrow()
  })

  it("succeeds in production when required secrets are supplied", () => {
    const config = parseAuthConfig({
      NODE_ENV: "production",
      AUTH_PROVIDER: "keycloak",
      KEYCLOAK_CLIENT_SECRET: "my-production-secret-value-long-enough",
    })
    expect(config.AUTH_PROVIDER).toBe("keycloak")
    if (config.AUTH_PROVIDER === "keycloak") {
      expect(config.KEYCLOAK_CLIENT_SECRET).toBe(
        "my-production-secret-value-long-enough"
      )
    }
  })
})
