# Class Deadline Hub — Cổng thông tin deadline của lớp

Hệ thống theo dõi và quản lý deadline môn học cho lớp học, xây dựng trên nền tảng **Next.js 16.4 (Turbopack, Cache Components)**, **Turborepo**, **Neon Auth** (managed Better Auth) và **Neon Postgres (Drizzle ORM)** với hệ thống giao diện **shadcn/ui** và **Animate UI**.

---

## 1. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- Node.js >= 20 (khuyến nghị Node 22+)
- pnpm >= 9 (khuyến nghị pnpm 11+)

### Cài đặt dependencies
```bash
pnpm install
```

### Cấu hình biến môi trường
File cấu hình mẫu nằm tại `apps/studio/.env.example`. Tạo file `apps/studio/.env.local`:
```env
AUTH_PROVIDER=neon-auth
DATA_PROVIDER=neon
DATABASE_URL=postgresql://...
NEON_AUTH_BASE_URL=https://...
NEON_AUTH_COOKIE_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Nạp dữ liệu mẫu (Seed Database)
Chạy script seed nạp 4 môn học, 12 deadline và 2 tài khoản kiểm thử:
```bash
pnpm --filter @workspace/db neon:seed
```

### Chạy ứng dụng
- **Chế độ phát triển (Development):**
  ```bash
  pnpm turbo run dev --filter=studio
  ```
  Ứng dụng chạy tại: `http://localhost:3001`

- **Build và chạy bản Production:**
  ```bash
  pnpm --filter studio build
  pnpm --filter studio start
  ```

- **Chạy kiểm thử (Unit tests, typecheck, lint):**
  ```bash
  pnpm test
  pnpm turbo run typecheck lint
  ```

---

## 2. Tài khoản kiểm thử

| Email | Mật khẩu | Vai trò (Role) | Mô tả |
| :--- | :--- | :--- | :--- |
| `admin@ptit.edu.vn` | `admin123` | `admin` | Lớp trưởng: toàn quyền xem, hoàn thành, thêm và xoá deadline |
| `sv@ptit.edu.vn` | `sv123456` | `user` | Sinh viên: xem danh sách và đánh dấu hoàn thành deadline cá nhân |

---

## 3. Bảng kết quả Build và Chiến lược Rendering

Kết quả build thực tế từ `pnpm --filter studio build` (Next.js 16.4 với Cache Components):

```
Route (app)                                 Revalidate  Expire
┌ ○ /                                               1m      1h
├ ○ /_not-found
├ ○ /403
├ ƒ /admin
├ ƒ /api/auth/[...path]
├ ƒ /auth/callback
├ ƒ /auth/expired
├ ◐ /dashboard
├ ◐ /dashboard/deadlines
├ ○ /deadlines                                      1m      1h
├   /deadlines/[id]
│ ├ ◐ /deadlines/[id]
│ ├ ○ /deadlines/1                                 30d      1y
│ ├ ○ /deadlines/2                                 30d      1y
│ └ ◐ [+10 more paths]
├ ƒ /deadlines/[id]/opengraph-image-104vc5
├ ○ /icon.svg
├ ◐ /login
├ ○ /robots.txt
├ ƒ /sitemap.xml
└   /subjects/[slug]
  ├ ◐ /subjects/[slug]
  ├ ○ /subjects/cong-nghe-phan-mem                 30d      1y
  ├ ○ /subjects/co-so-du-lieu                      30d      1y
  └ ◐ [+2 more paths]

ƒ Proxy (Middleware)
○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
```

### Lý do chọn chiến lược cho từng route:

1. **`/` (Trang chủ - SSG `○`):**
   - Giới thiệu chung, hiển thị thông tin 4 môn học và các deadline sắp tới gần nhất.
   - Nội dung tĩnh, truy cập công khai, không thay đổi theo người dùng. Render tĩnh tại build time giúp tối ưu TTFB và SEO.

2. **`/subjects/[slug]` (Chi tiết môn học - SSG `○`):**
   - Số lượng môn học cố định (4 môn seed).
   - Sử dụng `generateStaticParams` để tạo sẵn HTML cho toàn bộ các môn học ngay lúc build.

3. **`/deadlines` (Danh sách deadline - ISR 60s `○ 1m 1h`):**
   - Trang công khai tập trung lượng truy cập lớn nhất của sinh viên.
   - Cấu hình `cacheLife("minutes")` (revalidate sau 60 giây). Giảm tải cho database mà vẫn đảm bảo dữ liệu mới theo định kỳ. Bộ lọc (theo môn, trạng thái, sắp xếp) chạy hoàn toàn ở phía client trên dữ liệu tĩnh đã có.

4. **`/deadlines/[id]` (Chi tiết deadline - ISR + On-demand Revalidation):**
   - Render trước các deadline hiện có bằng `generateStaticParams`.
   - Cung cấp thẻ meta Open Graph động và ảnh chia sẻ sinh động (`opengraph-image.tsx`).
   - Cập nhật tức thời khi admin thêm hoặc xoá thông qua cơ chế Server Action gọi `updateTag("deadline:" + id)`.

5. **`/dashboard` & `/dashboard/deadlines` (Trang sinh viên - SSR / PPR `◐`):**
   - Dữ liệu hiển thị tiến độ hoàn thành phụ thuộc vào phiên đăng nhập của từng tài khoản (`completions` theo `userId`).
   - Yêu cầu xác thực runtime, layout có sidebar điều hướng và nút toggle hoàn thành.

6. **`/admin` (Trang quản trị - SSR `ƒ`):**
   - Dành riêng cho tài khoản có vai trò `admin`. Kiểm tra quyền nghiêm ngặt theo từng request ở cả tầng Middleware lẫn Page component (`verifySession` + `can(role, "deadline:create")`).

7. **`/403` & `/_not-found` (Lỗi quyền và 404 - SSG `○`):**
   - Giao diện tĩnh thân thiện với người dùng bằng tiếng Việt, có nút điều hướng quay lại trang chủ.

---

## 4. Trả lời câu hỏi lý thuyết

### Câu hỏi 1: Vì sao `/deadlines/[id]` dùng ISR?
1. **Tối ưu tốc độ tải trang và chịu tải cao:** Trang chi tiết deadline có tần suất đọc (read) của sinh viên cao gấp hàng chục lần so với tần suất chỉnh sửa/tạo mới (write). Việc dùng ISR cho phép phục vụ bản HTML tĩnh trực tiếp từ bộ nhớ đệm (Edge/CDN cache) với thời gian phản hồi (TTFB) cực nhanh và giảm thiểu truy vấn trực tiếp vào database.
2. **SEO và xem trước mạng xã hội (Open Graph):** Mỗi deadline đều có metadata và ảnh Open Graph động riêng biệt. ISR đảm bảo các bot tìm kiếm (Google) và crawler mạng xã hội (Facebook, Zalo, Telegram) luôn nhận được trang HTML hoàn chỉnh có sẵn dữ liệu và thẻ meta mà không phải chờ client render.
3. **Cập nhật tức thời (On-Demand Revalidation):** Khác với ISR thuần thời gian, Next.js cho phép dùng cache tags (`updateTag`). Khi admin thêm hoặc xoá deadline, cache của route `/deadlines/[id]` tương ứng sẽ được làm mới ngay lập tức mà không phải chờ hết chu kỳ thời gian hay rebuild lại toàn bộ dự án.

---

### Câu hỏi 2: Nếu chỉ dùng Middleware để bảo vệ `/admin` thì có rủi ro gì?
1. **Rủi ro bỏ sót do cấu hình Matcher:** Middleware dựa vào matcher URL. Nếu cấu hình regex thiếu sót, hoặc người dùng truy cập với các biến thể URL (như query params đặc biệt, encode ký tự, hoặc đuôi file tĩnh), request có thể lọt qua mà không được middleware kiểm tra.
2. **Server Actions là endpoint POST công khai:** Trong Next.js, Server Actions hoạt động như các endpoint RPC/HTTP POST độc lập. Chúng không phụ thuộc vào việc người dùng có render trang `/admin` hay không. Nếu một Server Action (như `createDeadlineAction`, `deleteDeadlineAction`) không tự kiểm tra phân quyền bên trong thân hàm, kẻ xấu có thể gửi request POST trực tiếp vào ID của action để thao tác dữ liệu trái phép.
3. **Role trong cookie có thể bị lỗi thời (Stale):** Middleware thường chỉ kiểm tra cookie JWT nhanh. Nếu admin bị giáng chức hoặc thu hồi quyền trong cơ sở dữ liệu, cookie JWT trên máy người dùng có thể vẫn còn hiệu lực trong vài phút. Do đó, trang `/admin` và các Server Action nhạy cảm cần áp dụng kiểm tra lại phiên trực tiếp (Fresh verification).
4. **Lỗ hổng Bypass Middleware cấp hạ tầng:** Các lỗ hổng bảo mật cấp framework (như giả mạo header nội bộ `x-middleware-subrequest` hay lỗi proxy rewrite) có thể vượt qua lớp bảo vệ biên. Vì vậy, nguyên tắc **Defense in Depth** (bảo vệ đa tầng) bắt buộc phải kiểm tra quyền tại cả 3 lớp:
   - Lớp 1: Middleware (`proxy.ts`) chuyển hướng sớm.
   - Lớp 2: Server Component (`admin/page.tsx`) kiểm tra quyền trước khi render dữ liệu.
   - Lớp 3: Từng Server Action (`actions.ts`) kiểm tra quyền và xác thực dữ liệu đầu vào bằng Zod schema.

---

## 5. Kết quả kiểm tra Curl thực tế trên bản Production Build

Đã khởi chạy production server (`next start --port 3001`) và kiểm thử bằng `curl`:

### 1. Chưa đăng nhập truy cập `/dashboard` hoặc `/admin` → chuyển về `/login?callbackUrl=...`
```bash
$ curl.exe -sI http://localhost:3001/dashboard
HTTP/1.1 307 Temporary Redirect
location: /login?callbackUrl=%2Fdashboard

$ curl.exe -sI http://localhost:3001/admin
HTTP/1.1 307 Temporary Redirect
location: /login?callbackUrl=%2Fadmin
```

### 2. Sinh viên (`sv@ptit.edu.vn`) truy cập `/admin` → chuyển về `/403`
```bash
$ curl.exe -b sv-cookie.txt -sI http://localhost:3001/admin
HTTP/1.1 307 Temporary Redirect
location: /403
server-timing: proxy;dur=4.48;desc="Proxy Auth Check"
```

### 3. Lớp trưởng (`admin@ptit.edu.vn`) truy cập `/admin` → trả về `200 OK`
```bash
$ curl.exe -b admin-cookie.txt -sI http://localhost:3001/admin
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

### 4. POST đăng ký tài khoản (`/api/auth/sign-up/email`) → bị chặn `403 Forbidden`
```bash
$ curl.exe -i -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ptit.edu.vn","password":"12345678"}'
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"message":"Đăng ký tài khoản đã bị tắt."}
```

---

## 6. Tuân thủ Thiết kế và Thư viện UI

- **100% shadcn/ui & Animate UI**: Sử dụng các thành phần chuẩn từ `@workspace/ui/components` (`Button`, `Badge`, `Card`, `Table`, `Tabs`, `AlertDialog`, `FieldGroup`, `Field`, `Input`, `Textarea`, `NativeSelect`, `Empty`, `Breadcrumb`, `Spinner`, `Alert`, `Separator`).
- **Không tự chế hoặc reinvent component**: Tuân thủ triệt để cấu trúc compound components và các quy tắc accessibility của shadcn (mọi dialog/alert-dialog đều có Title/Description, form sử dụng FieldGroup/Field/FieldError, trạng thái rỗng sử dụng Empty).
- **Hệ thống Design System**: Tuân thủ thang khoảng cách 7 bậc, semantic color tokens (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`), hỗ trợ đầy đủ chế độ Sáng / Tối (Light & Dark mode).
