"use client";

import { GripVertical } from "lucide-react";
import { PREDEFINED_TAGS } from "@udo-craft/shared";
import type { LeadStatus } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  size: string;
  color: string;
  unit_price_cents?: number;
  technical_metadata?: { unit_price_cents?: number; item_note?: string };
}

interface Lead {
  id: string;
  status: LeadStatus;
  customer_data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  total_amount_cents: number;
  order_items?: OrderItem[];
}

interface OrderCardProps {
  order: Lead;
  isSelected: boolean;
  isDragging: boolean;
  onClick: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent, lead: Lead) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent, lead: Lead) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
  });
}

export function OrderCard({
  order,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: OrderCardProps) {
  const subtitle = order.customer_data?.company || order.customer_data?.email;
  const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(order)}
      onTouchStart={(e) => onTouchStart(e, order)}
      onTouchMove={onTouchMove}
      onTouchEnd={(e) => onTouchEnd(e, order)}
      onKeyDown={(e) => e.key === "Enter" && onClick(order)}
      tabIndex={0}
      role="button"
      aria-label={`Замовлення від ${order.customer_data?.name}`}
      aria-pressed={isSelected}
      className={cn(
        "group relative bg-card rounded-xl border p-4 cursor-pointer select-none transition-all duration-300 animate-in",
        "hover:shadow-premium hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary outline-none touch-none",
        isDragging ? "opacity-40 scale-[0.98] rotate-1" : "shadow-sm",
        isSelected ? "ring-2 ring-primary border-transparent bg-primary/[0.03] shadow-depth" : "border-border"
      )}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
      </div>

      {/* Client name + subtitle */}
      <div className="flex flex-col gap-0.5 mb-3">
        <p className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
          {order.customer_data?.name}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate max-w-[90%] font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Tags */}
      {(order.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(order.tags ?? []).map((tagId) => {
            const tag = PREDEFINED_TAGS.find((t) => t.id === tagId);
            return tag ? (
              <Badge
                key={tagId}
                variant="outline"
                className="gap-1.5 px-2 py-0 h-6 border-primary/10 bg-primary/5 text-foreground hover:bg-primary/10 transition-colors"
                style={{
                  color: tag.color,
                  backgroundColor: `${tag.bg}30`,
                  borderColor: `${tag.color}20`,
                }}
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.label}
              </Badge>
            ) : (
              <Badge
                key={tagId}
                variant="secondary"
                className="h-6 px-2 text-[9px] font-bold"
              >
                {tagId}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Amount + item count + Date */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
        <div className="flex items-center gap-3">
          {itemCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold bg-muted/50 px-2 py-0.5 rounded-full">
              <span className="text-foreground">{itemCount}</span> шт.
            </div>
          )}
          <span className="text-[10px] text-muted-foreground/70 font-medium">
            {formatDate(order.created_at)}
          </span>
        </div>
        
        {order.total_amount_cents > 0 && (
          <span className="text-sm font-bold tracking-tight text-primary">
            {(order.total_amount_cents / 100).toLocaleString("uk-UA")} ₴
          </span>
        )}
      </div>
    </div>
  );
}

