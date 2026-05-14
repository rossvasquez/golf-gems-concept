import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y border border-emerald-950/15 bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
