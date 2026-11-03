import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { IconArrowLeft } from "@tabler/icons-react"

import { can, roleOf } from "@workspace/auth/permissions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { PageHead } from "@/components/layout/page-head"
import { DASHBOARD_PATH, FORBIDDEN_PATH } from "@/config/routes"
import { Countdown } from "@/features/deadlines/components/countdown"
import { CreateDeadlineForm } from "@/features/deadlines/components/create-deadline-form"
import { DeleteDeadlineButton } from "@/features/deadlines/components/delete-deadline-button"
import { fetchDeadlines, fetchSubjects } from "@/features/deadlines/server"
import { verifySession } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
}

async function AdminContent() {
  const session = await verifySession()

  // Real authorization check
  if (!can(roleOf(session), "deadline:create")) {
    redirect(FORBIDDEN_PATH)
  }

  const [subjects, deadlines] = await Promise.all([
    fetchSubjects(),
    fetchDeadlines(),
  ])

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      {/* Create Form */}
      <div className="lg:col-span-5">
        <CreateDeadlineForm subjects={subjects} />
      </div>

      {/* Deadlines Table */}
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách deadline hiện tại</CardTitle>
                <CardDescription>
                  Tổng số: {deadlines.length} deadline trong hệ thống
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Hạn nộp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Chưa có deadline nào trong hệ thống.
                    </TableCell>
                  </TableRow>
                ) : (
                  deadlines.map((item) => {
                    const dueDate = new Date(item.dueAt)
                    const formattedDate = dueDate.toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="outline">
                            {item.subject?.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-medium">
                          <Link
                            href={`/deadlines/${item.id}`}
                            className="transition-colors hover:text-primary"
                          >
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formattedDate}
                        </TableCell>
                        <TableCell>
                          <Countdown dueAt={item.dueAt} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteDeadlineButton
                            deadlineId={item.id}
                            title={item.title}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="lg:col-span-7">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHead label="Admin" title="Quản trị deadline của lớp">
          Khu vực dành riêng cho Lớp trưởng (admin) thêm mới và xoá các deadline của lớp.
        </PageHead>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={DASHBOARD_PATH} />}
          nativeButton={false}
          className="gap-1.5"
        >
          <IconArrowLeft className="size-4" />
          <span>Về Dashboard</span>
        </Button>
      </div>

      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  )
}
