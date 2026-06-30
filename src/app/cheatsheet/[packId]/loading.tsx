import { Skeleton } from "@/components/ui/Skeleton";

export default function CheatSheetLoading() {
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-lines bg-paper/95 px-4 py-3 backdrop-blur">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="ms-auto h-7 w-28" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="cs-page mt-4">
        <div className="cheatsheet density-2page">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-40 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
