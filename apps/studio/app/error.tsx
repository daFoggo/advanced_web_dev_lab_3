"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/** Unexpected errors only; expected failures are returned by Server Actions as values. */
export default function Error({
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
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl leading-tight font-normal tracking-tight max-sm:text-3xl">
        Đã xảy ra lỗi
      </h1>
      <p className="max-w-md text-muted-foreground">
        Hệ thống gặp sự cố ngoài dự kiến. Vui lòng thử lại sau.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={() => retry()}>
          Thử lại
        </Button>
        <Button
          size="lg"
          variant="outline"
          render={<Link href="/" />}
          nativeButton={false}
        >
          Về trang chủ
        </Button>
      </div>
    </main>
  )
}
