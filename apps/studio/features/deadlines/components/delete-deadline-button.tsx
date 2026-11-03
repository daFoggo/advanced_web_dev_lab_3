"use client"

import { useState, useTransition } from "react"
import { IconTrash } from "@tabler/icons-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { deleteDeadlineAction } from "../actions"

export function DeleteDeadlineButton({
  deadlineId,
  title,
}: {
  deadlineId: number
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDeadlineAction(deadlineId)
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        {isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <IconTrash data-icon="inline-start" />
        )}
        <span>Xoá</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xoá deadline</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xoá deadline &ldquo;{title}&rdquo;? Hành động
            này không thể hoàn tác và sẽ xoá toàn bộ tiến độ liên quan của sinh
            viên.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            Xoá deadline
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
