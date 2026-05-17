import React from "react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between space-y-2 pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-muted rounded-lg" />
          <div className="h-10 w-32 bg-primary/20 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded-md" />
              <div className="h-8 w-8 bg-muted/50 rounded-full" />
            </div>
            <div className="h-7 w-32 bg-muted rounded-lg" />
            <div className="h-3 w-40 bg-muted/60 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm h-[400px]">
          <div className="h-6 w-36 bg-muted rounded-lg mb-6" />
          <div className="space-y-3 pt-4">
            <div className="h-12 w-full bg-muted/40 rounded-xl" />
            <div className="h-12 w-full bg-muted/40 rounded-xl" />
            <div className="h-12 w-full bg-muted/40 rounded-xl" />
            <div className="h-12 w-full bg-muted/40 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-3 p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm h-[400px]">
          <div className="h-6 w-36 bg-muted rounded-lg mb-6" />
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-28 bg-muted rounded-md" />
                <div className="h-3 w-44 bg-muted/60 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-3 w-40 bg-muted/60 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted rounded-md" />
                <div className="h-3 w-48 bg-muted/60 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
