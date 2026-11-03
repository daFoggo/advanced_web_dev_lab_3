import Link from "next/link"
import { IconArrowRight, IconBook, IconCalendar } from "@tabler/icons-react"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button-variants"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { Deadline } from "../schemas"
import { Countdown } from "./countdown"

export function DeadlineCard({
  deadline,
  action,
}: {
  deadline: Deadline
  action?: React.ReactNode
}) {
  const dueDate = new Date(deadline.dueAt)
  const formattedDate = dueDate.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <Card className="flex flex-col justify-between transition-colors hover:border-foreground/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {deadline.subject && (
            <Badge variant="outline" className="gap-1 font-mono text-xs">
              <IconBook className="size-3" />
              <span>{deadline.subject.code}</span>
            </Badge>
          )}
          <Countdown dueAt={deadline.dueAt} completed={deadline.completed} />
        </div>
        <CardTitle className="mt-2 text-base font-medium">
          <Link
            href={`/deadlines/${deadline.id}`}
            className="transition-colors hover:text-primary"
          >
            {deadline.title}
          </Link>
        </CardTitle>
        {deadline.subject && (
          <CardDescription className="text-xs">
            {deadline.subject.name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {deadline.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {deadline.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <IconCalendar className="size-3.5" />
          <span>Hạn nộp: {formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t">
        <Link
          href={`/deadlines/${deadline.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-1 text-xs",
          })}
        >
          <span>Chi tiết</span>
          <IconArrowRight className="size-3.5" />
        </Link>
        {action && <div>{action}</div>}
      </CardFooter>
    </Card>
  )
}
