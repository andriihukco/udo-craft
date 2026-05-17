"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "./OrderCard";
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
        "flex flex-col rounded-3xl border transition-all duration-300 flex-1 min-w-80 overflow-hidden h-full group/col",
        isOver
          ? "bg-primary/[0.04] border-primary shadow-[inset_0_2px_10px_rgba(var(--color-primary),0.05)]"
          : "bg-muted/10 border-border/30 hover:border-border/60"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0 glass-morphic border-b border-border/40 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <p className="text-xs font-black uppercase tracking-widest text-foreground/80">{label}</p>
          <span className="flex items-center justify-center text-[10px] font-black text-primary bg-primary/10 rounded-full px-2 h-5 border border-primary/5">
            {orders.length}
          </span>
        </div>
        
        {totalAmount > 0 && (
          <span className="text-[11px] font-black text-muted-foreground/60 tracking-tight">
            ₴{(totalAmount / 100).toLocaleString("uk-UA")}
          </span>
        )}
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-hide">
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
            <div className="size-16 rounded-3xl bg-muted/10 border border-border/20 flex items-center justify-center mb-4 shadow-sm group-hover/col:scale-110 transition-transform">
              <Inbox className="size-7 text-muted-foreground/20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Порожньо</p>
          </div>
        )}
      </div>
    </div>
  );
}

