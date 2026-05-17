import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus = "draft" | "new" | "in_progress" | "production" | "completed" | "archived";

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: "success" | "warning" | "info" | "destructive" | "outline" | "secondary" | "default"; className: string }> = {
  draft:       { label: "Чернетка",     variant: "outline",   className: "bg-muted-foreground" },
  new:         { label: "Новий",        variant: "info",      className: "bg-blue-500" },
  in_progress: { label: "В роботі",     variant: "warning",   className: "bg-amber-500" },
  production:  { label: "Виробництво",  variant: "default",   className: "bg-primary" },
  completed:   { label: "Завершено",    variant: "success",   className: "bg-emerald-500" },
  archived:    { label: "Архів",        variant: "secondary", className: "bg-slate-400" },
};

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as LeadStatus] ?? {
    label: status,
    variant: "outline",
  };
  return (
    <Badge
      variant={config.variant}
      className={cn("font-bold", className)}
      aria-label={`Статус: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };
