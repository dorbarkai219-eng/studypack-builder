/**
 * Tiny skeleton primitive. animate-pulse is Tailwind built-in. Use to
 * shape route loading.tsx files so the user sees the layout shell while
 * data resolves, instead of an empty viewport.
 */
export function Skeleton({
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-lines/60 ${className}`}
      {...rest}
    />
  );
}
