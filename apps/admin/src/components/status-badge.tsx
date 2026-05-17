import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus = "draft" | "new" | "in_progress" | "production" | "completed" | "archived";

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: "success" | "warning" | "info" | "destructive" | "outline" | "secondary" | "default" }> = {
  draft:       { label: "Чернетка",     variant: "outline" },
  new:         { label: "Новий",        variant: "info" },
  in_progress: { label: "В роботі",     variant: "warning" },
  production:  { label: "Виробництво",  variant: "default" },
  completed:   { label: "Завершено",    variant: "success" },
  archived:    { label: "Архів",        variant: "secondary" },
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
