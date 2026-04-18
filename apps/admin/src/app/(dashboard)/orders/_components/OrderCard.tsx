"use client";

import { GripVertical } from "lucide-react";
import { PREDEFINED_TAGS } from "@udo-craft/shared";
import type { LeadStatus } from "@/components/status-badge";

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
      className={`bg-card rounded-lg border p-3 cursor-pointer select-none transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary outline-none touch-none ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${isSelected ? "ring-2 ring-primary border-primary" : "border-border"}`}
    >
      {/* Client name + subtitle */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{order.customer_data?.name}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Amount + item count */}
      <div className="flex items-center gap-2">
        {itemCount > 0 && (
          <span className="text-xs text-muted-foreground">{itemCount} шт.</span>
        )}
        {order.total_amount_cents > 0 && (
          <span className="text-xs font-medium ml-auto">
            {(order.total_amount_cents / 100).toLocaleString("uk-UA")} ₴
          </span>
        )}
      </div>

      {/* Tags */}
      {(order.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {(order.tags ?? []).map((tagId) => {
            const tag = PREDEFINED_TAGS.find((t) => t.id === tagId);
            return tag ? (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                style={{
                  color: tag.color,
                  backgroundColor: tag.bg,
                  borderColor: `${tag.color}30`,
                }}
              >
                <span
                  className="size-1 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.label}
              </span>
            ) : (
              <span
                key={tagId}
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/50 text-foreground"
              >
                {tagId}
              </span>
            );
          })}
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {formatDate(order.created_at)}
      </p>
    </div>
  );
}
