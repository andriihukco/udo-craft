import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus = "draft" | "new" | "in_progress" | "production" | "completed" | "archived";

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  draft:       { label: "Чернетка",     className: "bg-muted text-muted-foreground" },
  new:         { label: "Новий",        className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  in_progress: { label: "В роботі",     className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  production:  { label: "Виробництво",  className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  completed:   { label: "Завершено",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  archived:    { label: "Архів",        className: "bg-muted text-muted-foreground" },
};

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as LeadStatus] ?? {
    label: status,
    className: "bg-neutral-100 text-muted-foreground",
  };
  return (
    <Badge
      className={cn("border-0 font-medium", config.className, className)}
      aria-label={`Статус: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };
