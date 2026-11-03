// Pure seed data for Class Deadline Hub (no I/O), so it can be unit tested. Used by seed.mjs.

const HOUR = 3_600_000
const DAY = 24 * HOUR

export const SUBJECTS = [
  {
    slug: "lap-trinh-web-nang-cao",
    name: "Lập trình web nâng cao",
    code: "INT1433",
    lecturer: "TS. Nguyễn Văn An",
    color: "#2563eb",
  },
  {
    slug: "co-so-du-lieu",
    name: "Cơ sở dữ liệu",
    code: "INT1313",
    lecturer: "ThS. Trần Thị Bình",
    color: "#16a34a",
  },
  {
    slug: "mang-may-tinh",
    name: "Mạng máy tính",
    code: "INT1336",
    lecturer: "TS. Lê Quang Cường",
    color: "#ea580c",
  },
  {
    slug: "cong-nghe-phan-mem",
    name: "Công nghệ phần mềm",
    code: "INT1340",
    lecturer: "ThS. Phạm Minh Dũng",
    color: "#9333ea",
  },
]

/** Fixed ids 1..12 keep `/deadlines/1` stable across reseeds. `offsetMs` is relative to the seed time. */
export const DEADLINES = [
  { id: 1, subject: "lap-trinh-web-nang-cao", title: "Nộp báo cáo Lab 02: Server Components", description: "Nộp báo cáo kèm mã nguồn lên LMS, định dạng PDF.", offsetMs: -5 * DAY },
  { id: 2, subject: "co-so-du-lieu", title: "Bài tập chuẩn hoá lược đồ quan hệ", description: "Chuẩn hoá đến dạng chuẩn BCNF cho 3 lược đồ trong đề.", offsetMs: -1 * DAY },
  { id: 3, subject: "mang-may-tinh", title: "Nộp bài thực hành Wireshark", description: "Bắt gói tin HTTP và TCP handshake, nộp tệp .pcapng kèm nhận xét.", offsetMs: 3 * HOUR },
  { id: 4, subject: "cong-nghe-phan-mem", title: "Nộp tài liệu đặc tả yêu cầu (SRS)", description: "Nhóm nộp bản SRS v1.0 gồm use case và yêu cầu phi chức năng.", offsetMs: 2 * DAY },
  { id: 5, subject: "lap-trinh-web-nang-cao", title: "Kiểm tra giữa kỳ: Next.js và React", description: "Kiểm tra trên máy 45 phút về routing, caching và Server Actions.", offsetMs: 4 * DAY },
  { id: 6, subject: "co-so-du-lieu", title: "Thực hành SQL nâng cao", description: "Viết truy vấn JOIN, GROUP BY và truy vấn con trên cơ sở dữ liệu mẫu.", offsetMs: 6 * DAY },
  { id: 7, subject: "mang-may-tinh", title: "Bài tập chia mạng con (subnetting)", description: "Chia mạng con VLSM cho sơ đồ mạng công ty gồm 5 phòng ban.", offsetMs: 9 * DAY },
  { id: 8, subject: "cong-nghe-phan-mem", title: "Báo cáo tiến độ sprint 2", description: "Trình bày backlog, burndown chart và các rủi ro của nhóm.", offsetMs: 13 * DAY },
  { id: 9, subject: "lap-trinh-web-nang-cao", title: "Nộp bài tập lớn: Class Deadline Hub", description: "Nộp mã nguồn, README và đường dẫn bản triển khai.", offsetMs: 18 * DAY },
  { id: 10, subject: "co-so-du-lieu", title: "Đồ án thiết kế cơ sở dữ liệu", description: "Nộp sơ đồ ERD, script tạo bảng và dữ liệu mẫu.", offsetMs: 23 * DAY },
  { id: 11, subject: "mang-may-tinh", title: "Thi thực hành cấu hình định tuyến", description: "Cấu hình RIP và OSPF trên Packet Tracer trong 60 phút.", offsetMs: 27 * DAY },
  { id: 12, subject: "cong-nghe-phan-mem", title: "Nộp báo cáo cuối kỳ và demo", description: "Demo sản phẩm trước hội đồng và nộp báo cáo tổng kết.", offsetMs: 30 * DAY },
]

export const SEED_CREATED_BY = "seed"

/** Seed rows with `dueAt` resolved against `now`. */
export function buildDeadlines(now) {
  return DEADLINES.map(({ offsetMs, ...rest }) => ({
    ...rest,
    createdBy: SEED_CREATED_BY,
    dueAt: new Date(now.getTime() + offsetMs),
  }))
}

export const ACCOUNTS = [
  { email: "admin@ptit.edu.vn", password: "admin123", name: "Lớp trưởng", role: "admin" },
  { email: "sv@ptit.edu.vn", password: "sv123456", name: "Sinh viên", role: "user" },
]
