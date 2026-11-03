"use server"

import { revalidatePath, updateTag } from "next/cache"

import { can, roleOf } from "@workspace/auth/permissions"

import { getSession, verifySessionFresh } from "@/lib/dal"

import {
  CreateDeadlineInputSchema,
  DeadlineIdSchema,
} from "./schemas"
import {
  deleteDeadline,
  insertDeadline,
  toggleCompletion,
} from "./server"
import {
  TAG_DEADLINE_IDS,
  tagDeadline,
  tagSubject,
} from "./tags"

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  data?: unknown
}

export async function createDeadlineAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const session = await verifySessionFresh()
  if (!session || !can(roleOf(session), "deadline:create")) {
    return { error: "Bạn không có quyền thêm deadline" }
  }

  const raw = {
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    dueAt: formData.get("dueAt"),
    description: formData.get("description"),
  }

  const parseResult = CreateDeadlineInputSchema.safeParse(raw)
  if (!parseResult.success) {
    const errorMap = parseResult.error.flatten().fieldErrors
    const firstErrorMessage =
      parseResult.error.issues[0]?.message || "Dữ liệu không hợp lệ"
    return {
      error: firstErrorMessage,
      fieldErrors: errorMap,
    }
  }

  try {
    const { subjectId, title, dueAt, description } = parseResult.data
    const newDeadline = await insertDeadline(
      {
        subjectId,
        title,
        dueAt: new Date(dueAt),
        description,
      },
      session.userId
    )

    updateTag(tagDeadline(newDeadline.id))
    updateTag(TAG_DEADLINE_IDS)
    if (newDeadline.subject?.slug) {
      updateTag(tagSubject(newDeadline.subject.slug))
    }

    revalidatePath("/deadlines")
    revalidatePath(`/deadlines/${newDeadline.id}`)
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: true, data: newDeadline }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo deadline"
    return { error: message }
  }
}

export async function deleteDeadlineAction(
  id: number
): Promise<ActionState> {
  const session = await verifySessionFresh()
  if (!session || !can(roleOf(session), "deadline:delete")) {
    return { error: "Bạn không có quyền xoá deadline" }
  }

  const idResult = DeadlineIdSchema.safeParse(String(id))
  if (!idResult.success) {
    return { error: "Mã deadline không hợp lệ" }
  }

  try {
    const deleted = await deleteDeadline(id)
    if (!deleted) {
      return { error: "Deadline không tồn tại hoặc đã bị xoá" }
    }

    updateTag(tagDeadline(id))
    updateTag(TAG_DEADLINE_IDS)
    if (deleted.subjectSlug) {
      updateTag(tagSubject(deleted.subjectSlug))
    }

    revalidatePath("/deadlines")
    revalidatePath(`/deadlines/${id}`)
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Đã xảy ra lỗi khi xoá deadline"
    return { error: message }
  }
}

export async function toggleCompletionAction(
  deadlineId: number
): Promise<ActionState> {
  const session = await getSession()
  if (!session || !can(roleOf(session), "deadline:complete")) {
    return { error: "Bạn cần đăng nhập để đánh dấu hoàn thành" }
  }

  const idResult = DeadlineIdSchema.safeParse(String(deadlineId))
  if (!idResult.success) {
    return { error: "Mã deadline không hợp lệ" }
  }

  try {
    const res = await toggleCompletion(session.userId, deadlineId)

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/deadlines")

    return { success: true, data: res }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật tiến độ"
    return { error: message }
  }
}
