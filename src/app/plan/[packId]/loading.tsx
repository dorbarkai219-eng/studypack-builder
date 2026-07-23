import { Skeleton } from "@/components/ui/Skeleton";

export default function PlanLoading() {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="sticky top-0 z-10 border-b border-lines bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="ms-auto h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="mx-auto mt-2 max-w-5xl">
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </main>
    </div>
  );
}
