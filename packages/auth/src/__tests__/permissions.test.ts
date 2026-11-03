import { describe, expect, it } from "vitest"

import { can, parseRole, roleOf } from "../permissions"
import type { Action, Role } from "../permissions"

const ALLOWED: Record<Role, readonly Action[]> = {
  guest: ["deadline:view"],
  user: ["deadline:view", "deadline:complete"],
  admin: [
    "deadline:view",
    "deadline:complete",
    "deadline:create",
    "deadline:delete",
  ],
}

const ROLES: Role[] = ["guest", "user", "admin"]
const ACTIONS: Action[] = [
  "deadline:view",
  "deadline:complete",
  "deadline:create",
  "deadline:delete",
]

const CELLS = ROLES.flatMap((role) =>
  ACTIONS.map((action) => [role, action, ALLOWED[role].includes(action)] as const)
)

describe("can (role x action matrix)", () => {
  it("covers all 12 cells", () => {
    expect(CELLS).toHaveLength(12)
  })

  it.each(CELLS)("can(%s, %s) is %s", (role, action, expected) => {
    expect(can(role, action)).toBe(expected)
  })
})

describe("parseRole", () => {
  it("accepts admin", () => {
    expect(parseRole("admin")).toBe("admin")
  })

  it.each(["user", "customer", "editor", undefined, null, "ADMIN", 42])(
    "falls back to user for %j (never admin)",
    (value) => {
      expect(parseRole(value)).toBe("user")
    }
  )
})

describe("roleOf", () => {
  it("is guest without a session", () => {
    expect(roleOf(null)).toBe("guest")
  })

  it("uses the session role", () => {
    expect(roleOf({ role: "admin" })).toBe("admin")
    expect(roleOf({ role: "user" })).toBe("user")
  })
})
