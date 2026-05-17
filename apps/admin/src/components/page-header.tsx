"use client";

import * as React from "react";
import { DashboardHeader } from "@/components/dashboard-header";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <DashboardHeader
      title={title}
      eyebrow={eyebrow}
      description={description}
      actions={actions}
      className={className}
    />
  );
}
