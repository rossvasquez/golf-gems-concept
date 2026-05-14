import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full border border-emerald-950/15 bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
