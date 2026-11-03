import Link from "next/link"

import { GlyphBackground } from "@workspace/ui/components/animate-ui/backgrounds/glyph"

import { ThemeToggle } from "@workspace/ui-patterns/theme-toggle"
import { AppLogo } from "@workspace/ui-patterns/app-logo"
import { Stagger } from "@/components/shared/stagger"
import { HOME_PATH } from "@/config/routes"

const SITE_NAME = "Class Deadline Hub"

function Brand({ size }: { size: "md" | "lg" }) {
  return (
    <Link href={HOME_PATH} className="flex items-center gap-3">
      <AppLogo variant="mark" size={size} />
      <span className="text-lg font-medium">{SITE_NAME}</span>
    </Link>
  )
}

/** Left rail from lg: brand, page-specific pitch centered, footer. Hidden below lg. */
export function AuthAside({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden border-r lg:sticky lg:top-0 lg:col-span-6 lg:flex lg:h-svh lg:flex-col xl:col-span-7">
      <GlyphBackground className="flex flex-1 flex-col px-9 text-foreground">
        <div className="relative flex h-24 shrink-0 items-center">
          <Brand size="lg" />
        </div>
        <div className="relative flex flex-1 flex-col justify-center">
          <div className="flex flex-col gap-8 text-foreground">{children}</div>
        </div>
        {/* Same height as the header so the pitch stays vertically centered. */}
        <div className="relative flex h-24 shrink-0 items-center justify-between font-mono text-xs text-muted-foreground">
          <span>© 2026 {SITE_NAME}</span>
          <ThemeToggle />
        </div>
      </GlyphBackground>
    </aside>
  )
}

/** Rail headline: title plus a one-line standfirst. */
export function AuthPitch({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-3xl leading-tight font-medium text-balance md:text-4xl">
        {title}
      </p>
      <p className="text-lg leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

/** Form column: header and centered body. */
export function AuthMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col px-9 max-sm:px-6 lg:col-span-6 xl:col-span-5">
      {children}
    </main>
  )
}

/**
 * Top bar of the form column. Below lg (rail hidden) the brand shows here; from lg a "Về trang chủ"
 * link takes its place, since the rail already carries the brand.
 */
export function AuthHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex h-24 items-center justify-between gap-4 max-sm:h-18">
      <div className="lg:hidden">
        <Brand size="md" />
      </div>
      <Link
        href={HOME_PATH}
        className="hidden font-mono text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground lg:block"
      >
        Về trang chủ
      </Link>
      {children}
    </header>
  )
}

/** Centered column holding the heading and the form. */
export function AuthBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-12 max-sm:py-8">
      <Stagger className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {children}
      </Stagger>
    </div>
  )
}

export function AuthHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? (
        <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="text-3xl leading-tight font-medium md:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground">{children}</p>
    </div>
  )
}
