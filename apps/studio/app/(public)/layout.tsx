import { Suspense } from "react"
import Link from "next/link"

import { ThemeToggle } from "@workspace/ui-patterns/theme-toggle"
import { cn } from "@workspace/ui/lib/utils"

import { CONTAINER } from "@/config/layout"
import { DEADLINES_PATH, HOME_PATH } from "@/config/routes"

import { AuthStatus, AuthStatusSkeleton } from "./_components/auth-status"

const SITE_NAME = "Class Deadline Hub"

const NAV = [
  { title: "Trang chủ", href: HOME_PATH },
  { title: "Deadline", href: DEADLINES_PATH },
] as const

/**
 * Public shell: static header (site name, nav, auth status slot) and footer. It must not wrap
 * `children` in <Suspense> (and no `loading.tsx` at this level): a boundary above `[id]` would
 * start the stream before `notFound()` runs and unknown ids would answer 200 instead of 404. The <Suspense> below
 * wraps only the `AuthStatus` client island (`usePathname` can suspend on a dynamic route), never `children`.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div
          className={cn(CONTAINER, "flex h-14 items-center gap-6 max-sm:gap-4")}
        >
          <Link href={HOME_PATH} className="text-lg font-medium">
            {SITE_NAME}
          </Link>
          <nav aria-label="Điều hướng chính" className="flex items-center gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Suspense fallback={<AuthStatusSkeleton />}>
              <AuthStatus />
            </Suspense>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={cn(CONTAINER, "flex-1 py-10")}>{children}</main>
      <footer className="border-t">
        <div
          className={cn(CONTAINER, "py-6 font-mono text-xs text-muted-foreground")}
        >
          © 2026 {SITE_NAME} · Bài thực hành Phát triển Web nâng cao
        </div>
      </footer>
    </div>
  )
}
