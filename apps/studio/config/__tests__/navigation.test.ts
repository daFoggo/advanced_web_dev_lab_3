import { describe, expect, it } from "vitest"

import { can, type Role } from "@workspace/auth/permissions"

import {
  fillHref,
  filterNav,
  NAV_SCOPES,
  resolveScope,
  sectionsFor,
} from "../navigation"

const hrefsFor = (role: Role) =>
  filterNav(NAV_SCOPES, (action) => can(role, action))
    .flatMap((scope) => scope.sections)
    .flatMap((section) => section.entries)
    .map((entry) => ("href" in entry ? entry.href : ""))

describe("resolveScope", () => {
  it("falls back to the global scope", () => {
    expect(resolveScope(NAV_SCOPES, "/dashboard")?.scope.id).toBe("global")
    expect(resolveScope(NAV_SCOPES, "/admin")?.scope.id).toBe("global")
  })
})

describe("sectionsFor / fillHref", () => {
  it("fills :params in hrefs and encodes the values", () => {
    expect(fillHref("/x/:slug/y", { slug: "a b" })).toBe("/x/a%20b/y")
    expect(fillHref("/x/:slug", {})).toBe("/x/:slug")
  })

  it("lists the dashboard links with real hrefs", () => {
    const hrefs = sectionsFor(NAV_SCOPES, "/dashboard")
      .flatMap((s) => s.entries)
      .map((e) => ("href" in e ? e.href : ""))
    expect(hrefs).toEqual(["/dashboard", "/dashboard/deadlines", "/admin"])
  })
})

describe("filterNav", () => {
  it("drops every link for a role that can do nothing, keeping the scope list", () => {
    const none = filterNav(NAV_SCOPES, () => false)
    expect(none).toHaveLength(NAV_SCOPES.length)
    expect(none.every((scope) => scope.sections.length === 0)).toBe(true)
  })

  it("shows the admin link only to admins", () => {
    expect(hrefsFor("user")).toEqual(["/dashboard", "/dashboard/deadlines"])
    expect(hrefsFor("admin")).toContain("/admin")
  })
})
