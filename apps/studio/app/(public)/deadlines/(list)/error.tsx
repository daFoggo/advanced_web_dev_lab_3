"use client"

import { useEffect } from "react"

import { Button } from "@workspace/ui/components/button"

export default function DeadlinesError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl leading-tight font-medium md:text-4xl">
        Không tải được danh sách deadline
      </h1>
      <p className="text-muted-foreground">
        Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.
      </p>
      <Button size="lg" onClick={() => retry()}>
        Thử lại
      </Button>
    </div>
  )
}
