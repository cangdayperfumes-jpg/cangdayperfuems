import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // Warm ink tint (not cool gray) so placeholders sit naturally on the ivory storefront.
    <div
      className={cn("animate-pulse rounded-md bg-ink/[0.07]", className)}
      {...props}
    />
  )
}

export { Skeleton }
