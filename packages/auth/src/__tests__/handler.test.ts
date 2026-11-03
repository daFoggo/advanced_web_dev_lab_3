import { beforeEach, describe, expect, it, vi } from "vitest"

const upstream = vi.hoisted(() => vi.fn(async () => new Response("upstream")))

vi.mock("../neon-auth/auth", () => ({
  getNeonAuth: () => ({
    handler: () => ({
      GET: upstream,
      POST: upstream,
      PUT: upstream,
      PATCH: upstream,
      DELETE: upstream,
    }),
  }),
}))

const { createAuthHandler } = await import("../neon-auth/handler")

const call = (method: "GET" | "POST", path: string[]) =>
  createAuthHandler()[method](
    new Request(`http://localhost:3001/api/auth/${path.join("/")}`, { method }),
    { params: Promise.resolve({ path }) }
  )

describe("createAuthHandler sign-up block", () => {
  beforeEach(() => upstream.mockClear())

  it.each([
    [["sign-up", "email"]],
    [["sign-up"]],
    [["Sign-Up", "email"]],
    [["SIGN-UP", "email"]],
    [["%73ign-up", "email"]],
    [["sign%2Dup", "email"]],
    [[" sign-up", "email"]],
  ])("answers 403 for POST %j without calling Neon", async (path) => {
    const response = await call("POST", path)
    expect(response.status).toBe(403)
    expect(upstream).not.toHaveBeenCalled()
  })

  it("matches the params segment, not a URL substring", async () => {
    const response = await call("POST", ["get-session", "sign-up"])
    expect(response.status).toBe(200)
    expect(upstream).toHaveBeenCalledOnce()
  })

  it.each([
    [["sign-in", "email"]],
    [["sign-out"]],
    [["get-session"]],
    [["sign-upload"]],
  ])("still proxies POST %j", async (path) => {
    const response = await call("POST", path)
    expect(response.status).toBe(200)
    expect(upstream).toHaveBeenCalledOnce()
  })

  it("still proxies GET get-session", async () => {
    expect((await call("GET", ["get-session"])).status).toBe(200)
  })
})
