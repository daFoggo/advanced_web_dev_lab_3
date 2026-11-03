import { SignJWT } from "jose"
import { NextRequest, NextResponse } from "next/server"
import { describe, expect, it, vi } from "vitest"

import { authConfig } from "../config"

// The Neon SDK imports `next/headers` without extension, which Vitest's Node resolver cannot load.
vi.mock("@neon/auth/next/server", () => ({ createNeonAuth: vi.fn() }))

// The SDK middleware (what `mintRole` delegates to) is faked: it answers like the real one, with a Set-Cookie.
const sdkMiddleware = vi.hoisted(() => vi.fn())
vi.mock("../neon-auth/auth", () => ({
  getNeonAuth: () => ({ middleware: () => sdkMiddleware }),
}))

const { redirectWithSession, updateSession } = await import("../proxy")

const OPTIONS = { cookieName: "app-auth" }
const request = (cookie?: string) =>
  new NextRequest("http://localhost:3000/dashboard", {
    headers: cookie ? { cookie } : {},
  })

describe("updateSession", () => {
  it("reports no session and no role when signed out", async () => {
    const result = await updateSession(request(), OPTIONS)
    expect(result).toMatchObject({ isAuthenticated: false, role: null })
  })

  it("reports a session (role unknown to the proxy) when a Neon Auth cookie exists", async () => {
    const result = await updateSession(
      request("neon-auth.session_token=abc"),
      OPTIONS
    )
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })
})

const DATES = {
  expiresAt: "2099-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}
const sign = (
  user: Record<string, unknown>,
  { secret = authConfig.NEON_AUTH_COOKIE_SECRET, exp = "5m" } = {}
) =>
  new SignJWT({
    session: { id: "s1", ...DATES },
    user: { id: "u1", ...DATES, ...user },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret))

describe("updateSession role from session_data", () => {
  const withData = (name: string, value: string) =>
    request(`neon-auth.session_token=abc; ${name}=${value}`)

  it.each([
    ["__Secure-neon-auth.local.session_data"],
    ["neon-auth.local.session_data"],
  ])("reads the admin role from a valid %s", async (name) => {
    const jwt = await sign({ role: "admin" })
    const result = await updateSession(withData(name, jwt), OPTIONS)
    expect(result).toMatchObject({ isAuthenticated: true, role: "admin" })
  })

  it("maps a user role and an unknown role to user", async () => {
    const user = await sign({ role: "user" })
    const odd = await sign({ role: "customer" })
    const none = await sign({})
    for (const jwt of [user, odd, none]) {
      const result = await updateSession(
        withData("neon-auth.local.session_data", jwt),
        OPTIONS
      )
      expect(result.role).toBe("user")
    }
  })

  it("returns role null (still authenticated) for a wrong secret", async () => {
    const jwt = await sign(
      { role: "admin" },
      { secret: "another-secret-that-is-at-least-32-chars" }
    )
    const result = await updateSession(
      withData("neon-auth.local.session_data", jwt),
      OPTIONS
    )
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })

  it("returns role null for an expired token", async () => {
    const jwt = await sign({ role: "admin" }, { exp: "-1m" })
    const result = await updateSession(
      withData("neon-auth.local.session_data", jwt),
      OPTIONS
    )
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })

  it("returns role null for garbage", async () => {
    const result = await updateSession(
      withData("neon-auth.local.session_data", "not-a-jwt"),
      OPTIONS
    )
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })

  it("ignores a session_data cookie that has no session token next to it (the SDK does too)", async () => {
    const jwt = await sign({ role: "admin" })
    const result = await updateSession(
      request(`neon-auth.local.session_data=${jwt}`),
      OPTIONS
    )
    expect(result.role).toBeNull()
  })
})

describe("updateSession mintRole (session_data missing or expired)", () => {
  const withToken = (extra = "") =>
    request(`neon-auth.session_token=abc${extra}`)

  it("mints through the SDK and reads the role of the fresh cookie", async () => {
    const jwt = await sign({ role: "admin" })
    sdkMiddleware.mockResolvedValueOnce(
      NextResponse.next({
        headers: {
          "set-cookie": `__Secure-neon-auth.local.session_data=${jwt}; Path=/; HttpOnly; Secure`,
        },
      })
    )
    const result = await updateSession(withToken(), {
      ...OPTIONS,
      mintRole: true,
    })
    expect(result.role).toBe("admin")
    expect(result.response.cookies.get("__Secure-neon-auth.local.session_data")?.value).toBe(jwt)
  })

  it("keeps role null when the SDK cannot mint (it answers with a redirect)", async () => {
    sdkMiddleware.mockResolvedValueOnce(
      NextResponse.redirect("http://localhost:3000/login")
    )
    const result = await updateSession(withToken(), { ...OPTIONS, mintRole: true })
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })

  it("does not call the SDK when the role is already known, when not asked, or when signed out", async () => {
    sdkMiddleware.mockClear()
    const jwt = await sign({ role: "user" })
    await updateSession(
      withToken(`; neon-auth.local.session_data=${jwt}`),
      { ...OPTIONS, mintRole: true }
    )
    await updateSession(withToken(), OPTIONS)
    await updateSession(request(), { ...OPTIONS, mintRole: true })
    expect(sdkMiddleware).not.toHaveBeenCalled()
  })

  it("survives an SDK failure (role null)", async () => {
    sdkMiddleware.mockRejectedValueOnce(new Error("network"))
    const result = await updateSession(withToken(), { ...OPTIONS, mintRole: true })
    expect(result).toMatchObject({ isAuthenticated: true, role: null })
  })
})

describe("redirectWithSession", () => {
  it("keeps the refreshed cookies and cache headers", () => {
    const session = NextResponse.next()
    session.cookies.set("app-auth", "v")
    session.headers.set("cache-control", "private, no-store")
    const redirect = redirectWithSession(
      new URL("http://localhost:3000/login"),
      session
    )
    expect(redirect.cookies.get("app-auth")?.value).toBe("v")
    expect(redirect.headers.get("cache-control")).toBe("private, no-store")
    expect(redirect.headers.get("location")).toBe("http://localhost:3000/login")
  })
})
