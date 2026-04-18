"use client";

import { Inbox } from "lucide-react";
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
      className={`flex flex-col rounded-lg p-3 border transition-colors flex-1 min-w-64 overflow-y-auto ${
        isOver
          ? "bg-primary/5 border-primary"
          : status === "archived"
          ? "bg-red-50/60 border-red-200"
          : status === "completed"
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-muted/40 border-border"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <p className="text-sm font-semibold">{label}</p>
        <div className="flex items-center gap-1.5">
          {totalAmount > 0 && (
            <span className="text-xs text-muted-foreground">
              {(totalAmount / 100).toLocaleString("uk-UA")} ₴
            </span>
          )}
          <span className="text-xs text-muted-foreground bg-background border border-border rounded-full px-2 py-0.5">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2">
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
          <EmptyState icon={Inbox} title="Порожньо" className="py-8 opacity-50" />
        )}
      </div>
    </div>
  );
}
