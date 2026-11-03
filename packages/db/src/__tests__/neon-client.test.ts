import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { withVerifyFull } from "../neon/client"

describe("withVerifyFull", () => {
  it.each(["require", "prefer", "verify-ca"])("upgrades sslmode=%s", (mode) => {
    const url = withVerifyFull(
      `postgresql://u:p@ep-x-pooler.neon.tech/neondb?sslmode=${mode}&channel_binding=require`
    )
    expect(new URL(url).searchParams.get("sslmode")).toBe("verify-full")
    expect(new URL(url).searchParams.get("channel_binding")).toBe("require")
  })

  it("leaves other modes and URLs without sslmode alone", () => {
    expect(withVerifyFull("postgresql://u:p@h/db?sslmode=disable")).toContain(
      "sslmode=disable"
    )
    expect(withVerifyFull("postgresql://u:p@h/db")).not.toContain("sslmode")
  })
})
