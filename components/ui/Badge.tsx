import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "production"
    | "draft"
    | "passed"
    | "failed"
    | "role-system"
    | "role-user"
    | "role-assistant"
    | "indigo"
    | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  ...props
}: BadgeProps) {
  const variantStyles = {
    production:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium",
    draft:
      "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium",
    passed:
      "bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-semibold",
    failed:
      "bg-rose-950 text-rose-400 border border-rose-500/40 font-semibold",
    "role-system":
      "bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold",
    "role-user":
      "bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider font-semibold",
    "role-assistant":
      "bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider font-semibold",
    indigo:
      "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium",
    neutral:
      "bg-slate-800 text-slate-300 border border-slate-700/60 font-medium",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 rounded",
    md: "text-xs px-2.5 py-0.5 rounded-full",
  };

  const dotColors = {
    production: "bg-emerald-400",
    draft: "bg-amber-400",
    passed: "bg-emerald-400",
    failed: "bg-rose-400",
    "role-system": "bg-purple-400",
    "role-user": "bg-blue-400",
    "role-assistant": "bg-teal-400",
    indigo: "bg-indigo-400",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
