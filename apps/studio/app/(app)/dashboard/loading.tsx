import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
