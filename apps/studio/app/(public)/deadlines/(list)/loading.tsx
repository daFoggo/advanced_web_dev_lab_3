import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Lives in the `(list)` group on purpose: a `loading.tsx` at `deadlines/` would also wrap
 * `[id]`, start the stream early and turn the 404 of an unknown id into a 200.
 */
export default function DeadlinesLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-9" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
