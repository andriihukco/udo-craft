"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { KanbanColumn } from "./_components/KanbanColumn";
import { OrderQuickSheet } from "./_components/OrderQuickSheet";
import { useKanbanDrag, type Lead } from "./_components/useKanbanDrag";
import type { Lead as SharedLead } from "@udo-craft/shared";

// Typed Supabase Realtime payload for leads table
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RealtimeLeadPayload = { eventType: "INSERT" | "UPDATE" | "DELETE"; new: SharedLead; old: Partial<SharedLead> };

const STATUSES = ["draft", "new", "in_progress", "production", "completed", "archived"] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Чернетка", new: "Новий", in_progress: "В роботі",
  production: "Виробництво", completed: "Завершено", archived: "Архів",
};

function OrdersBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleStatusChange = useCallback(async (lead: Lead, newStatus: string) => {
    const updated = { ...lead, status: newStatus as Lead["status"] };
    setLeads((p) => p.map((l) => (l.id === lead.id ? updated : l)));
    setSelectedLead((c) => c?.id === lead.id ? updated : c);
    try {
      const r = await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
    } catch (err) {
      setLeads((p) => p.map((l) => (l.id === lead.id ? lead : l)));
      setSelectedLead((c) => c?.id === lead.id ? lead : c);
      toast.error(`Помилка: ${err instanceof Error ? err.message : "невідома"}`);
    }
  }, []);

  const drag = useKanbanDrag(selectedLead, setSelectedLead, handleStatusChange);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/leads");
      if (!r.ok) throw new Error();
      setLeads((await r.json()) || []);
    } catch { toast.error("Помилка при завантаженні замовлень"); setLeads([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (!leadId || !leads.length) return;
    const found = leads.find((l) => l.id === leadId);
    if (found) setSelectedLead(found);
  }, [leads, searchParams]);
  useEffect(() => {
    if (selectedLead) {
      const fresh = leads.find((l) => l.id === selectedLead.id);
      if (fresh) setSelectedLead(fresh);
    }
  }, [leads]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ch = supabase.channel("admin-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        playNotificationTone(); fetchLeads();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: { new: { sender?: string } }) => {
        if (payload?.new?.sender === "client") {
          playNotificationTone(); toast.info("Нове повідомлення від клієнта");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchLeads, supabase]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 px-4 border-b border-border shrink-0 flex items-center justify-between sticky top-0 z-30 bg-background">
          <p className="font-semibold text-base">
            Замовлення{leads.length > 0 && <span className="text-muted-foreground font-normal text-sm ml-1">({leads.length})</span>}
          </p>
          <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => router.push("/orders/new")}>
            <Plus className="size-3.5" /><span className="hidden md:inline">Нове замовлення</span>
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex gap-3 h-full px-4 py-4" style={{ width: "max-content", minWidth: "100%" }}>
              {STATUSES.map((status) => {
                const colLeads = leads.filter((l) => l.status === status);
                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    label={STATUS_LABELS[status]}
                    orders={colLeads}
                    totalAmount={colLeads.reduce((s, l) => s + l.total_amount_cents, 0)}
                    selectedOrderId={selectedLead?.id ?? null}
                    draggedOrderId={drag.draggedLead?.id ?? null}
                    dragOverCol={drag.dragOverCol}
                    onCardClick={drag.onCardClick}
                    onCardDragStart={drag.onCardDragStart}
                    onCardDragEnd={drag.onCardDragEnd}
                    onCardTouchStart={drag.onCardTouchStart}
                    onCardTouchMove={drag.onCardTouchMove}
                    onCardTouchEnd={drag.onCardTouchEnd}
                    onColDragOver={drag.onColDragOver}
                    onColDragLeave={drag.onColDragLeave}
                    onColDrop={drag.onColDrop}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <OrderQuickSheet
        lead={selectedLead}
        open={selectedLead !== null}
        onClose={() => { drag.closedLeadIdRef.current = selectedLead?.id ?? null; setSelectedLead(null); }}
        onStatusChange={(id, status) => {
          const lead = leads.find((l) => l.id === id);
          if (lead) handleStatusChange(lead, status);
        }}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <OrdersBoard />
    </Suspense>
  );
}
