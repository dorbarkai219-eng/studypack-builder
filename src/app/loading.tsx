import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="mt-8 h-4 w-40" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </main>
  );
}
