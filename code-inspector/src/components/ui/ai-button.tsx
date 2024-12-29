import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function AIButton({
  children,
  className,
  ...props
}: AIButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-11 items-center justify-center rounded-xl px-8 py-2 font-medium",
        "bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 text-white",
        "hover:from-purple-500 hover:via-blue-400 hover:to-purple-500",
        "transition-all duration-300 ease-out hover:shadow-lg hover:shadow-purple-500/25",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-purple-600/20 before:via-transparent before:to-blue-600/20",
        "before:transition-all before:duration-300 before:ease-out before:opacity-0 hover:before:opacity-100",
        className
      )}
      {...props}
    >
      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
      {children}
    </button>
  )
} 