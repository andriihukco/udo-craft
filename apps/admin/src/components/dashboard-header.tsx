"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
  className,
  sticky = true,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-md z-30",
        sticky && "sticky top-0",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-gradient">{title}</h1>
        {subtitle && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
