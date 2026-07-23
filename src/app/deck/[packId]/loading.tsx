import { Skeleton } from "@/components/ui/Skeleton";

export default function DeckLoading() {
  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="flex flex-none items-center gap-3 border-b border-lines bg-paper px-4 py-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="ms-auto h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="aspect-video h-full max-h-[600px] w-full max-w-[1100px] rounded-2xl" />
      </div>
      <div className="flex flex-none items-center justify-center gap-6 border-t border-lines bg-paper px-4 py-2">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-12" />
      </div>
    </div>
  );
}
