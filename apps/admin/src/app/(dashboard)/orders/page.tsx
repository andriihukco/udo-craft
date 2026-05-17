"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";
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
  const [totalCount, setTotalCount] = useState(0);
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

  const fetchLeads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const r = await fetch("/api/leads");
      if (!r.ok) throw new Error();
      const res = await r.json();
      setLeads(Array.isArray(res) ? res : res.leads || []);
      setTotalCount(Array.isArray(res) ? res.length : res.totalCount || 0);
    } catch { toast.error("Помилка при завантаженні замовлень"); setLeads([]); setTotalCount(0); }
    finally { if (showLoading) setLoading(false); }
  }, []);

  const debouncedRealtimeFetch = useDebouncedCallback(() => {
    playNotificationTone();
    fetchLeads(false);
  }, 3000);

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
        debouncedRealtimeFetch();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: { new: { sender?: string } }) => {
        if (payload?.new?.sender === "client") {
          playNotificationTone(); toast.info("Нове повідомлення від клієнта");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [debouncedRealtimeFetch, supabase]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden selection:bg-primary/10 selection:text-primary">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Замовлення"
          subtitle={
            totalCount > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/10">
                {totalCount} всього
              </span>
            )
          }
          actions={
            <Button
              size="lg"
              className="h-10 gap-2 px-4 text-xs font-semibold uppercase tracking-widest"
              onClick={() => router.push("/orders/new")}
            >
              <Plus className="size-4" />
              <span>Нове замовлення</span>
            </Button>
          }
        />

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-10 animate-spin text-primary/40" />
            </div>
          ) : (
            <div className="flex h-full gap-4 px-6 py-6 animate-in" style={{ width: "max-content", minWidth: "100%" }}>
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
