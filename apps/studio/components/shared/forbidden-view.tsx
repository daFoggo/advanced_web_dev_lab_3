import Link from "next/link"
import { IconArrowRight, IconShieldOff } from "@tabler/icons-react"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button-variants"

import { ADMIN_PATH, DASHBOARD_PATH, DEADLINES_PATH, HOME_PATH, LOGIN_PATH } from "@/config/routes"

/**
 * Body of the 403 page. Shared by `app/forbidden.tsx` and the `/403` route.
 * Clearly explains role boundaries so students know why they cannot enter /admin.
 */
export function ForbiddenView() {
  return (
    <div className="flex flex-col items-start gap-6 max-w-2xl py-8">
      <Badge variant="destructive" className="gap-1 font-mono text-xs">
        <IconShieldOff className="size-3.5" />
        <span>403 · KHÔNG CÓ QUYỀN TRUY CẬP</span>
      </Badge>

      <h1 className="text-4xl leading-tight font-medium tracking-tight md:text-5xl">
        Khu vực dành riêng cho Lớp trưởng (Admin)
      </h1>

      <p className="text-base leading-relaxed text-muted-foreground">
        Bạn không có quyền xem trang này. Tài khoản hiện tại của bạn không có quyền truy cập vào trang Quản trị.
        Trang này chỉ cho phép tài khoản <strong>Lớp trưởng</strong> (admin@ptit.edu.vn) thực hiện thêm mới và xoá deadline của lớp.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          href={DASHBOARD_PATH}
          className={buttonVariants({ size: "default" })}
        >
          <span>Vào Dashboard của bạn</span>
          <IconArrowRight data-icon="inline-end" />
        </Link>

        <Link
          href={DEADLINES_PATH}
          className={buttonVariants({ variant: "outline", size: "default" })}
        >
          Xem danh sách deadline
        </Link>

        <Link
          href={`${LOGIN_PATH}?switch=1&callbackUrl=${encodeURIComponent(ADMIN_PATH)}`}
          className={buttonVariants({ variant: "ghost", size: "default" })}
        >
          Đăng nhập tài khoản khác
        </Link>

        <Link
          href={HOME_PATH}
          className={buttonVariants({ variant: "ghost", size: "default" })}
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
