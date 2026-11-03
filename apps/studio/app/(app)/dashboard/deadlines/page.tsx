import { Suspense } from "react"
import type { Metadata } from "next"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { PageHead } from "@/components/layout/page-head"
import { CompletionToggle } from "@/features/deadlines/components/completion-toggle"
import { DeadlineList } from "@/features/deadlines/components/deadline-list"
import { fetchMyDeadlinesWithStatus } from "@/features/deadlines/server"
import { verifySession } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Deadline của tôi",
  robots: { index: false, follow: false },
}

async function MyDeadlinesContent() {
  const session = await verifySession()
  const myDeadlines = await fetchMyDeadlinesWithStatus(session.userId)

  return (
    <DeadlineList
      deadlines={myDeadlines}
      emptyMessage="Hiện chưa có deadline nào."
      actionRender={(deadline) => (
        <CompletionToggle
          deadlineId={deadline.id}
          initialCompleted={Boolean(deadline.completed)}
        />
      )}
    />
  )
}

function DeadlinesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-lg border p-6 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MyDeadlinesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHead
        label="Dashboard"
        title="Deadline của tôi"
      >
        Toàn bộ danh sách deadline các môn học. Bạn có thể đánh dấu hoàn thành từng mục để theo dõi tiến độ của bản thân.
      </PageHead>

      <Suspense fallback={<DeadlinesSkeleton />}>
        <MyDeadlinesContent />
      </Suspense>
    </div>
  )
}
