import { describe, expect, it } from "vitest"

import { describeCountdown } from "../countdown"

describe("describeCountdown", () => {
  const baseTime = new Date("2026-11-03T12:00:00.000Z")

  it("calculates overdue days correctly (rounded up)", () => {
    // 1 hour overdue -> 1 day overdue
    const due1 = new Date("2026-11-03T11:00:00.000Z")
    expect(describeCountdown(due1, baseTime)).toEqual({
      kind: "overdue",
      n: 1,
      text: "Quá hạn 1 ngày",
    })

    // 25 hours overdue -> 2 days overdue
    const due2 = new Date("2026-11-02T11:00:00.000Z")
    expect(describeCountdown(due2, baseTime)).toEqual({
      kind: "overdue",
      n: 2,
      text: "Quá hạn 2 ngày",
    })
  })

  it("calculates hours remaining when within 24 hours", () => {
    // 3 hours remaining
    const due1 = new Date("2026-11-03T15:00:00.000Z")
    expect(describeCountdown(due1, baseTime)).toEqual({
      kind: "hours",
      n: 3,
      text: "Còn 3 giờ",
    })

    // 24 hours remaining
    const due2 = new Date("2026-11-04T12:00:00.000Z")
    expect(describeCountdown(due2, baseTime)).toEqual({
      kind: "hours",
      n: 24,
      text: "Còn 24 giờ",
    })
  })

  it("calculates days remaining when more than 24 hours", () => {
    // 25 hours remaining -> 2 days
    const due1 = new Date("2026-11-04T13:00:00.000Z")
    expect(describeCountdown(due1, baseTime)).toEqual({
      kind: "days",
      n: 2,
      text: "Còn 2 ngày",
    })

    // 5 days remaining
    const due2 = new Date("2026-11-08T12:00:00.000Z")
    expect(describeCountdown(due2, baseTime)).toEqual({
      kind: "days",
      n: 5,
      text: "Còn 5 ngày",
    })
  })
})
