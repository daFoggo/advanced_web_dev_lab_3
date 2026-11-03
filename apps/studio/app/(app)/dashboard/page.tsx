import { Suspense } from "react"
import Link from "next/link"
import { io } from "next/cache"
import type { Metadata } from "next"
import { IconArrowRight } from "@tabler/icons-react"

import { buttonVariants } from "@workspace/ui/components/button-variants"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { PageHead } from "@/components/layout/page-head"
import { MY_DEADLINES_PATH } from "@/config/routes"
import { CompletionToggle } from "@/features/deadlines/components/completion-toggle"
import { DeadlineList } from "@/features/deadlines/components/deadline-list"
import { fetchMyDeadlinesWithStatus } from "@/features/deadlines/server"
import { verifySession } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Tổng quan",
  robots: { index: false, follow: false },
}

async function getNowTimestamp(): Promise<number> {
  await io()
  return Date.now()
}

async function DashboardOverview() {
  const [session, now] = await Promise.all([
    verifySession(),
    getNowTimestamp(),
  ])

  const myDeadlines = await fetchMyDeadlinesWithStatus(session.userId)

  const upcomingCount = myDeadlines.filter(
    (d) => !d.completed && new Date(d.dueAt).getTime() >= now
  ).length
  const completedCount = myDeadlines.filter((d) => d.completed).length
  const overdueCount = myDeadlines.filter(
    (d) => !d.completed && new Date(d.dueAt).getTime() < now
  ).length

  // Filter tasks to do (not completed)
  const todoDeadlines = myDeadlines
    .filter((d) => !d.completed)
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-8">
      {/* Metrics dl row */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <dt className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Cần hoàn thành (Sắp tới)
          </dt>
          <dd className="text-3xl font-medium tracking-tight text-primary">
            {upcomingCount}
          </dd>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <dt className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Đã hoàn thành
          </dt>
          <dd className="text-3xl font-medium tracking-tight text-foreground">
            {completedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
          <dt className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Quá hạn chưa xong
          </dt>
          <dd className="text-3xl font-medium tracking-tight text-destructive">
            {overdueCount}
          </dd>
        </div>
      </dl>

      {/* Todo section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium tracking-tight">
              Việc cần làm tiếp theo
            </h2>
            <p className="text-sm text-muted-foreground">
              Các deadline chưa hoàn thành cần bạn xử lý
            </p>
          </div>
          <Link
            href={MY_DEADLINES_PATH}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1 text-xs",
            })}
          >
            <span>Xem toàn bộ</span>
            <IconArrowRight className="size-3.5" />
          </Link>
        </div>

        <DeadlineList
          deadlines={todoDeadlines}
          emptyMessage="Tuyệt vời! Bạn không còn deadline nào chưa hoàn thành."
          actionRender={(deadline) => (
            <CompletionToggle
              deadlineId={deadline.id}
              initialCompleted={Boolean(deadline.completed)}
            />
          )}
        />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHead
        label="Dashboard"
        title="Tổng quan học tập"
      >
        Dưới đây là tóm tắt tiến độ hoàn thành deadline các môn học của bạn.
      </PageHead>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>
    </div>
  )
}
