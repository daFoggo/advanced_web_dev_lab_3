import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-5xl leading-tight font-normal tracking-tighter">
        Không tìm thấy trang
      </h1>
      <p className="text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc đã được chuyển đi.
      </p>
      <Button size="lg" render={<Link href="/" />} nativeButton={false}>
        Về trang chủ
      </Button>
    </main>
  )
}
