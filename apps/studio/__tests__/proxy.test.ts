import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const update = vi.hoisted(() => vi.fn())
const session = vi.hoisted(() => ({
  isAuthenticated: false,
  role: null as "user" | "admin" | null,
}))

vi.mock("@workspace/auth/proxy", () => ({
  updateSession: async (...args: unknown[]) => {
    update(...args)
    return { response: NextResponse.next(), ...session }
  },
  redirectWithSession: (url: URL, res: NextResponse) => {
    const redirect = NextResponse.redirect(url)
    for (const cookie of res.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  },
}))

const { proxy } = await import("../proxy")

const go = (path: string) =>
  proxy(new NextRequest(`http://localhost:3001${path}`))
const location = (res: Response) =>
  res.headers.get("location")?.replace("http://localhost:3001", "") ?? null

describe("proxy", () => {
  beforeEach(() => {
    session.isAuthenticated = false
    session.role = null
    update.mockClear()
  })

  it.each([
    ["/dashboard", "/login?callbackUrl=%2Fdashboard"],
    [
      "/dashboard/deadlines?tab=1",
      "/login?callbackUrl=%2Fdashboard%2Fdeadlines%3Ftab%3D1",
    ],
    ["/admin", "/login?callbackUrl=%2Fadmin"],
  ])("sends a guest on %s to the login page", async (path, expected) => {
    const res = await go(path)
    expect(res.status).toBe(307)
    expect(location(res)).toBe(expected)
  })

  it("lets a guest see public pages and /403", async () => {
    for (const path of ["/", "/deadlines", "/deadlines/1", "/login", "/403"]) {
      expect(location(await go(path))).toBeNull()
    }
  })

  it("sends a user to /403 for /admin", async () => {
    session.isAuthenticated = true
    session.role = "user"
    expect(location(await go("/admin"))).toBe("/403")
    expect(location(await go("/admin/x"))).toBe("/403")
  })

  it("lets an admin into /admin", async () => {
    session.isAuthenticated = true
    session.role = "admin"
    expect(location(await go("/admin"))).toBeNull()
  })

  it("passes an unknown role through (the page enforces it)", async () => {
    session.isAuthenticated = true
    session.role = null
    expect(location(await go("/admin"))).toBeNull()
  })

  it("asks the session reader to mint the role only for /admin*", async () => {
    await go("/admin")
    await go("/dashboard")
    const flags = update.mock.calls.map(([, options]) => options.mintRole)
    expect(flags).toEqual([true, false])
  })

  it("lets a user into /dashboard", async () => {
    session.isAuthenticated = true
    session.role = "user"
    expect(location(await go("/dashboard"))).toBeNull()
  })

  it("sends a signed-in user away from /login", async () => {
    session.isAuthenticated = true
    session.role = "user"
    expect(location(await go("/login"))).toBe("/dashboard")
  })

  it("allows a signed-in user to reach /login with switch=1", async () => {
    session.isAuthenticated = true
    session.role = "user"
    expect(location(await go("/login?switch=1"))).toBeNull()
  })

  it("sends an authenticated user on / straight to /dashboard", async () => {
    session.isAuthenticated = true
    session.role = "user"
    expect(location(await go("/"))).toBe("/dashboard")
  })
})
