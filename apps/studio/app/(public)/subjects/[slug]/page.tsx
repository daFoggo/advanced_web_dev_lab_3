import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { IconBook, IconUser } from "@tabler/icons-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

import { DEADLINES_PATH, HOME_PATH } from "@/config/routes"
import { DeadlineList } from "@/features/deadlines/components/deadline-list"
import { getSubjectPage, getSubjects } from "@/features/deadlines/queries"

export const instant = false

export async function generateStaticParams() {
  const subjects = await getSubjects()
  return subjects.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { subject } = await getSubjectPage(slug)
  if (!subject) return { title: "Không tìm thấy môn học" }

  return {
    title: `${subject.name} (${subject.code})`,
    description: `Danh sách deadline và thông tin học phần môn ${subject.name} - Giảng viên: ${subject.lecturer}`,
  }
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { subject, deadlines } = await getSubjectPage(slug)

  if (!subject) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={HOME_PATH} />}>
              Trang chủ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={DEADLINES_PATH} />}>
              Deadline
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subject.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Subject Header */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            <IconBook className="size-3" />
            <span>{subject.code}</span>
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {deadlines.length} deadline
          </span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          {subject.name}
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconUser className="size-4" />
          <span>Giảng viên phụ trách: {subject.lecturer}</span>
        </div>
      </div>

      {/* Deadlines Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium tracking-tight">
          Các hạn nộp của môn
        </h2>
        <DeadlineList
          deadlines={deadlines}
          emptyMessage={`Hiện chưa có deadline nào được giao cho môn ${subject.name}.`}
        />
      </div>
    </div>
  )
}
