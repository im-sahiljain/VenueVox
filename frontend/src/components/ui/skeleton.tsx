import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/70 animate-shimmer dark:bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
