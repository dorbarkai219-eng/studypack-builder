import { Skeleton } from "@/components/ui/Skeleton";

export default function VerifyLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="mt-5 h-32 w-full" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </main>
  );
}
