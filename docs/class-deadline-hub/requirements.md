# LTWNC – BTTH 3: Class Deadline Hub — Yêu cầu

> Nguồn: `LTWNC BTTH 3 Xây dựng Class Deadline Hub.docx`. File này chuyển nguyên văn yêu cầu sang Markdown
> (mục 1–8), kèm **nghiệp vụ bổ sung đề xuất** (mục 9) và **điều chỉnh so với đề** (mục 10).
> Mã yêu cầu (`R-xx`) dùng để truy vết trong `plan.md`.

## 1. Mục tiêu

Xây dựng **Class Deadline Hub**, cổng web deadline của lớp:

- Ai cũng xem được deadline công khai. Link chia sẻ phải có **ảnh xem trước** (Open Graph) và **Google tìm được**.
- Sinh viên đăng nhập để **đánh dấu deadline đã xong**.
- Lớp trưởng (admin) **thêm và xoá** deadline.
- Dữ liệu gốc: 4 môn học, khoảng 12 deadline (đề gốc: file JSON phía server → **đã đổi sang Neon Postgres**, mục 10).

### Tài khoản bắt buộc

| Email | Mật khẩu | Vai trò |
| :--- | :--- | :--- |
| admin@ptit.edu.vn | admin123 | admin |
| sv@ptit.edu.vn | sv123456 | user |

## 2. A. Rendering (Buổi 7)

Mỗi route dùng đúng chiến lược render:

| Route | Truy cập | Chiến lược | Mã |
| :--- | :--- | :--- | :--- |
| `/` | Mọi người | SSG | R-A1 |
| `/subjects/[slug]` | Mọi người | SSG | R-A2 |
| `/deadlines` | Mọi người | ISR, làm mới sau **60 giây** | R-A3 |
| `/deadlines/[id]` | Mọi người | ISR, **làm mới ngay** khi admin thêm hoặc xoá | R-A4 |
| `/dashboard` | Đã đăng nhập | SSR | R-A5 |
| `/admin` | Chỉ admin | SSR | R-A6 |

- R-A7: Id không tồn tại → hiện trang **404 của dự án**.

## 3. B. Routing và component (Buổi 7)

- R-B1: Chia route group `(public)` và `(app)`, mỗi nhóm có **layout riêng**.
- R-B2: `/dashboard` có **layout lồng nhau (sidebar)**; menu **tô sáng trang hiện tại**.
- R-B3: Có `loading`, `error` (nút **“Thử lại”**) và `not-found`.
- R-B4: Mặc định **Server Component**. Chỉ dùng `'use client'` ở component cần tương tác: đếm ngược
  (“Còn X ngày / Quá hạn Y ngày”) và bộ lọc.

## 4. C. Xác thực (Buổi 8)

- R-C1: Đăng nhập bằng thư viện auth với **Credentials** (email + mật khẩu), session kiểu **JWT**.
  *(Đề gốc dùng NextAuth/Auth.js — dự án này dùng **Better Auth**, xem mục 10.)*
- R-C2: `id` và `role` có trong session, khai báo kiểu TypeScript đầy đủ (**không dùng `string` cho role**).
- R-C3: Header hiển thị **tên, vai trò** và nút **Đăng nhập / Đăng xuất**.

## 5. D. Middleware và phân quyền (Buổi 8)

Ma trận phân quyền viết **một nơi duy nhất**, dùng hàm `can(role, action)`:

| Hành động | guest | user | admin |
| :--- | :---: | :---: | :---: |
| Xem deadline | ✓ | ✓ | ✓ |
| Đánh dấu đã xong | ✗ | ✓ | ✓ |
| Thêm deadline | ✗ | ✗ | ✓ |
| Xoá deadline | ✗ | ✗ | ✓ |

- R-D1: Middleware bảo vệ `/dashboard` và `/admin`.
- R-D2: Chưa đăng nhập → chuyển `/login`, **giữ đường dẫn quay lại**.
- R-D3: User vào `/admin` → chuyển `/403`.
- R-D4: Phân quyền **không chỉ dựa vào Middleware**: trang `/admin` và **mọi Server Action** tự kiểm tra quyền;
  dữ liệu đầu vào được **validate**.

## 6. E. SEO và tối ưu (Buổi 8)

- R-E1: **Metadata động** cho `/deadlines/[id]`, kèm **ảnh chia sẻ sinh động** (OG image) cho từng deadline.
- R-E2: **sitemap** (gồm mọi deadline) và **robots** (chặn `/dashboard`, `/admin`).
- R-E3: `/login` và `/dashboard` **không được lập chỉ mục** (noindex).
- R-E4: **JSON-LD** kiểu `BreadcrumbList` ở trang chi tiết.
- R-E5: Dùng `next/font` (hỗ trợ **tiếng Việt**) và `next/image`.
- R-E6: Đo **Lighthouse** trên bản production cho `/` và `/deadlines/[id]`.

## 7. Sản phẩm nộp

- R-S1: Mã nguồn (không kèm `node_modules`, `.next`).
- R-S2: `README.md` gồm:
  1. cách chạy;
  2. **ảnh kết quả `build`** và lý do chọn chiến lược cho từng route;
  3. **điểm Lighthouse**;
  4. **ảnh view-source** của `/deadlines/1`;
  5. trả lời 2 câu hỏi:
     - (1) Vì sao `/deadlines/[id]` dùng ISR?
     - (2) Nếu chỉ dùng Middleware để bảo vệ `/admin` thì có rủi ro gì?

## 8. Điểm cộng (tối đa +1, tổng không quá 10)

- R-X1: Đăng nhập **GitHub (OAuth)**.
- R-X2: Deploy lên **Vercel**.
- R-X3: Test **Jest** cho `can()`. *(Repo đã dùng Vitest; xem mục 10.)*

---

## 9. Nghiệp vụ bổ sung (đề xuất — cần duyệt)

Đề không nêu rõ; các quy tắc dưới đây là **đề xuất hợp lý theo thực tế**, để plan có thể cụ thể.

### 9.1 Dữ liệu

- **Môn học (Subject)**: `id`, `slug` (duy nhất), `name`, `code` (mã học phần PTIT), `lecturer`, `color`.
  4 môn seed (ví dụ): *Lập trình web nâng cao*, *Cơ sở dữ liệu*, *Mạng máy tính*, *Công nghệ phần mềm*.
- **Deadline**: `id` (số nguyên tăng dần → `/deadlines/1`), `subjectId`, `title`, `description`,
  `dueAt` (ISO, giờ Việt Nam `Asia/Ho_Chi_Minh`), `createdAt`, `createdBy`.
  Trạng thái phái sinh (không lưu): *sắp tới / hôm nay / quá hạn* từ `dueAt`.
- **Hoàn thành (Completion)**: `(userId, deadlineId, completedAt)`, duy nhất theo cặp. Tiến độ **của riêng từng
  tài khoản**, không công khai.
- Seed ~12 deadline trải 4 môn, có cả deadline đã quá hạn, hôm nay và tương lai để demo đủ trạng thái.

### 9.2 Quy tắc

1. **Công khai** chỉ gồm thông tin deadline (tiêu đề, môn, hạn, mô tả); **không** lộ ai đã làm xong.
2. **Đánh dấu đã xong** là bật/tắt (toggle). Được phép đánh dấu cả deadline quá hạn (nộp muộn). Admin cũng
   là một user nên cũng có tiến độ riêng.
3. **Thêm deadline** (admin): bắt buộc môn, tiêu đề (3–120 ký tự), hạn (phải là thời điểm hợp lệ, **không ở quá khứ**
   khi tạo), mô tả (≤ 1000 ký tự, tuỳ chọn).
4. **Xoá deadline** (admin): xoá cứng kèm các completion liên quan, có hộp thoại xác nhận. Id đã xoá → 404.
5. Admin không sửa deadline (đề chỉ yêu cầu thêm/xoá) — ghi vào non-goals.
6. **Đếm ngược** tính ở client theo múi giờ người xem: “Còn X ngày” (X = làm tròn lên theo ngày còn lại; hôm nay → “Còn
   X giờ”), “Quá hạn Y ngày”. Khi đã đánh dấu xong thì hiển thị “Đã xong”.
7. **Bộ lọc** `/deadlines`: theo môn, theo trạng thái (sắp tới/quá hạn), sắp xếp theo hạn; trạng thái lọc nằm
   trong query string để chia sẻ được. *Lưu ý*: query string làm trang động — bộ lọc chạy phía client trên dữ liệu
   ISR đã có (giữ ISR đúng nghĩa).
8. **Dashboard** (đã đăng nhập): số deadline sắp tới, đã xong, quá hạn của tôi; danh sách việc cần làm. Sidebar:
   *Tổng quan*, *Deadline của tôi*, *(admin) Quản trị*.
9. **Admin**: bảng deadline + form thêm + nút xoá. Chỉ admin; user bị `/403`.
10. **Đăng ký công khai tắt** — chỉ 2 tài khoản seed (và GitHub nếu làm điểm cộng; người đăng nhập GitHub mặc định
    là `user`, không bao giờ tự thành admin).
11. **Redirect sau đăng nhập**: `/login?callbackUrl=/admin` → quay lại đúng đường dẫn, chỉ chấp nhận đường dẫn nội bộ
    (chống open-redirect).
12. **Link chia sẻ**: mỗi deadline có OG image sinh động (tên môn, tiêu đề, hạn), `og:title/description`, canonical.
13. Ngôn ngữ giao diện: **tiếng Việt**; `<html lang="vi">`.

## 10. Điều chỉnh so với đề

| Đề gốc | Dự án này | Lý do |
| :--- | :--- | :--- |
| NextAuth (Auth.js) Credentials, JWT | **Better Auth** (qua provider auth của repo, Neon Auth) | Yêu cầu của người làm; cùng chức năng, role/session vẫn có kiểu TS đầy đủ |
| Dữ liệu file JSON phía server | **Chốt hẳn Neon Postgres** (Drizzle), **bỏ hoàn toàn lưu JSON**. Dữ liệu mẫu (4 môn, ~12 deadline, 2 tài khoản) nạp bằng **script seed** idempotent | Có env Neon sẵn; mutation/revalidate chuẩn production. Quyết định của người làm (2026-11-03) |
| Jest | **Vitest** (repo đã cấu hình) | API tương thích; tránh thêm runner thứ hai |
