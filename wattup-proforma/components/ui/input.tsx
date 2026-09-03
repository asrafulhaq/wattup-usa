import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-dark/50 selection:bg-primary selection:text-primary-foreground bg-gray/30 border-transparent h-[56px] w-full min-w-0 rounded-[8px] border px-5 py-1 text-[16px] leading-[130%] tracking-[-3%] font-medium transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-dark",
        className
      )}
      {...props}
    />
  )
}

export { Input }
