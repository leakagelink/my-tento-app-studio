import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-action hover:bg-primary/90 active:translate-y-px",
        variant === "secondary" && "border border-border bg-card text-foreground hover:bg-secondary",
        variant === "ghost" && "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}