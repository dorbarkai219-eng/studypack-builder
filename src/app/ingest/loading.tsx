import { Skeleton } from "@/components/ui/Skeleton";

export default function IngestLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-7 w-72" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <div className="mt-6 space-y-4 rounded-lg border border-lines bg-paper p-5">
        <Skeleton className="h-9 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-32" />
      </div>
    </main>
  );
}
