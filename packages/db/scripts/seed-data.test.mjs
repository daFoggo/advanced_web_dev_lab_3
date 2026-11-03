import { describe, expect, it } from "vitest"

import { ACCOUNTS, buildDeadlines, DEADLINES, SUBJECTS } from "./seed-data.mjs"

const NOW = new Date("2026-11-03T08:00:00.000Z")
const DAY = 24 * 3_600_000

describe("seed data", () => {
  it("has 4 subjects with unique slugs and codes", () => {
    expect(SUBJECTS).toHaveLength(4)
    expect(new Set(SUBJECTS.map((s) => s.slug)).size).toBe(4)
    expect(new Set(SUBJECTS.map((s) => s.code)).size).toBe(4)
  })

  it("has fixed ids 1..12, each pointing at a known subject", () => {
    expect(DEADLINES.map((d) => d.id)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    )
    const slugs = new Set(SUBJECTS.map((s) => s.slug))
    for (const d of DEADLINES) expect(slugs.has(d.subject)).toBe(true)
    expect(new Set(DEADLINES.map((d) => d.subject))).toEqual(slugs)
  })

  it("covers overdue, today and future deadlines relative to now", () => {
    const delta = buildDeadlines(NOW).map(
      (r) => r.dueAt.getTime() - NOW.getTime()
    )
    expect(delta.filter((d) => d < 0).length).toBeGreaterThanOrEqual(2)
    expect(delta.filter((d) => d > 0 && d <= DAY)).toHaveLength(1)
    expect(delta.filter((d) => d > DAY).length).toBeGreaterThanOrEqual(8)
  })

  it("defines an admin and a user account with passwords of 8+ characters", () => {
    expect(ACCOUNTS.map((a) => a.role)).toEqual(["admin", "user"])
    for (const a of ACCOUNTS)
      expect(a.password.length).toBeGreaterThanOrEqual(8)
  })
})
