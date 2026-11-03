import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconClock,
  IconUser,
} from "@tabler/icons-react"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button-variants"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

import { DEADLINES_PATH, HOME_PATH } from "@/config/routes"
import { BreadcrumbJsonLd } from "@/features/deadlines/components/breadcrumb-jsonld"
import { Countdown } from "@/features/deadlines/components/countdown"
import { getDeadline, getDeadlineIds } from "@/features/deadlines/queries"
import { DeadlineIdSchema } from "@/features/deadlines/schemas"

export const instant = false

export async function generateStaticParams() {
  const ids = await getDeadlineIds()
  return ids.map(({ id }) => ({ id: String(id) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: rawId } = await params
  const idResult = DeadlineIdSchema.safeParse(rawId)
  if (!idResult.success) return { title: "Không tìm thấy deadline" }

  const deadline = await getDeadline(idResult.data)
  if (!deadline) return { title: "Không tìm thấy deadline" }

  const title = `${deadline.title} – ${deadline.subject?.name ?? "Deadline"}`
  const description =
    deadline.description ??
    `Hạn nộp bài tập môn ${deadline.subject?.name ?? ""}`
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  const url = `${appUrl}/deadlines/${deadline.id}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const idResult = DeadlineIdSchema.safeParse(rawId)

  if (!idResult.success) {
    notFound()
  }

  const deadline = await getDeadline(idResult.data)
  if (!deadline) {
    notFound()
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  const dueDate = new Date(deadline.dueAt)
  const formattedDueDate = dueDate.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const formattedCreatedAt = new Date(deadline.createdAt).toLocaleString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  )

  return (
    <div className="flex flex-col gap-8">
      <BreadcrumbJsonLd deadline={deadline} baseUrl={appUrl} />

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
            <BreadcrumbPage>{deadline.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Detail Card */}
      <Card className="flex flex-col">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {deadline.subject && (
              <Badge variant="outline" className="gap-1 font-mono text-xs">
                <IconBook className="size-3" />
                <span>
                  {deadline.subject.code} · {deadline.subject.name}
                </span>
              </Badge>
            )}
            <Countdown dueAt={deadline.dueAt} />
          </div>
          <CardTitle className="text-2xl leading-tight font-medium md:text-3xl">
            {deadline.title}
          </CardTitle>
          {deadline.subject && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconUser className="size-4" />
              <span>Giảng viên: {deadline.subject.lecturer}</span>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col gap-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <IconCalendar className="size-5 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-muted-foreground">
                  HẠN NỘP BÀI
                </span>
                <span className="text-base font-medium">
                  {formattedDueDate}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <IconClock className="size-5 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-muted-foreground">
                  NGÀY GIAO HẠN
                </span>
                <span className="text-base font-medium">
                  {formattedCreatedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Mô tả và yêu cầu chi tiết</h2>
            {deadline.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {deadline.description}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Không có mô tả chi tiết thêm cho deadline này.
              </p>
            )}
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex items-center justify-between gap-4 py-4">
          <Link
            href={DEADLINES_PATH}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5",
            })}
          >
            <IconArrowLeft className="size-4" />
            <span>Quay lại danh sách</span>
          </Link>

          {deadline.subject && (
            <Link
              href={`/subjects/${deadline.subject.slug}`}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "text-xs",
              })}
            >
              Xem môn {deadline.subject.name}
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
