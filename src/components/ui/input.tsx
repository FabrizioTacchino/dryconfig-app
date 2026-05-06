
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, step, ...props }, ref) => {
    // Per i campi numerici di tempo di posa, imposta automaticamente step più preciso
    const adjustedStep = type === "number" && !step && 
      (props.id === "installation_time_per_sqm" || 
       props.placeholder?.includes("tempo") || 
       props.placeholder?.includes("minuti")) ? "0.0001" : step;

    return (
      <input
        type={type}
        step={adjustedStep}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
