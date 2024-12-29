import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-11 animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] px-8 py-2 font-medium text-primary-foreground transition-all hover:scale-105",
        
        // Ana buton stilleri
        "bg-gradient-to-r from-purple-600/90 via-blue-500/90 to-purple-600/90",
        "hover:from-purple-500 hover:via-blue-400 hover:to-purple-500",
        
        // Disabled durumu için stiller
        "disabled:cursor-default disabled:opacity-90 disabled:hover:scale-100",
        "disabled:from-purple-600/70 disabled:via-blue-500/70 disabled:to-purple-600/70",
        "disabled:hover:from-purple-600/70 disabled:hover:via-blue-500/70 disabled:hover:to-purple-600/70",
        
        // Glow efekti
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-purple-600/20 before:via-transparent before:to-blue-600/20",
        "before:transition-all before:duration-300 before:ease-out before:opacity-0 hover:before:opacity-100",
        
        // Rainbow glow efekti
        //"after:absolute after:bottom-[-10%] after:left-1/2 after:z-0 after:h-1/5 after:w-4/5 after:-translate-x-1/2 after:animate-rainbow after:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] after:[filter:blur(calc(0.8*1rem))]",

        // Dark mode ayarları
        "dark:from-purple-500/90 dark:via-blue-400/90 dark:to-purple-500/90",
        "dark:hover:from-purple-400 dark:hover:via-blue-300 dark:hover:to-purple-400",
        "dark:disabled:from-gray-600 dark:disabled:via-gray-600 dark:disabled:to-gray-600",
        
        className
      )}
      {...props}
    >
      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
      {children}
    </button>
  );
}
