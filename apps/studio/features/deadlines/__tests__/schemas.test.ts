import { describe, expect, it } from "vitest"

import {
  CreateDeadlineInputSchema,
  DeadlineIdSchema,
  DeadlineSchema,
} from "../schemas"

describe("schemas", () => {
  describe("DeadlineIdSchema", () => {
    it("accepts valid positive integer strings", () => {
      expect(DeadlineIdSchema.parse("1")).toBe(1)
      expect(DeadlineIdSchema.parse("42")).toBe(42)
    })

    it("rejects invalid ids (0, negatives, decimals, leading zeros, non-numeric)", () => {
      expect(() => DeadlineIdSchema.parse("0")).toThrow()
      expect(() => DeadlineIdSchema.parse("-1")).toThrow()
      expect(() => DeadlineIdSchema.parse("01")).toThrow()
      expect(() => DeadlineIdSchema.parse("1.5")).toThrow()
      expect(() => DeadlineIdSchema.parse("abc")).toThrow()
    })
  })

  describe("CreateDeadlineInputSchema", () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    it("validates valid input", () => {
      const input = {
        subjectId: "1",
        title: "Bài tập lớn",
        dueAt: futureDate,
        description: "Mô tả bài tập",
      }
      const parsed = CreateDeadlineInputSchema.parse(input)
      expect(parsed.subjectId).toBe(1)
      expect(parsed.title).toBe("Bài tập lớn")
      expect(parsed.description).toBe("Mô tả bài tập")
    })

    it("rejects title shorter than 3 characters", () => {
      expect(() =>
        CreateDeadlineInputSchema.parse({
          subjectId: 1,
          title: "ab",
          dueAt: futureDate,
        })
      ).toThrow()
    })

    it("rejects date in the past", () => {
      expect(() =>
        CreateDeadlineInputSchema.parse({
          subjectId: 1,
          title: "Bài tập quá hạn",
          dueAt: pastDate,
        })
      ).toThrow()
    })

    it("handles empty description as null", () => {
      const parsed = CreateDeadlineInputSchema.parse({
        subjectId: 1,
        title: "Bài tập",
        dueAt: futureDate,
        description: "",
      })
      expect(parsed.description).toBeNull()
    })
  })

  describe("DeadlineSchema", () => {
    it("validates full deadline object", () => {
      const deadline = {
        id: 1,
        subjectId: 2,
        title: "Deadline 1",
        description: null,
        dueAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "user_1",
      }
      expect(DeadlineSchema.parse(deadline)).toEqual(deadline)
    })
  })
})
