import { z } from "zod"

export const SubjectSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  lecturer: z.string().min(1),
  color: z.string().min(1),
})

export type Subject = z.infer<typeof SubjectSchema>

export const DeadlineSchema = z.object({
  id: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  title: z.string().min(3).max(120),
  description: z.string().nullable().optional(),
  dueAt: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]),
  createdBy: z.string(),
  subject: SubjectSchema.optional(),
  completed: z.boolean().optional(),
})

export type Deadline = z.infer<typeof DeadlineSchema>

export const DeadlineIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Id phải là số nguyên dương")
  .transform((v) => Number.parseInt(v, 10))

export const CreateDeadlineInputSchema = z
  .object({
    subjectId: z.coerce
      .number()
      .int("Môn học không hợp lệ")
      .positive("Vui lòng chọn môn học"),
    title: z
      .string()
      .trim()
      .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
      .max(120, "Tiêu đề không được vượt quá 120 ký tự"),
    dueAt: z.string().min(1, "Vui lòng chọn thời hạn nộp"),
    description: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (!val) return null
        const trimmed = typeof val === "string" ? val.trim() : ""
        return trimmed.length > 0 ? trimmed : null
      }),
  })
  .refine(
    (data) => {
      const parsed = new Date(data.dueAt)
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()
    },
    {
      message: "Hạn nộp phải là một thời điểm trong tương lai",
      path: ["dueAt"],
    }
  )

export type CreateDeadlineInput = z.infer<typeof CreateDeadlineInputSchema>

export const DeadlineFilterSchema = z.object({
  subject: z.string().optional().default("all"),
  status: z.enum(["all", "upcoming", "overdue"]).optional().default("all"),
  sort: z.enum(["due-asc", "due-desc"]).optional().default("due-asc"),
})

export type DeadlineFilter = z.infer<typeof DeadlineFilterSchema>
