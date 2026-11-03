import { IconCalendarOff } from "@tabler/icons-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import type { Deadline } from "../schemas"
import { DeadlineCard } from "./deadline-card"

export function DeadlineList({
  deadlines,
  emptyMessage = "Không có deadline nào phù hợp với bộ lọc.",
  actionRender,
}: {
  deadlines: Deadline[]
  emptyMessage?: string
  actionRender?: (deadline: Deadline) => React.ReactNode
}) {
  if (deadlines.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconCalendarOff />
          </EmptyMedia>
          <EmptyTitle>Chưa có deadline nào</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {deadlines.map((deadline) => (
        <DeadlineCard
          key={deadline.id}
          deadline={deadline}
          action={actionRender ? actionRender(deadline) : undefined}
        />
      ))}
    </div>
  )
}
