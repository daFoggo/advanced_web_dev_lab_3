import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock("@/lib/dal", () => ({
  getSession: vi.fn(),
  verifySessionFresh: vi.fn(),
}))

vi.mock("../server", () => ({
  insertDeadline: vi.fn(),
  deleteDeadline: vi.fn(),
  toggleCompletion: vi.fn(),
}))

import { revalidatePath, updateTag } from "next/cache"

import { getSession, verifySessionFresh, type Session } from "@/lib/dal"

import {
  createDeadlineAction,
  deleteDeadlineAction,
  toggleCompletionAction,
} from "../actions"
import { deleteDeadline, insertDeadline, toggleCompletion } from "../server"

describe("deadlines actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createDeadlineAction", () => {
    it("denies unauthenticated guests", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue(null as unknown as Session)

      const formData = new FormData()
      formData.set("subjectId", "1")
      formData.set("title", "Test")
      formData.set("dueAt", new Date(Date.now() + 100000).toISOString())

      const result = await createDeadlineAction(null, formData)
      expect(result.error).toBe("Bạn không có quyền thêm deadline")
      expect(insertDeadline).not.toHaveBeenCalled()
    })

    it("denies regular users with role 'user'", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue({
        userId: "user_1",
        role: "user",
        email: "sv@ptit.edu.vn",
        name: "Sinh viên",
        accessToken: "token",
      })

      const formData = new FormData()
      formData.set("subjectId", "1")
      formData.set("title", "Test")
      formData.set("dueAt", new Date(Date.now() + 100000).toISOString())

      const result = await createDeadlineAction(null, formData)
      expect(result.error).toBe("Bạn không có quyền thêm deadline")
      expect(insertDeadline).not.toHaveBeenCalled()
    })

    it("validates input and returns error for invalid title", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue({
        userId: "admin_1",
        role: "admin",
        email: "admin@ptit.edu.vn",
        name: "Lớp trưởng",
        accessToken: "token",
      })

      const formData = new FormData()
      formData.set("subjectId", "1")
      formData.set("title", "ab") // too short
      formData.set("dueAt", new Date(Date.now() + 100000).toISOString())

      const result = await createDeadlineAction(null, formData)
      expect(result.error).toBe("Tiêu đề phải có ít nhất 3 ký tự")
      expect(result.fieldErrors?.title).toBeDefined()
      expect(insertDeadline).not.toHaveBeenCalled()
    })

    it("allows admin with valid data and calls updateTag", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue({
        userId: "admin_1",
        role: "admin",
        email: "admin@ptit.edu.vn",
        name: "Lớp trưởng",
        accessToken: "token",
      })

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const mockCreated = {
        id: 13,
        subjectId: 1,
        title: "Deadline 13",
        description: null,
        dueAt: futureDate,
        createdAt: new Date().toISOString(),
        createdBy: "admin_1",
        subject: {
          id: 1,
          slug: "lap-trinh-web-nang-cao",
          name: "Lập trình web nâng cao",
          code: "INT1433",
          lecturer: "TS. An",
          color: "#2563eb",
        },
      }
      vi.mocked(insertDeadline).mockResolvedValue(mockCreated)

      const formData = new FormData()
      formData.set("subjectId", "1")
      formData.set("title", "Deadline 13")
      formData.set("dueAt", futureDate)

      const result = await createDeadlineAction(null, formData)
      expect(result.success).toBe(true)
      expect(insertDeadline).toHaveBeenCalled()
      expect(updateTag).toHaveBeenCalledWith("deadline:13")
      expect(updateTag).toHaveBeenCalledWith("deadline-ids")
      expect(updateTag).toHaveBeenCalledWith("subject:lap-trinh-web-nang-cao")
      expect(revalidatePath).toHaveBeenCalledWith("/deadlines")
    })
  })

  describe("deleteDeadlineAction", () => {
    it("denies non-admin users", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue({
        userId: "user_1",
        role: "user",
        email: "sv@ptit.edu.vn",
        name: "Sinh viên",
        accessToken: "token",
      })

      const result = await deleteDeadlineAction(1)
      expect(result.error).toBe("Bạn không có quyền xoá deadline")
      expect(deleteDeadline).not.toHaveBeenCalled()
    })

    it("allows admin to delete deadline", async () => {
      vi.mocked(verifySessionFresh).mockResolvedValue({
        userId: "admin_1",
        role: "admin",
        email: "admin@ptit.edu.vn",
        name: "Lớp trưởng",
        accessToken: "token",
      })

      vi.mocked(deleteDeadline).mockResolvedValue({
        id: 5,
        subjectSlug: "lap-trinh-web-nang-cao",
      })

      const result = await deleteDeadlineAction(5)
      expect(result.success).toBe(true)
      expect(deleteDeadline).toHaveBeenCalledWith(5)
      expect(updateTag).toHaveBeenCalledWith("deadline:5")
      expect(updateTag).toHaveBeenCalledWith("deadline-ids")
      expect(updateTag).toHaveBeenCalledWith("subject:lap-trinh-web-nang-cao")
      expect(revalidatePath).toHaveBeenCalledWith("/deadlines/5")
    })
  })

  describe("toggleCompletionAction", () => {
    it("denies unauthenticated guests", async () => {
      vi.mocked(getSession).mockResolvedValue(null)

      const result = await toggleCompletionAction(1)
      expect(result.error).toBe("Bạn cần đăng nhập để đánh dấu hoàn thành")
      expect(toggleCompletion).not.toHaveBeenCalled()
    })

    it("allows authenticated user to toggle completion", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user_1",
        role: "user",
        email: "sv@ptit.edu.vn",
        name: "Sinh viên",
        accessToken: "token",
      })
      vi.mocked(toggleCompletion).mockResolvedValue({ completed: true })

      const result = await toggleCompletionAction(1)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ completed: true })
      expect(toggleCompletion).toHaveBeenCalledWith("user_1", 1)
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard")
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/deadlines")
    })
  })
})
