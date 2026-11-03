import { describe, expect, it } from "vitest"

import { safeCallbackUrl } from "../safe-redirect"

describe("safeCallbackUrl", () => {
  it.each([
    ["/dashboard/deadlines", "/dashboard/deadlines"],
    ["/admin", "/admin"],
    ["/dashboard?tab=1", "/dashboard?tab=1"],
    ["/deadlines/3#top", "/deadlines/3#top"],
  ])("keeps the internal path %s", (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected)
  })

  it.each([
    ["absolute https URL", "https://evil.com"],
    ["absolute http URL", "http://evil.com/dashboard"],
    ["protocol-relative", "//evil.com"],
    ["slash + backslash", String.raw`/\evil.com`],
    ["leading backslash", String.raw`\evil.com`],
    ["encoded protocol-relative", "/%2F%2Fevil.com"],
    ["encoded slash + backslash", "/%5Cevil.com"],
    ["encoded double-encoded slash", "/%252F%252Fevil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,x"],
    ["newline", "/dashboard\n//evil.com"],
    ["carriage return", "/dashboard\r\nLocation: https://evil.com"],
    ["tab", "/\t/evil.com"],
    ["NUL byte", "/dash\u0000board"],
    ["relative without slash", "dashboard"],
    ["empty", ""],
    ["whitespace prefix", " //evil.com"],
  ])("falls back for %s", (_name, input) => {
    expect(safeCallbackUrl(input)).toBe("/dashboard")
  })

  it.each([null, undefined, 42, {}, ["/admin"]])(
    "falls back for non-string %j",
    (input) => {
      expect(safeCallbackUrl(input)).toBe("/dashboard")
    }
  )

  it("uses a custom fallback", () => {
    expect(safeCallbackUrl("//evil.com", "/")).toBe("/")
  })
})
