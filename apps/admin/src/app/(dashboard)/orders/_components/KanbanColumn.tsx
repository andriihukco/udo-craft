"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderCard } from "./OrderCard";
import type { LeadStatus } from "@/components/status-badge";
import type { Lead } from "./useKanbanDrag";

interface KanbanColumnProps {
  status: LeadStatus;
  label: string;
  orders: Lead[];
  totalAmount: number;
  selectedOrderId: string | null;
  draggedOrderId: string | null;
  dragOverCol: string | null;
  onCardClick: (lead: Lead) => void;
  onCardDragStart: (e: React.DragEvent, lead: Lead) => void;
  onCardDragEnd: () => void;
  onCardTouchStart: (e: React.TouchEvent, lead: Lead) => void;
  onCardTouchMove: (e: React.TouchEvent) => void;
  onCardTouchEnd: (e: React.TouchEvent, lead: Lead) => void;
  onColDragOver: (e: React.DragEvent, status: string) => void;
  onColDragLeave: (e: React.DragEvent) => void;
  onColDrop: (e: React.DragEvent, status: string) => void;
}

export function KanbanColumn({
  status,
  label,
  orders,
  totalAmount,
  selectedOrderId,
  draggedOrderId,
  dragOverCol,
  onCardClick,
  onCardDragStart,
  onCardDragEnd,
  onCardTouchStart,
  onCardTouchMove,
  onCardTouchEnd,
  onColDragOver,
  onColDragLeave,
  onColDrop,
}: KanbanColumnProps) {
  const isOver = dragOverCol === status;

  return (
    <div
      data-kanban-col={status}
      onDragOver={(e) => onColDragOver(e, status)}
      onDragLeave={onColDragLeave}
      onDrop={(e) => onColDrop(e, status)}
      className={cn(
        "flex h-full min-w-80 flex-1 flex-col overflow-hidden rounded-md border transition-colors group/col",
        isOver
          ? "border-primary bg-primary/[0.03]"
          : "border-border bg-background hover:border-border"
      )}
    >
      {/* Column header */}
      <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/80">{label}</p>
          <span className="flex h-5 items-center justify-center rounded-full border border-primary/10 bg-primary/10 px-2 text-[10px] font-semibold text-primary">
            {orders.length}
          </span>
        </div>
        
        {totalAmount > 0 && (
          <span className="text-[11px] font-semibold tracking-tight text-muted-foreground/70">
            ₴{(totalAmount / 100).toLocaleString("uk-UA")}
          </span>
        )}
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-hide">
        {orders.map((lead) => (
          <OrderCard
            key={lead.id}
            order={lead}
            isSelected={selectedOrderId === lead.id}
            isDragging={draggedOrderId === lead.id}
            onClick={onCardClick}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
            onTouchStart={onCardTouchStart}
            onTouchMove={onCardTouchMove}
            onTouchEnd={onCardTouchEnd}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in">
            <div className="mb-4 flex size-14 items-center justify-center rounded-md border border-border bg-muted/30">
              <Inbox className="size-7 text-muted-foreground/20" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Порожньо</p>
          </div>
        )}
      </div>
    </div>
  );
}
