import { Skeleton } from "@/components/ui/Skeleton";

export default function QuizLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Skeleton className="h-2 w-full rounded-none" />
      <div className="flex flex-none items-center gap-3 border-b-2 border-ink bg-paper px-4 py-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="ms-auto h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <Skeleton className="min-h-[260px] w-full rounded-2xl" />
          <div className="mt-4 flex justify-end">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
