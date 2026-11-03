import {
  IconArrowRight,
  IconBrandGithub,
  IconCpu,
  IconDatabase,
  IconLayersLinked,
  IconLock,
  IconPalette,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { CountingNumber } from "@workspace/ui/components/animate-ui/numbers/counting-number"
import { AppLogo } from "@workspace/ui-patterns/app-logo"
import { StackGrid } from "@workspace/ui-patterns/stack-grid"
import { ThemeToggle } from "@workspace/ui-patterns/theme-toggle"

import { CONTAINER } from "@/config/layout"
import { REPO_URL, SIGN_IN_HREF, SIGN_UP_HREF } from "@/config/site"
import { CopyCommand } from "@/components/copy-command"
import { MonorepoMap } from "@/components/monorepo-map"
import { ProviderTabs } from "@/components/provider-tabs"
import { ArchitectureFaq } from "@/components/architecture-faq"

const ARCHITECTURE_CHAPTERS = [
  {
    number: "01",
    badge: "Monorepo",
    title: "Next.js 16.4 App Router with PPR & Cache Components",
    desc: "Turborepo + pnpm workspaces keeping applications next to shared packages for UI, auth, db, and patterns with zero transpilation boilerplate.",
    meta: "Turbopack",
  },
  {
    number: "02",
    badge: "Auth Seam",
    title: "Multi-Stack Authentication Seam",
    desc: "Native support for Keycloak 26 OIDC, Better Auth, Supabase, or pure FastAPI OAuth2 behind one @workspace/auth seam. Switch via AUTH_PROVIDER without touching application code.",
    meta: "Zero lock-in",
  },
  {
    number: "03",
    badge: "Data Layer",
    title: "Decoupled Data Access Layer (DAL)",
    desc: "Strict server-only boundaries, per-user caching with 'use cache', connection pooling for PostgreSQL, and zero client token exposure.",
    meta: "Server-only",
  },
  {
    number: "04",
    badge: "Client State",
    title: "Zustand Client-Only State",
    desc: "Minimal, shared client state without React Context cascade re-renders, with optional persistent storage across navigation.",
    meta: "Zero bloat",
  },
  {
    number: "05",
    badge: "Validation",
    title: "TanStack Form & Zod Schema Contracts",
    desc: "Headless type-safe forms and runtime validation at every network boundary, form mutation, and server action. Strict TypeScript contracts from database to UI.",
    meta: "Type-safe",
  },
  {
    number: "06",
    badge: "Design",
    title: "Base-Nova Design System",
    desc: "zinc neutral palette, dark mode default, Animate UI v2 spring physics, and ready-made dashboard shells with collapsible rails and detail sheets.",
    meta: "Tailwind v4",
  },
  {
    number: "07",
    badge: "Security",
    title: "Continuous Security Audit & Invariant Ledgers",
    desc: "Built-in automated audit skill with 10-unit deterministic coverage ledgers, multi-hunter invariant verification, token-bound tenant isolation, and fail-fast production secret validation.",
    meta: "Audit-ready",
  },
] as const

const PILLARS = [
  {
    icon: IconLock,
    title: "Multi-Stack Auth Seam",
    badge: "Pluggable",
    description:
      "Enterprise Keycloak 26 with PKCE S256 & RS256 JWKS verification, Better Auth with direct DB pooling, Supabase Auth, or pure FastAPI OAuth2 JWTs. Switch providers via an environment variable with zero application code changes.",
  },
  {
    icon: IconDatabase,
    title: "Server-Only Data Access",
    badge: "Strict DAL",
    description:
      "Server actions, queries, and auth secrets reside in strict server-only boundaries. Per-user caching uses 'use cache' and cacheLife directives without ever leaking credentials to client bundles.",
  },
  {
    icon: IconPalette,
    title: "Zinc Base-Nova UI Kit",
    badge: "Design System",
    description:
      "Engineered on shadcn base-nova with Animate UI v2 spring physics, zero arbitrary Tailwind values, dark mode default, and a full dashboard shell with collapsible navigation and detail sheets.",
  },
  {
    icon: IconCpu,
    title: "TanStack, Zustand & Zod",
    badge: "Client & Forms",
    description:
      "TanStack headless primitives, Zustand client-only stores without React context re-render waterfalls, and Zod validation across all API parameters, form mutations, and server actions.",
  },
  {
    icon: IconShieldCheck,
    title: "Audited & Hardened Core",
    badge: "Hardened",
    description:
      "Formally audited with 10-unit coverage ledgers. Features token-bound multi-tenant isolation, fail-fast production secret guards, Keycloak azp/typ claims binding, and live DB role verification in PostgreSQL.",
  },
  {
    icon: IconLayersLinked,
    title: "AI-Native Coding Rules",
    badge: "Deterministic",
    description:
      "Strict AGENTS.md conventions, comprehensive docs/ architecture guides, and Antigravity/Claude AI skills ensure autonomous agents generate clean, compliant code without hallucinating patterns.",
  },
] as const

/**
 * Modern developer landing page with high craft inspired by interfaces.dev:
 * - Wide 1336px responsive container with comfortable whitespace
 * - Animate UI components: spring CopyButton, CountingNumber, spring gliding tabs
 * - Strict design system compliance: smallest text is text-xs, zero custom -[] values
 * - Monorepo workspace package topology map
 * - Bento tech stack proof grid matching the reference image
 * - Chapter-style architectural breakdown
 * - Architecture decisions FAQ accordion
 */
export default function HomePage() {
  return (
    <>
      {/* Sticky navigation header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className={`${CONTAINER} flex h-14 items-center justify-between`}>
          <AppLogo />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              render={<a href={SIGN_IN_HREF} />}
              nativeButton={false}
            >
              Sign in
            </Button>
            <Button
              size="sm"
              render={<a href={SIGN_UP_HREF} />}
              nativeButton={false}
            >
              Open Studio
            </Button>
          </nav>
        </div>
      </header>

      <main className={`${CONTAINER} flex flex-col gap-16 pt-16 pb-24 sm:gap-24 sm:pt-20`}>
        {/* Hero Section */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-xs text-foreground/85">
                v0.1.0 · Next.js 16.4
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Turborepo Starter Base
              </span>
            </div>

            <CopyCommand command="git clone https://github.com/daFoggo/next-mono-base.git" />
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-4xl text-4xl font-serif leading-[1.12] font-normal tracking-tight sm:text-5xl lg:text-6xl text-balance">
              Build on a solid, production-grade base.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl font-normal">
              A modular Next.js 16.4 monorepo starter engineered with intentional architecture.
              Choose your preferred auth provider (Keycloak, Better Auth, Supabase, or FastAPI OAuth2),
              build with strict data access boundaries, and pair program with Claude AI under deterministic skill rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              render={<a href={SIGN_IN_HREF} />}
              nativeButton={false}
            >
              <span>Explore Studio Dashboard</span>
              <IconArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
              nativeButton={false}
            >
              <IconBrandGithub aria-hidden className="size-4" />
              <span>GitHub Repository</span>
            </Button>
          </div>
        </section>

        {/* Supported Tech Stack Bento Grid (matching user reference image) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-border/40 pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Supported Ecosystem
              </span>
              <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
                Integrated technologies across 5 tiers
              </h2>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <CountingNumber number={16} />
              <span>technologies ·</span>
              <CountingNumber number={4} />
              <span>auth providers · Zero lock-in</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-4xl">
            <StackGrid />
          </div>
        </section>

        {/* Live Interactive Architecture Bento Section */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 border-t border-border/40 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Architecture in Action
              </span>
              <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
                Pluggable seams &amp; workspace topology
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Decoupled modules guarantee you can swap authentication or database engines without rewriting application components.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bento Card 1: Interactive Auth Switcher with Animate UI */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-foreground">
                  Pluggable Authentication Seam
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  packages/auth
                </span>
              </div>
              <ProviderTabs />
            </div>

            {/* Bento Card 2: Turborepo Workspace Topology */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-foreground">
                  Turborepo Package Graph
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  pnpm workspaces
                </span>
              </div>
              <MonorepoMap />
            </div>
          </div>
        </section>

        {/* Security Audit & Invariant Hardening Bento Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-border/40 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <IconShieldCheck className="size-4 text-foreground/80" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Security &amp; Invariants
                </span>
              </div>
              <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
                Continuous security audit &amp; verified defenses
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-foreground/85">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                10/10 Coverage Units Verified
              </span>
            </div>
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Every boundary is continuously inspected using dedicated security audit skills. Deterministic coverage ledgers verify least-privilege DAL permissions, token-bound tenant isolation, and zero credential leakage.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/10 p-5 transition-colors hover:bg-muted/20">
              <span className="font-mono text-2xl font-normal text-foreground">0</span>
              <span className="font-medium text-sm text-foreground">Live High / Critical Flaws</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero unauthenticated RCE, zero SQL injection, pinned search_path = &apos;&apos; on PostgreSQL routines, and zero client credential leakage.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/10 p-5 transition-colors hover:bg-muted/20">
              <span className="font-mono text-2xl font-normal text-foreground">100%</span>
              <span className="font-medium text-sm text-foreground">Fail-Fast Production Secrets</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Development placeholder secrets are rejected at boot in production builds. Active auth providers require explicit cryptographically secure secrets.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/10 p-5 transition-colors hover:bg-muted/20">
              <span className="font-mono text-2xl font-normal text-foreground">Strict</span>
              <span className="font-medium text-sm text-foreground">Multi-Tenant &amp; Claim Binding</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Server stores enforce caller-token tenant isolation with 403 Forbidden rejection, and Keycloak JWTs bind azp, typ, and client-scoped roles.
              </p>
            </div>
          </div>
        </section>

        {/* Architectural Pillars (Rich Bento Cards) */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 border-t border-border/40 pt-10">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Core Principles
            </span>
            <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
              Engineered for production reliability
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="group flex flex-col gap-3.5 rounded-lg border border-border/50 bg-muted/10 p-6 transition-all duration-150 hover:border-border hover:bg-muted/25"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <pillar.icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground shrink-0" />
                    <h3 className="font-medium text-base text-foreground">
                      {pillar.title}
                    </h3>
                  </div>
                  <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 font-mono text-xs text-foreground/80">
                    {pillar.badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Architectural Breakdown (Chapter-style list inspired by interfaces.dev) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-t border-border/40 pt-10">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Deep Dive
            </span>
            <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
              Architecture at a glance
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every decision is intentional: modular seams, strict typing, and zero unnecessary runtime dependencies.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border/40 border-y border-border/40">
            {ARCHITECTURE_CHAPTERS.map((item) => (
              <div
                key={item.number}
                className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-5 transition-colors hover:bg-muted/15 px-3 -mx-3 rounded-sm"
              >
                <div className="flex items-center gap-2.5 shrink-0 sm:min-w-44">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {item.number}
                  </span>
                  <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 font-mono text-xs text-foreground/80">
                    {item.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground shrink-0 hidden md:block pt-0.5">
                  {item.meta}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Built for AI Pair Programming Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-border/40 pt-10">
            <div className="flex items-center gap-2">
              <IconSparkles className="size-4 text-foreground/80" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                AI Pair Programming
              </span>
            </div>
            <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
              Built for developers and AI agents
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              In the age of Claude, Antigravity, and autonomous coding assistants, clean conventions and deterministic boundaries matter more than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <IconShieldCheck className="size-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs font-medium text-foreground">
                  Deterministic AGENTS.md Rules
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Context-aware rules in AGENTS.md instruct AI assistants on Next.js 16 breaking changes, Turbopack compiling, and monorepo guidelines before writing code.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <IconLayersLinked className="size-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs font-medium text-foreground">
                  Single Source of Truth in docs/
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Exhaustive architectural docs cover data fetching, authentication seams, Zustand client state, and design-system tokens so agents never hallucinate patterns.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <IconLock className="size-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs font-medium text-foreground">
                  Strict ESLint Monorepo Boundaries
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Custom ESLint rules enforce strict architectural boundaries: client components cannot import server-only modules, and workspace packages maintain clean dependency graphs.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <IconCpu className="size-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs font-medium text-foreground">
                  One-Command Full Monorepo Check
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Running pnpm check executes lint, typecheck, and Vitest across all 8 packages in parallel via Turborepo, providing instant verification for generated code.
              </p>
            </div>
          </div>
        </section>

        {/* Architecture FAQ Section (Interactive Accordion) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-border/40 pt-10">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
              Architectural decisions &amp; FAQ
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Common questions about provider seams, caching strategies, and monorepo workflows.
            </p>
          </div>

          <ArchitectureFaq />
        </section>
      </main>

      {/* Minimalist high-craft footer */}
      <footer className="border-t border-border/40 py-10">
        <div className={`${CONTAINER} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs font-mono text-muted-foreground`}>
          <div className="flex items-center gap-3">
            <span>© 2026 Next Mono Base</span>
            <span>·</span>
            <span>MIT License</span>
            <span>·</span>
            <span>Production Monorepo Starter</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href={SIGN_IN_HREF}
              className="transition-colors hover:text-foreground"
            >
              Studio Dashboard
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
