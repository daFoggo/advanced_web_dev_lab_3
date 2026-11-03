"use client"

import { useOptimistic, useTransition } from "react"
import { IconCheck, IconCircle } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { toggleCompletionAction } from "../actions"

export function CompletionToggle({
  deadlineId,
  initialCompleted = false,
}: {
  deadlineId: number
  initialCompleted?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    initialCompleted,
    (_current, nextState: boolean) => nextState
  )

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted)
      const res = await toggleCompletionAction(deadlineId)
      if (res?.error) {
        setOptimisticCompleted(optimisticCompleted)
      }
    })
  }

  return (
    <Button
      variant={optimisticCompleted ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleToggle}
      className="gap-1.5 text-xs"
    >
      {isPending ? (
        <Spinner data-icon="inline-start" />
      ) : optimisticCompleted ? (
        <IconCheck data-icon="inline-start" />
      ) : (
        <IconCircle data-icon="inline-start" />
      )}
      <span>{optimisticCompleted ? "Đã xong" : "Đánh dấu xong"}</span>
    </Button>
  )
}
