import { Skeleton } from "@/components/ui/Skeleton";

export default function FlashcardsLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="flex flex-none items-center gap-3 border-b border-lines bg-paper px-4 py-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="ms-auto h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-4">
        <Skeleton className="min-h-[280px] w-full max-w-xl rounded-2xl" />
        <div className="flex w-full max-w-xl gap-2">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
