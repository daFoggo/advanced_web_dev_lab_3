# Kế hoạch triển khai: Class Deadline Hub

> Dựa trên [requirements.md](./requirements.md) (mục 10: **chỉ Neon Postgres + Drizzle**, không lưu JSON; dữ liệu mẫu nạp bằng **script seed idempotent**).
> Trạng thái: **bản nháp chờ duyệt — chưa implement**. Điểm **CHƯA KIỂM CHỨNG** được đánh dấu rõ; phase P0 chốt chúng trước khi viết code.
> Thực thi: dùng `superpowers:subagent-driven-development` (plan/review → Opus, implement → Sonnet) theo từng phase.

## A. Tóm tắt và quyết định kiến trúc

Viết lại `apps/studio` thành Class Deadline Hub:

- Identity giữ seam có sẵn `AUTH_PROVIDER=neon-auth` (Better Auth do Neon quản lý); data `DATA_PROVIDER=neon` (Drizzle).
- Bỏ route demo (workspace/org/project). Tạo group `(public)`, `(app)`, `(auth)/login`.
- Ma trận quyền ở **một chỗ duy nhất**: `packages/auth/src/permissions.ts` → `can(role, action)`.
- Render trên Cache Components: SSG/ISR = `"use cache"` + `cacheLife` + `cacheTag` + `generateStaticParams`; SSR = đọc runtime (session); làm mới ngay bằng `updateTag` trong Server Action.

| # | Quyết định | Lý do / bằng chứng | Dự phòng |
|---|---|---|---|
| D1 | **Auth = Neon Auth (managed Better Auth) qua seam có sẵn**, không tự host `better-auth` | Code chạy sẵn (`packages/auth/src/neon-auth/*`, `signIn.email`). Admin plugin có sẵn, role dựng sẵn `user`/`admin` (khớp đề); gán role qua SDK `admin.setRole`, Console "Make admin", REST `PUT …/auth/users/{id}/role` (cần `NEON_API_KEY`) hoặc `neon neon-auth user set-role`; admin đầu tiên phải gán ở Console. Hỗ trợ GitHub (OAuth app riêng). Cookie `neon-auth.local.session_data` là JWT HS256 ký bằng `NEON_AUTH_COOKIE_SECRET`, chứa `{session,user}` (TTL 300s) → proxy giải mã role tại chỗ (`validateSessionData` từ `@neon/auth/server`, toolkit beta, pin `@neon/auth@0.8.2`) | Nếu Neon Auth không trả `user.role` / không gán được admin: khôi phục provider Better Auth tự host từ git (`git show fd68ea2 --stat`, lấy `fd68ea2^`): Drizzle adapter + admin plugin + `session.cookieCache` (jwt; **cần xác minh theo phiên bản**) + github social |
| D2 | "Session JWT" | Better Auth giữ session trong DB + cookie `session_data` là JWT đã ký (cache 5 phút) → tương đương `strategy: "jwt"` của NextAuth. README ghi trung thực đây là mô hình lai | — |
| D3 | `Role = "guest"\|"user"\|"admin"`, `SessionRole = Exclude<Role,"guest">`; bỏ `customer/editor` | Đề bắt buộc 3 role; role `user` của Neon dùng thẳng. `parseRole` fallback `"user"`, **không bao giờ** về admin | — |
| D4 | 3 bảng `subjects`, `deadlines`, `completions` (Drizzle, migration `0004`); id integer identity; seed `packages/db/scripts/seed.mjs` upsert, **id cố định 1..12** | Đã chốt với người dùng; `/deadlines/1` ổn định | — |
| D5 | Chặn `POST /api/auth/sign-up/*` trong handler (403), xoá `/sign-up` | Đề chỉ có 2 tài khoản; user GitHub tạo qua callback, role mặc định `user` | Không bật công tắc "disable sign-up" của Console (có thể chặn luôn user GitHub — chưa xác minh) |
| D6 | **Xoá/thay** `(dashboard)/**`, `features/workspace/**`, `(auth)/sign-up`, `e2e/neon.spec.ts`; **giữ & tái dùng** `components/layout/**` (sidebar, `nav-tree` highlight `aria-current`), `features/auth`, demo-session (đổi kiểu role) | `/dashboard` không thể ở hai group; blast radius nhỏ, không đụng `apps/web` | Bảng `orgs/projects` giữ nguyên (G3) |
| D7 | `/deadlines/[id]`, `/subjects/[slug]`: `generateStaticParams` + `export const instant = false` + `await params` ở top + lookup `"use cache"`; id lạ → `notFound()` trước khi stream → **404 thật** | `building.md` "A blocking product page"; path liệt kê + dữ liệu cached → `○`, fallback `ƒ` | B: `<Suspense>` + params bên trong → UI 404 nhưng status 200 + `noindex` |
| D8 | `/deadlines` ISR 60s: `cacheLife("minutes")` (stale 5m, revalidate **60s**, expire 1h); **không** invalidate list khi admin sửa, để chứng minh ISR thuần thời gian | Build table có cột `Revalidate 1m / Expire 1h` | Muốn cập nhật ngay: thêm `updateTag("deadlines:list")` (G2) |
| D9 | Bộ lọc `/deadlines` chạy **client** trên dữ liệu ISR, đồng bộ query string; `<Suspense fallback={<DeadlineList/>}>` bọc `<FilteredDeadlines>` (`useSearchParams`) | Đọc `searchParams` ở server làm trang động, phá ISR; HTML tĩnh vẫn đủ danh sách (SEO) | — |
| D10 | Header public: client island `AuthStatus` (`authClient.useSession()`, `createAuthClient` từ `@neon/auth/next`, export `@workspace/auth/client`); header `(app)`: server component trong `<Suspense>` | Trang public không đọc cookie → giữ `○` | Server Suspense → trang `◐`, README giải thích (G5) |
| D11 | Test: Vitest (thay Jest) + Playwright | Repo đã cấu hình; API giống Jest; tránh hai runner | — |
| D12 | **Giữ nguyên Geist / Geist Mono** của base, không cấu hình thêm | `next/font/google` nhúng mọi subset (unicode-range), `subsets` chỉ ảnh hưởng preload; font-data.json xác nhận Geist có `vietnamese` (người dùng chốt) | — |

## B. Truy vết yêu cầu → phase

| Mã | Nội dung | Phase |
|---|---|---|
| R-A1 `/` SSG | `○` | P5, P8 |
| R-A2 `/subjects/[slug]` SSG | gSP, `○` ×4 | P5, P8 |
| R-A3 `/deadlines` ISR 60s | `cacheLife("minutes")` | P5, P8 |
| R-A4 `/deadlines/[id]` ISR + làm mới ngay | gSP + `cacheTag(deadline:id)` + `updateTag` | P5, P6, P8 |
| R-A5 `/dashboard` SSR | session/DB theo request | P6 |
| R-A6 `/admin` SSR | `instant=false`, check ở top | P6 |
| R-A7 404 dự án | `notFound()` + `not-found.tsx` tiếng Việt | P3, P5, P8 |
| R-B1 `(public)`/`(app)` layout riêng | | P3 |
| R-B2 sidebar lồng + active link | `dashboard/layout.tsx` + `nav-tree` | P3, P6 |
| R-B3 loading/error("Thử lại")/not-found | | P3 |
| R-B4 chỉ `'use client'` khi cần | countdown, filter, toggle, form admin, AuthStatus | P5, P6 |
| R-C1 Better Auth credentials + JWT | D1, D2 | P4 |
| R-C2 `id`+`role` có kiểu | `Session.userId`, `role: SessionRole` | P1 |
| R-C3 Header tên/role/đăng nhập/đăng xuất | | P4 |
| `can()` một chỗ | `permissions.ts` | P1 |
| R-D1 proxy bảo vệ | | P4 |
| R-D2 `/login?callbackUrl` | | P4 |
| R-D3 user vào `/admin` → `/403` | proxy giải mã role | P4 |
| R-D4 check ở page + mọi action + zod | | P6 |
| R-E1 generateMetadata + OG image | | P7 |
| R-E2 sitemap + robots | | P7 |
| R-E3 noindex `/login`, `/dashboard` | | P7 |
| R-E4 JSON-LD BreadcrumbList | | P7 |
| R-E5 `next/font` vi + `next/image` | | P3, P7 |
| R-E6 Lighthouse | | P8 |
| R-S1 source sạch | `.gitignore` | P10 |
| R-S2 README 5 mục | | P10 |
| R-X1 GitHub OAuth / R-X2 Vercel | | P9 |
| R-X3 test `can()` | Vitest | P1 |
| BR 9.2.1 không lộ completion | completions đọc theo `userId` | P6 |
| BR 9.2.2 toggle, cho phép quá hạn | | P6 |
| BR 9.2.3 validate tạo | zod | P6 |
| BR 9.2.4 xoá cứng + cascade + xác nhận | | P2, P6 |
| BR 9.2.6 đếm ngược / 9.2.7 bộ lọc | | P5 |
| BR 9.2.8 dashboard / 9.2.9 admin | | P6 |
| BR 9.2.10 tắt đăng ký, GitHub→user | | P4, P9 |
| BR 9.2.11 chống open redirect | | P4 |
| BR 9.2.12 canonical/OG | | P7 |
| BR 9.2.13 `lang="vi"` | | P3 |

## C. Cây thư mục đích (thay đổi; `apps/studio/` trừ khi ghi `packages/`)

```
packages/auth/src/
  permissions.ts                 # ROLES, ACTIONS, MATRIX, can(), parseRole(), roleOf() — NGUỒN DUY NHẤT
  types.ts                       # Session.role: SessionRole; OAuthProvider += "github"
  neon-auth/proxy.ts             # đọc role từ session_data JWT; loginUrl "/login"
  neon-auth/server.ts            # oauth.start hỗ trợ "github"
  neon-auth/handler.ts           # createAuthHandler({ blockSignUp: true })
  neon-auth/client.ts            # createAuthClient(), export "./client"
  __tests__/permissions.test.ts  # ma trận 3×4
  __tests__/neon-auth-proxy.test.ts
packages/db/
  src/neon/schema.ts             # + subjects, deadlines, completions
  neon/migrations/0004_class_deadline_hub.sql (+ meta)
  scripts/seed.mjs               # data + 2 tài khoản + role admin, idempotent, --reset
  package.json                   # "neon:seed"
apps/studio/
  proxy.ts                       # callbackUrl, /403 cho non-admin
  config/routes.ts  config/navigation.ts
  lib/safe-redirect.ts (+ __tests__)
  lib/dal.ts                     # requireCan(action) thay requirePermission
  app/layout.tsx                 # lang="vi", fonts vietnamese, metadata
  app/not-found.tsx error.tsx global-error.tsx forbidden.tsx   # tiếng Việt, "Thử lại"
  app/robots.ts  app/sitemap.ts
  app/(public)/layout.tsx  _components/{site-header,auth-status}.tsx
  app/(public)/page.tsx
  app/(public)/subjects/[slug]/page.tsx
  app/(public)/deadlines/(list)/page.tsx  loading.tsx  error.tsx   # (list) group: loading KHÔNG bọc [id] (R1-B1)
  app/(public)/deadlines/[id]/page.tsx  opengraph-image.tsx  not-found.tsx
  app/(public)/403/page.tsx
  app/(auth)/layout.tsx  login/page.tsx  error.tsx     # đổi tên từ sign-in
  app/(app)/layout.tsx  _components/{app-header,session-nav}.tsx
  app/(app)/dashboard/layout.tsx (sidebar)  page.tsx  loading.tsx  error.tsx
  app/(app)/dashboard/deadlines/page.tsx               # "Deadline của tôi" + toggle
  app/(app)/admin/page.tsx  error.tsx
  features/deadlines/
    schemas.ts server.ts queries.ts actions.ts tags.ts countdown.ts filters.ts
    components/{deadline-card,deadline-list,filtered-deadlines,countdown,completion-toggle,
                create-deadline-form,delete-deadline-button,breadcrumb-jsonld}.tsx
    __tests__/{schemas,countdown,filters,actions}.test.ts
  features/auth/                 # sign-in-form + callbackUrl + GitHub; bỏ sign-up
  assets/fonts/BeVietnamPro-Medium.ttf   # cho ImageResponse (OFL)
  public/images/{hero.webp,subjects/*.webp}
  e2e/{public,auth,authorization,admin-isr,seo}.spec.ts  smoke.spec.ts (cập nhật)
README.md (gốc repo — G9)
```
Xoá: `app/(dashboard)/**`, `app/(auth)/sign-up/**`, `features/workspace/**`, `sign-up-form.tsx` + `signUpAction`, `e2e/neon.spec.ts`, `components/layout/header/{dashboard-breadcrumb,crumb-menu}.tsx` nếu không còn ai dùng.

## D. Data model, ma trận quyền, session

**Bảng (`public`):**
- `subjects(id int identity pk, slug text unique, name, code, lecturer, color)`
- `deadlines(id int identity pk, subject_id fk→subjects RESTRICT, title, description null, due_at timestamptz, created_at timestamptz default now(), created_by text)`; index `(due_at)`, `(subject_id)`
- `completions(user_id text, deadline_id fk→deadlines ON DELETE CASCADE, completed_at default now(), PK(user_id, deadline_id))`; `user_id` = id user Neon Auth (schema `neon_auth`, không FK cross-schema)

Seed dùng `OVERRIDING SYSTEM VALUE` cho id 1..12 rồi `setval(pg_get_serial_sequence('deadlines','id'), max(id))`; `due_at` tương đối so với lúc seed (−5d, −1d, hôm nay +3h, +2d … +30d) để có đủ trạng thái.

**Ma trận** (`packages/auth/src/permissions.ts`):
```ts
export const ROLES = ["guest","user","admin"] as const; export type Role = (typeof ROLES)[number]
export type SessionRole = Exclude<Role,"guest">
export const ACTIONS = ["deadline:view","deadline:complete","deadline:create","deadline:delete"] as const
const MATRIX = { guest:[view], user:[view,complete], admin:[view,complete,create,delete] } satisfies Record<Role, readonly Action[]>
export function can(role: Role, action: Action): boolean
export function parseRole(v: unknown): SessionRole          // "admin" | "user" (fallback "user")
export function roleOf(s: { role: SessionRole } | null): Role  // null → "guest"
```
Quyền vào `/admin` = `can(role,"deadline:create")`. Không thêm action thứ 5.

**Session:** `Session { userId; accessToken; role: SessionRole; name; email }`; `ProxyAuthResult.role: SessionRole | null`. UI: `ROLE_LABEL = { guest:"Khách", user:"Sinh viên", admin:"Lớp trưởng" }`.

**Cache tags:** `subjects`, `subject:<slug>`, `deadline:<id>`, `deadline-ids` (gSP + sitemap), `deadlines:list` (chỉ hết hạn theo thời gian).

## E. Các phase

### P0. Preflight, khoá giả định (~30 phút, chỉ đọc/kiểm tra)
- **Tasks:** (1) `node -v`; (2) `pnpm --filter studio dev`, đăng nhập user thử, giải mã cookie `neon-auth.local.session_data`, kiểm `user.role`; (3) SQL `select column_name from information_schema.columns where table_schema='neon_auth' and table_name='user'` xem cột `role`; (4) Neon Console → Auth: "Make admin", công tắc sign-up, GitHub; (5) đọc docs Next: `route-segment-config/instant.md`, `01-metadata/{sitemap,robots,opengraph-image}.md`, `02-guides/json-ld.md`.
- **DoD:** kết quả ghi vào mục G; D1 và D7 được xác nhận hoặc chuyển phương án dự phòng. **Song song:** không.

### P1. Quyền và kiểu session (`packages/auth`) — TDD
- **Cần trước:** P0.
- **Tasks:** (1) viết lại `__tests__/permissions.test.ts`: `it.each` 12 ô, `parseRole("admin")→admin`, `parseRole("user"|"customer"|undefined|"ADMIN")→user`, `roleOf(null)→guest` → chạy thấy **FAIL**; (2) viết lại `permissions.ts`; (3) `types.ts` (`SessionRole`, `OAuthProvider` + `"github"`); (4) sửa ánh xạ role của provider khác (`keycloak/jwks.ts`, `fastapi-oauth/jwt.ts`, supabase dùng `parseRole`) + test (`editor/customer`→`admin/user`); (5) `apps/studio/lib/demo-session.ts` (`role:"user"`) + test; (6) `lib/dal.ts`: `requireCan(action)` thay `requirePermission`, bỏ `hasPermission/isStaff/Permission`.
- **Kiểm chứng:** `pnpm --filter @workspace/auth test typecheck` PASS (12 case ma trận); `pnpm --filter studio typecheck` có thể còn lỗi ở file sẽ xoá ở P3 (chấp nhận hoặc gộp P1+P3 một nhánh).
- **DoD (P1):** chỉ `packages/auth` xanh. Grep `customer|editor|hasPermission` và `pnpm --filter studio typecheck` chuyển thành DoD của **P3** (R1-M3: code demo còn dùng đến khi P3 xoá). **Rollback:** `git checkout packages/auth`. **Song song:** cùng P2.

### P2. Schema, migration, seed (`packages/db`)
- **Cần trước:** P0.
- **Tasks:** (1) thêm 3 bảng + export type; (2) `pnpm --filter @workspace/db neon:generate`, đổi tên `0004_class_deadline_hub.sql`, review SQL (identity, cascade, unique slug); (3) `scripts/seed.mjs` (`pg` + `fetch`, `node --env-file`): upsert 4 subject theo slug; upsert 12 deadline id cố định `ON CONFLICT (id) DO UPDATE`; `setval`; tạo account `POST ${NEON_AUTH_BASE_URL}/sign-up/email` (`Origin: http://localhost:3001`) cho `admin@ptit.edu.vn/admin123` ("Lớp trưởng") và `sv@ptit.edu.vn/sv123456` ("Sinh viên"), bỏ qua nếu tồn tại, rồi `sign-in/email` để xác minh; gán admin nếu có `NEON_API_KEY`/`NEON_PROJECT_ID`/`NEON_BRANCH_ID` qua `PUT …/auth/users/{id}/role {roles:["admin"]}`, không thì in hướng dẫn Console "Make admin"; cờ `--reset` xoá deadline id>12 và mọi completions; (4) script `"neon:seed"`; (5) xử lý test/ghi chú orgs/projects nếu hỏng (G3).
- **Kiểm chứng:** `neon:migrate` → `neon:seed` hai lần, lần 2 không lỗi, `select count(*) from deadlines` = 12; đăng nhập 2 tài khoản qua `/api/auth/sign-in/email`, admin có `role:"admin"`; `pnpm --filter @workspace/db test typecheck lint`.
- **DoD:** dữ liệu đủ trạng thái quá hạn/hôm nay/tương lai; 2 tài khoản đúng role. **Rủi ro (CHƯA KIỂM CHỨNG):** sign-up từ Node bị kiểm tra origin → tạo user ở Console, hoặc chạy trước khi chặn sign-up (P4); mật khẩu 8 ký tự vừa đủ min Better Auth. **Song song:** cùng P1.

### P3. Dọn route demo, dựng khung route
- **Cần trước:** P1.
- **Tasks:** (1) xoá file ở mục C; đổi `(auth)/sign-in`→`(auth)/login`; (2) `config/routes.ts`: `LOGIN_PATH="/login"`, `FORBIDDEN_PATH="/403"`, `PROTECTED_PREFIXES=["/dashboard","/admin"]`, `ADMIN_PREFIX`; (3) `app/layout.tsx`: `lang="vi"`, Inter + mono vietnamese, `title.template "%s | Class Deadline Hub"`; (4) `(public)/layout.tsx`, `(app)/layout.tsx`, `(app)/dashboard/layout.tsx` (tái dùng `SidebarProvider/AppSidebar/ColumnHeader`); (5) `config/navigation.ts`: 3 link (Tổng quan, Deadline của tôi, Quản trị kèm `action:"deadline:create"`), `permission`→`action`, `filterNav` nhận `can`; (6) boundary tiếng Việt: `app/error.tsx` ("Thử lại"), `not-found.tsx`, `forbidden.tsx` dùng chung với `(public)/403`, `global-error.tsx` `lang="vi"`; `error.tsx`/`loading.tsx` cho `(public)/deadlines/(list)` (route group con, để loading không bọc `[id]`) và `(app)/dashboard`; **cấm** `<Suspense>` bọc `children` ở root layout và `(public)` layout (R1-B1); (7) page placeholder; cập nhật `app/__tests__/boundaries.test.ts`.
- **Kiểm chứng:** `pnpm --filter studio test`; `pnpm check`, `pnpm build` (placeholder) xanh; không giá trị Tailwind tuỳ ý trong diff.
- **DoD:** điều hướng được `/`, `/deadlines`, `/login`, `/403`, `/dashboard` (sidebar, link active highlight); `grep -r "customer\|editor\|hasPermission" packages apps/studio --include=*.ts*` rỗng và `pnpm --filter studio typecheck` xanh. **Song song:** P2 vẫn chạy được.

### P4. Auth flow, proxy, header
- **Cần trước:** P1, P3 (P2 cho test thật).
- **Tasks:** (1) TDD `lib/safe-redirect.ts` `safeCallbackUrl(v, fallback="/dashboard")`: chỉ path bắt đầu `/`, loại `//`, `/\`, `\`, ký tự điều khiển, URL tuyệt đối; origin sau `new URL` phải trùng base; (2) `neon-auth/proxy.ts`: đọc cookie `__Secure-neon-auth.local.session_data`/`neon-auth.local.session_data`, `validateSessionData(value, NEON_AUTH_COOKIE_SECRET)`, `role = parseRole(payload.user.role)`; chữ ký sai/hết hạn → `role:null`; `loginUrl:"/login"`; test bằng jose (hợp lệ→admin, secret sai→null); (3) `apps/studio/proxy.ts`: chưa đăng nhập vào trang protected → `/login?callbackUrl=<pathname+search>`; `/admin*` với `role==="user"` → `/403`; `role===null` nhưng có session → cho qua (page tự chặn); đã đăng nhập vào `/login` → `/dashboard`; (4) `signInAction` đọc `callbackUrl` ẩn → `safeCallbackUrl` → `updateTag(SESSION_TAG)` + `redirect`; `signOutAction` về `/`; xoá `signUpAction`; (5) `createAuthHandler({ blockSignUp:true })` → `POST sign-up/*` 403; (6) header: `(app)/_components/app-header.tsx` server trong `<Suspense>` (name + Badge `ROLE_LABEL` + Đăng xuất); `(public)/_components/auth-status.tsx` `"use client"` + `authClient.useSession()`, skeleton kích thước cố định, chưa đăng nhập → link "Đăng nhập" kèm `callbackUrl` trang hiện tại; (7) `/login`: `robots noindex`, `searchParams` trong `<Suspense>`.
- **Kiểm chứng:** test safe-redirect ≥ 8 case + auth tests; trên `next start`: `curl.exe -sI localhost:3001/dashboard` → `307`, `location: /login?callbackUrl=%2Fdashboard`; sv mở `/admin` → `/403`; `curl.exe -s -X POST localhost:3001/api/auth/sign-up/email` → 403; `/login?callbackUrl=https://evil.com` → sau đăng nhập về `/dashboard`.
- **DoD:** 2 tài khoản đăng nhập/xuất được, header đúng tên + role ở cả hai group. **Rủi ro:** cookie session_data chưa mint ngay sau sign-in → role null, page-level `forbidden()` vẫn chặn (P6); đổi role trễ tối đa 5 phút. **Song song:** cùng P5.

### P5. Đọc dữ liệu deadlines + trang public
- **Cần trước:** P2, P3.
- **Tasks:** (1) `schemas.ts` (Zod DTO `Subject`, `Deadline`, `dueAt` ISO string); (2) `server.ts` (`server-only`): `fetchSubjects`, `fetchSubjectBySlug`, `fetchDeadlines`, `fetchDeadlineById`, `fetchDeadlineIds`; (3) `queries.ts`: `getSubjects` (`max`, tag `subjects`), `getSubjectPage(slug)` (`max`, `subject:<slug>`), `getDeadlineList` (`minutes`, `deadlines:list`, trả `{items, generatedAt}`), `getDeadline(id)` (`max`, `deadline:<id>`, `null` nếu không có), `getDeadlineIds` (`max`, `deadline-ids`); (4) TDD `countdown.ts` `describeCountdown(dueAt, now)` → `{kind:"days"|"hours"|"overdue", n}` làm tròn lên, hôm nay tính theo giờ; (5) TDD `filters.ts` `parseFilters`/`applyFilters`; (6) components: `countdown.tsx` (`"use client"`, `useSyncExternalStore` ticker 60s, server snapshot ngày tuyệt đối tránh hydration mismatch), `filtered-deadlines.tsx` (`"use client"`, `useSearchParams` + `router.replace`, Tabs/Select); (7) pages: `/` (hero `next/image` `preload` + 4 subject card), `/subjects/[slug]` (gSP + `instant=false` + `notFound()`), `/deadlines` (list + "Cập nhật lúc {generatedAt}" + Suspense), `/deadlines/[id]` (gSP, `instant=false`, `await params` ở top, `z.coerce.number().int().positive()`, `notFound()`, "Cập nhật lúc").
- **Kiểm chứng:** test countdown/filters; `pnpm --filter studio build` xem route table (bảng dưới); `curl.exe -sI localhost:3001/deadlines/999` và `/deadlines/abc` → 404.
- **DoD:** 4 trang public `○` (hoặc `ƒ` cho fallback row), không trang nào đọc cookie. **Rủi ro:** build cần `DATABASE_URL`; gSP rỗng làm build lỗi (seed trước); nếu `instant=false` không cho `○` → D7-B. **Song song:** cùng P4.

**Bảng render dự kiến (xác nhận bằng build thật ở P8):**

| Route | Kỹ thuật | Ký hiệu dự kiến |
|---|---|---|
| `/` | use cache `max` | `○` |
| `/subjects/[slug]` | gSP + use cache | `ƒ [slug]` fallback + `○` ×4 |
| `/deadlines` | `cacheLife("minutes")` | `○  1m  1h` |
| `/deadlines/[id]` | gSP + use cache + tag | `ƒ [id]` + `○ /deadlines/1…12` |
| `/deadlines/[id]/opengraph-image` | metadata route động | `ƒ` |
| `/dashboard`, `/dashboard/deadlines` | session + DB theo request | `◐` |
| `/admin` | `instant=false`, check ở top | `ƒ` |
| `/login` | searchParams trong Suspense | `◐` |
| `/403`, `/robots.txt`, `/sitemap.xml` | tĩnh/cached | `○` |

Với Cache Components **không có ký hiệu `●`/ISR** (`02-guides/building.md`): README giải thích ISR = `○` + cột Revalidate; SSR = `ƒ` hoặc `◐`.

### P6. Dashboard, Admin, Server Actions
- **Cần trước:** P4, P5.
- **Tasks:** (1) `server.ts` thêm `fetchMyCompletions(userId)`, `toggleCompletion(userId,id)` (insert `on conflict do nothing` / delete, trả trạng thái mới), `insertDeadline(input,userId)`, `deleteDeadline(id)` (trả slug môn hoặc null); (2) `CreateDeadlineSchema`: `subjectId` coerce int; `title` trim 3–120; `dueAt` từ `datetime-local` nối `+07:00`, phải > now; `description` ≤ 1000 tuỳ chọn; `DeadlineIdSchema`; (3) `actions.ts` (`"use server"`), mỗi action theo thứ tự `getSession()` → `can(roleOf(s), action)` → Zod → ghi → invalidate, lỗi dự kiến trả dạng value: `toggleCompletionAction(id)` (`deadline:complete`, `refresh()`), `createDeadlineAction(prev, fd)` (`deadline:create`, kiểm subject tồn tại, `updateTag(deadline:<idMới>)` **bắt buộc** để xoá `null` đã cache của id đó (R1-B2), `updateTag("deadline-ids")`, `updateTag(subject:<slug>)`, `refresh()`); `toggleCompletionAction` kiểm deadline tồn tại, trả `{error}` thay vì ném lỗi FK (R1-m4); create/delete dùng role tươi (`verifySessionFresh`) thay vì cookie cache (R1-m2), `deleteDeadlineAction(id)` (`deadline:delete`, `updateTag(deadline:<id>)`, `deadline-ids`, `subject:<slug>`, `refresh()`); (4) `__tests__/actions.test.ts` (mock `@/lib/dal`, `./server`, `next/cache`): guest/user gọi create/delete → `{error}` và không gọi insert/delete; guest toggle → `{error}`; input sai → `{error}`; admin delete → `updateTag("deadline:5")`; (5) pages: `/dashboard` (metrics sắp tới/đã xong/quá hạn của tôi + danh sách cần làm, `await io()` trước `new Date()`, trong Suspense, `noindex`), `/dashboard/deadlines` (list + `completion-toggle` `useOptimistic`), `/admin` (`instant=false`; top: `const s = await verifySession(); if (!can(s.role,"deadline:create")) redirect("/403")` — redirect, không `forbidden()`, vì proxy có thể không thấy role (R1-M1); **P6 sở hữu** noindex của `/admin` và `dashboard/layout` (R1-M4); bảng đọc không cache + `create-deadline-form` (`useActionState`) + `delete-deadline-button` (`AlertDialog` xác nhận)).
- **Kiểm chứng:** actions ≥ 6 case; thủ công trên `next start`: admin thêm → `/deadlines/<idMới>` 200 ngay; xoá → 404 ngay; `/deadlines` vẫn bản cũ tới 60s; sv toggle → dashboard đổi số.
- **DoD:** R-A4, R-A5, R-A6, R-D4, BR 9.2.1–9.2.4, 9.2.8, 9.2.9. **Rủi ro:** `updateTag` có thể không xoá entry ISR cấp route → thêm `revalidatePath(/deadlines/${id})`; Server Action là endpoint công khai nên không chỉ check UI. **Song song:** cùng P7.

### P7. SEO và tối ưu
- **Cần trước:** P5.
- **Tasks:** (1) `generateMetadata` `/deadlines/[id]`: title `"{title} – {subject}"`, description, `alternates.canonical`, `openGraph{type:"article"}`, `twitter.card "summary_large_image"`, id lạ → `notFound()`; (2) `opengraph-image.tsx` `ImageResponse` 1200×630 (nền theo màu môn, tiêu đề, môn, hạn `vi-VN` `Asia/Ho_Chi_Minh`; font TTF qua `readFile(new URL(…, import.meta.url))` hoặc `outputFileTracingIncludes`); (3) `app/sitemap.ts`: `/`, `/deadlines`, subject, mọi deadline (`getDeadlineIds`, `lastModified`); (4) `app/robots.ts`: allow `/`, disallow `/dashboard`,`/admin`, `sitemap`; (5) noindex cho `/login`, `(app)/dashboard/layout`, `/admin`, `/403`; (6) `breadcrumb-jsonld.tsx` (Trang chủ → Deadline → {title}, `JSON.stringify(...).replace(/</g,"\\u003c")`); (7) `next/image` cho hero/ảnh môn (static import, `sizes`, `preload` chỉ cho LCP); (8) `NEXT_PUBLIC_APP_URL` làm `metadataBase`.
- **Kiểm chứng:** `curl.exe -s localhost:3001/deadlines/1 | findstr "og:image application/ld+json canonical"`; `curl.exe -sI .../deadlines/1/opengraph-image` → `image/png`, mở file thấy dấu tiếng Việt đúng; `/robots.txt`, `/sitemap.xml` đủ 12 URL; `/login` có `noindex`; Rich Results Test nhận BreadcrumbList.
- **DoD:** R-E1…R-E5. **Rủi ro:** satori không nhận woff2; font tracing trên Vercel. **Song song:** cùng P6.

### P8. E2E, xác minh build, Lighthouse
- **Cần trước:** P6, P7.
- **Tasks:** Playwright chạy trên `next start` (bản prod): `public.spec.ts` (nội dung `/`, `/subjects/[slug]`; filter đổi query string; countdown); `auth.spec.ts` (sai mật khẩu → lỗi; sv đăng nhập với `callbackUrl=/dashboard/deadlines` → đúng trang; header "Sinh viên"; đăng xuất; open redirect bị chặn); `authorization.spec.ts` (guest → `/login?callbackUrl=%2Fdashboard`; sv `/admin` → `/403`; POST sign-up → 403); `admin-isr.spec.ts` (tạo → 200; xoá → 404 ngay; `/deadlines` chưa có mục mới dưới 60s; test `@slow` chờ 65s → "Cập nhật lúc" đổi; tự dọn dữ liệu); `seo.spec.ts` (meta, JSON-LD, robots, sitemap, `/deadlines/999` → 404 + UI dự án); cập nhật `smoke.spec.ts`, xoá `neon.spec.ts`. Chụp output `pnpm --filter studio build` cho README. Lighthouse (DevTools, mobile + desktop) cho `/` và `/deadlines/1`, lưu report `docs/class-deadline-hub/lighthouse/`.
- **Kiểm chứng:** `pnpm --filter @workspace/db neon:seed -- --reset`; `pnpm --filter studio build && pnpm --filter studio start`; `pnpm --filter studio test:e2e` PASS (cả `@slow`); `pnpm check`, `pnpm build` xanh.
- **DoD:** route table khớp bảng P5 (nếu lệch → cập nhật D7/README với ký hiệu thật); Lighthouse ≥ 90 mục tiêu (không cam kết). **Rủi ro:** e2e sửa DB dùng chung → branch Neon riêng (G7). **Song song:** không.

### P9. Điểm cộng: GitHub OAuth, Vercel
- **Cần trước:** P4 (GitHub), P8 (deploy).
- **GitHub:** tạo GitHub OAuth App, callback lấy từ Neon Console, bật GitHub trong Neon Auth; `oauth.start("github")`, `signInWithGithubAction` (`callbackURL = APP_URL + callbackUrl` an toàn), nút ở `/login`; CSP `form-action` thêm `https://github.com` + origin Neon Auth (**chưa kiểm chứng**); e2e chạy thủ công; user GitHub mới có role `user`, vào `/admin` → `/403`.
- **Vercel:** root dir `apps/studio`; env `AUTH_PROVIDER`, `DATA_PROVIDER`, `DATABASE_URL(_UNPOOLED)`, `NEON_AUTH_*`, `NEXT_PUBLIC_APP_URL`; không set `DEMO_AUTH`; `neon neon-auth domain add https://<app>.vercel.app`; cập nhật GitHub callback.
- **Kiểm chứng:** chạy lại authorization/admin-isr e2e với `BASE_URL=https://<app>.vercel.app`. **DoD:** URL production hoạt động, OG preview hiện được. **Song song:** GitHub cùng P5–P7.

### P10. README và nộp bài
- **Tasks:** viết `README.md`: (1) cách chạy (env, `neon:migrate`, `neon:seed`, dev/build/start, test); (2) ảnh route table + lý do chọn chiến lược từng route + chú giải `○/◐/ƒ`; (3) ảnh Lighthouse; (4) ảnh view-source `/deadlines/1`; (5) hai câu trả lời — **(1) ISR:** nội dung công khai, đọc nhiều, ít đổi → cache cho TTFB/SEO tốt; `updateTag` khi admin thêm/xoá để không đợi rebuild; id mới render khi truy cập đầu. **(2) Chỉ Middleware:** dễ bị bỏ qua do matcher sai; Server Action là endpoint POST công khai không đi qua check của trang; lỗ hổng bỏ qua middleware (CVE-2025-29927, header `x-middleware-subrequest`); role trong cookie có thể cũ; prefetch/RSC request; (6) ghi điều chỉnh so với đề (Better Auth/Neon, Vitest, Postgres).
- **Kiểm chứng:** `git status` không `.next`/`node_modules`; link ảnh README mở được. **DoD:** checklist F tick hết.

## F. Checklist nghiệm thu

- **A Rendering:** route table `○ /`, `○ /subjects/*`, `○ /deadlines 1m`, `○ /deadlines/1..12`, `ƒ /admin`, `◐/ƒ /dashboard`; `/deadlines/999` → 404 UI dự án (status 404 nếu D7-A); xoá xong 404 ngay; list đổi sau 60s.
- **B Routing:** `(public)` + `(app)` layout riêng; sidebar lồng + active link; loading/error("Thử lại")/not-found; `'use client'` chỉ ở countdown, filter, toggle, form/dialog admin, AuthStatus.
- **C Auth:** đăng nhập 2 tài khoản; session `userId` + `role: "user"|"admin"`; header tên/role/đăng nhập/đăng xuất.
- **D Phân quyền:** `can()` 1 file, test 12 ô; proxy chuyển hướng đúng; `/admin` + 3 action tự check quyền + Zod (unit test chứng minh).
- **E SEO:** metadata + OG từng deadline, sitemap/robots, noindex, JSON-LD, font vi, `next/image`, Lighthouse.
- **Nộp bài:** README đủ 5 mục; repo sạch. **Bonus:** GitHub OAuth, Vercel, test `can()`.
- **Gate:** `pnpm check` + `pnpm build` xanh; e2e xanh trên bản build prod.

## G. Câu hỏi mở / giả định cần xác nhận (mặc định in đậm)

> **Đã chốt (người dùng, 2026-11-03):** 1, 3, 4, 7, 8, 9. Mục 2, 5, 6 dùng mặc định (đã giải thích, chờ xác nhận).

1. ✅ **Giữ `userId`** (đề không ép). README ghi "id = `userId`".
2. `/deadlines` khi admin thêm/xoá: **chờ tối đa 60s (chứng minh ISR)** hay cập nhật ngay?
3. ✅ **Drop bảng `orgs/projects`** (code mock của base): migration `0004` thêm `DROP TABLE`, xoá schema/test/mock liên quan (P2, P3).
4. ✅ **Xoá hết phần của base project**: demo login (`DEMO_AUTH`, `lib/demo-session.ts`), provider supabase/keycloak/fastapi-oauth, `DATA_PROVIDER=mock`, `packages/db/supabase`, biến env tương ứng, các doc `docs/providers.md`/`authentication.md` phần liên quan (cập nhật gọn). Chỉ còn **neon-auth + neon Postgres**. Tác động: P1 bớt việc đổi role ở provider khác; thêm task dọn vào P3; `ESLint`/`turbo.json`/`.env.example` dọn theo. Làm sau khi P1 xanh, trước khi viết feature.
5. Header public: **client island (giữ `○`)** hay server Suspense (`◐`)?
6. Nút toggle "đã xong" **chỉ ở `/dashboard/deadlines`**, trang chi tiết luôn tĩnh?
7. ✅ **Dùng chung branch Neon hiện có** (`.neon` → `production`), không tạo branch riêng. Hệ quả: e2e/seed chạm dữ liệu thật → test tự dọn, `seed --reset` chỉ xoá deadline id>12 + completions. Admin: nếu chưa có `NEON_API_KEY` thì bấm "Make admin" ở Console một lần (P0 sẽ báo).
8. ✅ **Hoãn GitHub OAuth và Vercel** (điểm cộng) sang sau; **P9 ra khỏi phạm vi hiện tại**. Bỏ phần CSP/GitHub khỏi P4.
9. ✅ **README ở cả hai**: `README.md` gốc (bài nộp đầy đủ) + `apps/studio/README.md` (rút gọn, trỏ về gốc).

## G2. Sửa đổi sau review (Opus reviewer) — có hiệu lực, ưu tiên hơn nội dung phase phía trên nếu mâu thuẫn

| Mã | Mức | Sửa |
|---|---|---|
| R1-B1 | blocker | `loading.tsx` bọc mọi segment con → `/deadlines/999` trả 200. Đã đưa list vào `deadlines/(list)/`; cấm Suspense bọc `children` ở layout root/`(public)`. P5 kiểm `404` thật |
| R1-B2 | blocker | `null` cache `max` cho id chưa tồn tại → sau khi tạo vẫn 404. `createDeadlineAction` phải `updateTag(deadline:<idMới>)`; thêm e2e: truy cập id kế tiếp → tạo → 200 |
| R1-M1 | major | Cookie `session_data` TTL 300s, không mint trong RSC → proxy có thể `role:null`. `/admin` dùng `redirect("/403")` cho user không phải admin; `forbidden()` chỉ cho deny mặc định. Có thể thêm bước mint session_data trong proxy cho `/admin*` |
| R1-M2 | major | Chặn sign-up ở handler chỉ là mỹ phẩm (seed cũng gọi trực tiếp Neon). Sau seed, tắt email sign-up ở Console nếu GitHub vẫn chạy (kiểm ở P0.4); nếu không, ghi giới hạn trong README. Match block theo `ctx.params.path[0]==="sign-up"` |
| R1-M3 | major | P1 DoD chuyển sang P3 (đã sửa) |
| R1-M4 | major | P6 và P7 không chia sẻ file: noindex admin/dashboard thuộc P6; P7 chỉ `deadlines/[id]`, sitemap, robots, OG. `features/deadlines/queries.ts` do P5 sở hữu, P6/P7 chỉ import |
| R1-M5 | major | Session expose `id` (xem G1) |
| R1-m1 | minor | Cookie thật là `__Secure-neon-auth.local.session_data` (secure) — D1 ghi cả hai tên |
| R1-m2 | minor | Create/delete đọc role tươi (`verifySessionFresh`) hoặc README ghi cửa sổ 5 phút (câu hỏi 2) |
| R1-m3 | minor | Id route validate bằng `^[1-9]\d*$` (không nhận `01`, `1.0`) |
| R1-m4 | minor | Toggle với id đã xoá → `{error}` |
| R1-m5 | minor | "Đã xong" chỉ hiển thị trong `/dashboard*`; countdown public luôn tĩnh theo hạn |
| R1-m6 | minor | README nói rõ: Better Auth do Neon quản lý, session chính là token DB mờ + cookie JWT cache; `/dashboard` hiện `◐` |
| R1-m7 | minor | P9 (GitHub) chạy **sau** P4 tuần tự, không song song với P5–P7 (cùng sửa `/login`, `features/auth`, CSP) |

Đã xác minh đúng bởi reviewer: `export const instant` tồn tại (v16.3+); mẫu "blocking product page" khớp D7; `cacheLife("minutes")` = 5m/1m/1h; `updateTag` chờ dữ liệu mới; `validateSessionData`, `admin.setRole`, `createAuthClient` có trong `@neon/auth@0.8.2`.

## G3. Kết quả P0 (2026-11-03)

| Kiểm tra | Kết quả |
|---|---|
| Node / pnpm | Node v22.23.3, pnpm 11.25.0 → seed `.mjs` chạy được |
| Cột `role` trong `neon_auth.user` | **Có** (`text`, cùng `banned`, `banReason`, `banExpires`) → admin plugin đã bật. User hiện có (1, của bạn) có `role='user'` |
| Session có role? | `packages/auth/src/neon-auth/server.ts:54` đã đọc `data.user.role` → role đi theo đối tượng `user` của Better Auth. D1 **được giữ**, chưa cần fallback tự host |
| Proxy hiện tại | `neon-auth/proxy.ts` luôn trả `role: null` → việc giải mã cookie `session_data` (P4.2) là code **mới**, không phải sửa nhỏ |
| DB | Dùng chung Neon project/branch `production` của base: có schema `public` (`orgs`, `projects`), `drizzle`, `neon_auth`. Chưa có 3 bảng của Hub. P2 drop `orgs/projects` theo G3 |
| Docs Next | `instant` được dùng trong `building.md`, `instant-navigation.md`, `authentication-with-cache-components.md` (không có file riêng trong route-segment-config); `generate-sitemaps.md`, `image-response.md`, `sitemap/robots/opengraph-image.md`, `json-ld.md` đều có |
| **Chưa làm (cần bạn / sẽ làm ở P2)** | (a) Không đăng nhập thử bằng tài khoản thật vì không có mật khẩu của user hiện có và không tự tạo tài khoản trên Neon từ P0; việc tạo 2 tài khoản bắt buộc nằm ở seed P2. (b) Console: nút "Make admin", có `NEON_API_KEY` hay không, công tắc sign-up → cần bạn xem |
| Cảnh báo | `pg` in cảnh báo `sslmode=require` (alias verify-full): vô hại, thêm `sslmode=verify-full` vào URL để tắt |

## G4. Kết quả P1–P3 và việc chuyển sang P5

- P1, P2, P3 xong và đã kiểm. Build: `/`, `/403`, `/admin`, `/deadlines` là `○`; `/dashboard*`, `/login`, `/deadlines/[id]`, `/subjects/[slug]` là `◐` (placeholder).
- **Phát hiện P3 cho P5 (status 404 của `/deadlines/[id]`):** trên `next start` id sai định dạng (`abc`, `01`) trả **200 + noindex** dù không có `loading.tsx`/Suspense phía trên `[id]`, vì header/footer tĩnh của `(public)/layout` được stream trước khi `notFound()` chạy. UI vẫn là trang 404 của dự án (đáp ứng R-A7), nhưng là soft-404. P5 phải thử theo thứ tự: (a) `generateStaticParams` thật + lookup `"use cache"` ở đầu page (trước khi layout stream), (b) kiểm lại bằng `curl -sI` trên bản build; nếu vẫn 200, chấp nhận D7-B (UI 404 + `noindex`) và ghi trung thực trong README. Không dùng `dynamicParams=false` vì phá luồng R1-B2 (id admin mới tạo phải truy cập được).
- `/admin` hiện không có sidebar (shell nằm ở `dashboard/layout`); P6 cân nhắc đưa lên `(app)`.

## G5. Kết quả hoàn thành P5, P6, P7 (2026-11-03)

- **P5 & P7 (Dữ liệu deadline, trang public, SEO):**
  - Xây dựng đầy đủ `features/deadlines/{schemas,tags,countdown,filters,server,queries,actions}` cùng unit tests đạt 100% pass (73 tests studio).
  - Hoàn thiện UI trang `/` (Hero, 4 môn học, deadline sắp tới), `/subjects/[slug]` (SSG với 4 môn prerender), `/deadlines` (ISR 60s kèm client filter), `/deadlines/[id]` (gSP 12 deadline, Breadcrumb, JSON-LD, metadata động, ImageResponse OG image).
  - Tuân thủ 100% design system và shadcn/ui compound components (`Card`, `Badge`, `Button`, `NativeSelect`, `Tabs`, `Breadcrumb`, `Separator`, `Empty`, Tabler icons).
- **P6 (Dashboard, Admin, Server Actions):**
  - `/dashboard`: Metrics row `dl` (Sắp tới, Đã xong, Quá hạn), danh sách việc cần làm kèm `CompletionToggle`.
  - `/dashboard/deadlines`: Danh sách toàn bộ deadline kèm `CompletionToggle` cập nhật tiến độ tức thì.
  - `/admin`: Form thêm deadline (`CreateDeadlineForm` sử dụng `FieldGroup`, `Field`, `Input`, `Textarea`, `NativeSelect`, `Alert`) + bảng danh sách deadline (`Table`) kèm nút xoá có xác nhận (`AlertDialog` qua `DeleteDeadlineButton`).
  - Kiểm tra phân quyền đa tầng: Middleware chuyển hướng, Server Component kiểm tra tại trang, Server Actions kiểm tra `can(role, action)` và validate Zod schema.
- **Xác minh Production Build và Curl:**
  - Build thành công toàn bộ route: `/` (○), `/deadlines` (○ 1m 1h), `/deadlines/1..12` (○), `/subjects/*` (○), `/dashboard*` (◐), `/admin` (ƒ), `/403` (○), `/sitemap.xml` (ƒ), `/robots.txt` (○).
  - Curl 1: Chưa đăng nhập truy cập `/dashboard` hoặc `/admin` -> 307 Redirect tới `/login?callbackUrl=...`
  - Curl 2: Sinh viên (`sv@ptit.edu.vn`) truy cập `/admin` -> 307 Redirect tới `/403`
  - Curl 3: Lớp trưởng (`admin@ptit.edu.vn`) truy cập `/admin` -> 200 OK
  - Curl 4: POST sign-up (`/api/auth/sign-up/email`) -> 403 Forbidden ("Đăng ký tài khoản đã bị tắt.")

## H. Sổ rủi ro

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Neon Auth không trả `user.role` | Thấp | Cao | Kiểm ở P0; nếu sai dùng D1-fallback |
| Seed tạo user qua HTTP bị chặn origin / không gán admin bằng API | TB | TB | Header `Origin`; Console "Make admin"; script in hướng dẫn |
| `instant=false` + gSP không cho `○`, hoặc 404 vẫn status 200 | TB | Thấp–TB | D7-B; README ghi ký hiệu thật |
| `updateTag` không xoá entry ISR cấp route | Thấp | Cao (R-A4) | Thêm `revalidatePath`; e2e `admin-isr` bắt lỗi |
| Build cần DB (gSP, use cache) mà CI/Vercel thiếu env | Cao nếu quên | Cao | `turbo.json` đã có `DATABASE_URL`; ghi rõ README |
| Đổi `Role` vỡ test provider khác | Chắc chắn | Thấp | P1 sửa luôn test |
| Font OG tiếng Việt (satori, tracing Vercel) | TB | Thấp | Commit TTF; test ảnh trên Vercel |
| Cookie session_data trễ ≤ 5 phút / chưa mint | TB | Thấp | Check ở page/action (defense in depth) |
| E2E sửa dữ liệu dùng chung | TB | TB | Branch Neon riêng, `--reset`, test tự dọn |
| Hydration mismatch countdown/filter | TB | Thấp | Server snapshot cố định, `useSyncExternalStore` |
| CSP chặn redirect OAuth GitHub | TB | Thấp (bonus) | Thêm origin vào `form-action` |
| Neon Auth Beta đổi API | Thấp | TB | Pin `@neon/auth@0.8.2` |
