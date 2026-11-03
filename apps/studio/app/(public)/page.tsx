import Link from "next/link"
import { IconArrowRight, IconBook, IconCalendar, IconUser } from "@tabler/icons-react"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button-variants"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { DEADLINES_PATH } from "@/config/routes"
import { DeadlineCard } from "@/features/deadlines/components/deadline-card"
import { getDeadlineList, getSubjects } from "@/features/deadlines/queries"

import { HomeHeroCta } from "./_components/home-hero-cta"

export const metadata = {
  title: "Trang chủ",
  description:
    "Cổng thông tin theo dõi và quản lý deadline các môn học dành cho lớp.",
}

export default async function HomePage() {
  const [subjects, deadlineData] = await Promise.all([
    getSubjects(),
    getDeadlineList(),
  ])

  // Get closest 3 upcoming deadlines relative to the generated snapshot
  const generatedTime = new Date(deadlineData.generatedAt).getTime()
  const upcomingDeadlines = deadlineData.items
    .filter((d) => new Date(d.dueAt).getTime() >= generatedTime)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-14 max-sm:gap-10">
      {/* Hero section */}
      <section className="flex flex-col items-start gap-5">
        <Badge variant="outline" className="gap-1 font-mono text-xs">
          <IconCalendar className="size-3" />
          <span>Học kỳ 1 · 2026–2027</span>
        </Badge>
        <h1 className="text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          Class Deadline Hub
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Cổng thông tin deadline chính thức của lớp. Theo dõi lịch nộp bài tập,
          đồ án, bài tập lớn và quản lý tiến độ học tập một cách dễ dàng.
        </p>
        <HomeHeroCta />
      </section>

      {/* Subjects section */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-medium tracking-tight">Các môn học</h2>
            <p className="text-sm text-muted-foreground">
              Các học phần trong chương trình kỳ này
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((sub) => (
            <Card
              key={sub.id}
              className="flex flex-col justify-between transition-colors hover:border-foreground/20"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {sub.code}
                  </Badge>
                  <IconBook className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="mt-2 text-base font-medium">
                  <Link
                    href={`/subjects/${sub.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {sub.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconUser className="size-3.5" />
                  <span>{sub.lecturer}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <Link
                  href={`/subjects/${sub.slug}`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "w-full justify-between text-xs",
                  })}
                >
                  <span>Xem deadline môn này</span>
                  <IconArrowRight className="size-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming deadlines section */}
      {upcomingDeadlines.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-medium tracking-tight">
                Deadline sắp tới
              </h2>
              <p className="text-sm text-muted-foreground">
                Các mốc nộp bài cần ưu tiên hoàn thành
              </p>
            </div>
            <Link
              href={DEADLINES_PATH}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1 text-xs",
              })}
            >
              <span>Xem tất cả</span>
              <IconArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {upcomingDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
