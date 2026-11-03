import { Suspense } from "react"
import type { Metadata } from "next"

import { DeadlineList } from "@/features/deadlines/components/deadline-list"
import { FilteredDeadlines } from "@/features/deadlines/components/filtered-deadlines"
import { getDeadlineList, getSubjects } from "@/features/deadlines/queries"

export const metadata: Metadata = {
  title: "Danh sách deadline",
  description: "Tổng hợp toàn bộ deadline các môn học và bộ lọc theo trạng thái.",
}

export default async function DeadlinesPage() {
  const [data, subjects] = await Promise.all([
    getDeadlineList(),
    getSubjects(),
  ])

  const formattedGeneratedAt = new Date(data.generatedAt).toLocaleString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-medium tracking-tight md:text-4xl">
          Danh sách deadline
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            Theo dõi, lọc theo môn học và kiểm tra trạng thái các deadline của lớp.
          </p>
          <span className="font-mono text-xs">
            Cập nhật ISR lúc: {formattedGeneratedAt}
          </span>
        </div>
      </div>

      <Suspense fallback={<DeadlineList deadlines={data.items} />}>
        <FilteredDeadlines
          initialDeadlines={data.items}
          subjects={subjects}
        />
      </Suspense>
    </div>
  )
}
