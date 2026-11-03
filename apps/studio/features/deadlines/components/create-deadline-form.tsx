"use client"

import { useActionState } from "react"
import { IconAlertCircle, IconCheck, IconPlus } from "@tabler/icons-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

import { createDeadlineAction } from "../actions"
import type { Subject } from "../schemas"

export function CreateDeadlineForm({ subjects }: { subjects: Subject[] }) {
  const [state, formAction, isPending] = useActionState(
    createDeadlineAction,
    null
  )
  const defaultSubjectId = subjects[0]?.id ? String(subjects[0].id) : ""

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm deadline mới</CardTitle>
        <CardDescription>
          Tạo deadline cho môn học để sinh viên trong lớp cùng theo dõi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          key={state?.success ? "success-reset" : "form-active"}
          action={formAction}
          className="flex flex-col gap-5"
        >
          {state?.error && (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert variant="default">
              <IconCheck />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>
                Đã thêm deadline mới vào danh sách.
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={Boolean(state?.fieldErrors?.subjectId)}>
              <FieldLabel htmlFor="subjectId">Môn học</FieldLabel>
              <Select
                name="subjectId"
                defaultValue={defaultSubjectId}
                required
              >
                <SelectTrigger
                  id="subjectId"
                  aria-invalid={Boolean(state?.fieldErrors?.subjectId)}
                  className="w-full"
                >
                  <SelectValue placeholder="Chọn môn học">
                    {(val) => {
                      const sub = subjects.find(
                        (s) => String(s.id) === String(val)
                      )
                      return sub ? `${sub.name} (${sub.code})` : "Chọn môn học"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {state?.fieldErrors?.subjectId && (
                <FieldError>{state.fieldErrors.subjectId[0]}</FieldError>
              )}
            </Field>

            <Field data-invalid={Boolean(state?.fieldErrors?.title)}>
              <FieldLabel htmlFor="title">Tiêu đề</FieldLabel>
              <Input
                id="title"
                name="title"
                placeholder="VD: Nộp báo cáo bài tập lớn..."
                required
                minLength={3}
                maxLength={120}
                aria-invalid={Boolean(state?.fieldErrors?.title)}
              />
              {state?.fieldErrors?.title && (
                <FieldError>{state.fieldErrors.title[0]}</FieldError>
              )}
            </Field>

            <Field data-invalid={Boolean(state?.fieldErrors?.dueAt)}>
              <FieldLabel htmlFor="dueAt">Hạn nộp</FieldLabel>
              <Input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                required
                aria-invalid={Boolean(state?.fieldErrors?.dueAt)}
              />
              {state?.fieldErrors?.dueAt && (
                <FieldError>{state.fieldErrors.dueAt[0]}</FieldError>
              )}
            </Field>

            <Field data-invalid={Boolean(state?.fieldErrors?.description)}>
              <FieldLabel htmlFor="description">Mô tả (tuỳ chọn)</FieldLabel>
              <Textarea
                id="description"
                name="description"
                placeholder="Ghi chú chi tiết về yêu cầu bài tập, định dạng nộp..."
                maxLength={1000}
                rows={3}
                aria-invalid={Boolean(state?.fieldErrors?.description)}
              />
              {state?.fieldErrors?.description && (
                <FieldError>{state.fieldErrors.description[0]}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconPlus data-icon="inline-start" />
            )}
            <span>Thêm deadline</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
