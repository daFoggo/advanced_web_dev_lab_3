"use client"

import { useEffect } from "react"

import { Button } from "@workspace/ui/components/button"

export default function DashboardError({
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
        Đã xảy ra lỗi
      </h1>
      <p className="text-muted-foreground">
        Không tải được trang này. Vui lòng thử lại.
      </p>
      <Button size="lg" onClick={() => retry()}>
        Thử lại
      </Button>
    </div>
  )
}
