import { describe, expect, it } from "vitest"

import { applyFilters, parseFilters } from "../filters"
import type { Deadline } from "../schemas"

describe("filters", () => {
  const sampleDeadlines: Deadline[] = [
    {
      id: 1,
      subjectId: 1,
      title: "Lab 1",
      description: null,
      dueAt: "2026-11-01T12:00:00.000Z",
      createdAt: "2026-10-25T12:00:00.000Z",
      createdBy: "seed",
      subject: {
        id: 1,
        slug: "web",
        name: "Lập trình web",
        code: "INT1",
        lecturer: "A",
        color: "#2563eb",
      },
    },
    {
      id: 2,
      subjectId: 2,
      title: "Lab 2",
      description: null,
      dueAt: "2026-11-05T12:00:00.000Z",
      createdAt: "2026-10-25T12:00:00.000Z",
      createdBy: "seed",
      subject: {
        id: 2,
        slug: "db",
        name: "Cơ sở dữ liệu",
        code: "INT2",
        lecturer: "B",
        color: "#16a34a",
      },
    },
    {
      id: 3,
      subjectId: 1,
      title: "Lab 3",
      description: null,
      dueAt: "2026-11-10T12:00:00.000Z",
      createdAt: "2026-10-25T12:00:00.000Z",
      createdBy: "seed",
      subject: {
        id: 1,
        slug: "web",
        name: "Lập trình web",
        code: "INT1",
        lecturer: "A",
        color: "#2563eb",
      },
    },
  ]

  const now = new Date("2026-11-03T12:00:00.000Z")

  it("parses query params with defaults", () => {
    const filters = parseFilters(new URLSearchParams())
    expect(filters).toEqual({
      subject: "all",
      status: "all",
      sort: "due-asc",
    })
  })

  it("parses custom filters", () => {
    const params = new URLSearchParams({
      subject: "web",
      status: "upcoming",
      sort: "due-desc",
    })
    const filters = parseFilters(params)
    expect(filters).toEqual({
      subject: "web",
      status: "upcoming",
      sort: "due-desc",
    })
  })

  it("filters by subject", () => {
    const filtered = applyFilters(sampleDeadlines, { subject: "web" }, now)
    expect(filtered).toHaveLength(2)
    expect(filtered.map((d) => d.id)).toEqual([1, 3])
  })

  it("filters by upcoming status", () => {
    const filtered = applyFilters(sampleDeadlines, { status: "upcoming" }, now)
    expect(filtered).toHaveLength(2)
    expect(filtered.map((d) => d.id)).toEqual([2, 3])
  })

  it("filters by overdue status", () => {
    const filtered = applyFilters(sampleDeadlines, { status: "overdue" }, now)
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe(1)
  })

  it("sorts descending by due date", () => {
    const filtered = applyFilters(sampleDeadlines, { sort: "due-desc" }, now)
    expect(filtered.map((d) => d.id)).toEqual([3, 2, 1])
  })
})
