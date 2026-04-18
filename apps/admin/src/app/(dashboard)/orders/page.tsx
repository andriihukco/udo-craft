"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, STATUS_CONFIG } from "@/components/status-badge";
import { PrintTypeBadge } from "@/components/layers-panel";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical, Inbox, X,
  MessageCircle, Loader2, Phone, Mail, Building2, Calendar, Package, ChevronsUpDown, Download, Plus, Trash2, Pencil, Check,
} from "lucide-react";
import { toast } from "sonner";

// Inline front/back mockup viewer for orders page — uses actual image keys
function MockupViewerOrders({ mockupsMap, frontUrl, backUrl, frontKey = "front", backKey = "back" }: {
  mockupsMap?: Record<string, string>; frontUrl?: string; backUrl?: string; frontKey?: string; backKey?: string;
}) {
  const images = mockupsMap ?? {
    ...(frontUrl ? { [frontKey]: frontUrl } : {}),
    ...(backUrl  ? { [backKey]:  backUrl  } : {}),
  };
  const keys = Object.keys(images).filter((k) => images[k]);
  const [activeKey, setActiveKey] = useState(keys[0] ?? "front");
  const keyLabelFull = (k: string) => ({ front: "Перед", back: "Зад", left: "Ліво", right: "Право" }[k] ?? k);

  if (keys.length === 0) return null;

  if (keys.length > 1) {
    return (
      <div className="w-full">
        <div className="flex gap-2 w-full max-h-56">
          {keys.map((key) => (
            <div key={key} className="flex-1 relative min-w-0">
              <img src={images[key]} alt={key} className="w-full max-h-56 object-contain rounded-lg" />
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">{keyLabelFull(key)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <img src={images[keys[0]]} alt={keys[0]} className="w-full max-h-56 object-contain rounded-lg" />;
}

interface Product { id: string; name: string; images: Record<string, string>; base_price_cents: number; available_sizes: string[]; }

interface OrderItem {
  id: string; product_id: string; quantity: number;
  size: string; color: string;
  custom_print_url?: string; mockup_url?: string;
  technical_metadata?: {
    offset_top_mm?: number;
    print_size_mm?: [number, number];
    product_image_url?: string;
    item_note?: string;
    unit_price_cents?: number;
    print_cost_cents?: number;
    layers?: { url: string; type: string; side: string; sizeLabel?: string; sizeMinCm?: number; sizeMaxCm?: number; priceCents?: number; kind?: "image" | "text"; textContent?: string; textFont?: string; textColor?: string; textFontSize?: number }[];
  };
  unit_price_cents?: number;
}

interface Lead {
  id: string;
  customer_data: {
    name: string; email?: string; phone?: string; company?: string; edrpou?: string;
    social_channel?: string; delivery?: string; delivery_details?: string;
    deadline?: string; comment?: string; attachments?: string[];
  };
  status: "draft" | "new" | "in_progress" | "production" | "completed" | "archived";
  tags?: string[];
  created_at: string;
  updated_at: string;
  notes?: string;
  total_amount_cents: number;
  order_items?: OrderItem[];
}

const STATUSES = ["draft", "new", "in_progress", "production", "completed", "archived"] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Чернетка", new: "Новий", in_progress: "В роботі", production: "Виробництво", completed: "Завершено", archived: "Архів",
};

const PREDEFINED_TAGS: { id: string; label: string; color: string; bg: string }[] = [
  { id: "paid_100",   label: "Оплачено 100%", color: "#16a34a", bg: "#dcfce7" },
  { id: "paid_50",    label: "Оплачено 50%",  color: "#d97706", bg: "#fef3c7" },
  { id: "urgent",     label: "Терміново",     color: "#dc2626", bg: "#fee2e2" },
  { id: "vip",        label: "VIP",           color: "#7c3aed", bg: "#ede9fe" },
  { id: "new_client", label: "Новий клієнт",  color: "#0284c7", bg: "#e0f2fe" },
];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const didDragRef = useRef(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [deletingLead, setDeletingLead] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [drawerCustomTagInput, setDrawerCustomTagInput] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [editContactData, setEditContactData] = useState<Lead["customer_data"] | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  // Track intentionally closed leads so drag doesn't reopen them
  const closedLeadIdRef = useRef<string | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts" | "items">("contacts");
  // Touch drag state
  const touchDragLeadRef = useRef<Lead | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/leads");
      if (!r.ok) throw new Error();
      setLeads(await r.json() || []);
    } catch { toast.error("Помилка при завантаженні замовлень"); setLeads([]); }
    finally { setLoading(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch("/api/products");
      if (!r.ok) return;
      const data: Product[] = await r.json();
      const map: Record<string, Product> = {};
      data.forEach((p) => { map[p.id] = p; });
      setProducts(map);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchLeads(); fetchProducts(); }, [fetchLeads, fetchProducts]);

  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (!leadId || !leads.length) return;
    const found = leads.find((l) => l.id === leadId);
    if (found) setSelectedLead(found);
  }, [leads, searchParams]);

  useEffect(() => {
    const ch = supabase.channel("admin-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        playNotificationTone(); fetchLeads();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        if (payload?.new?.sender === "client") {
          playNotificationTone(); toast.info("Нове повідомлення від клієнта");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchLeads, supabase]);

  useEffect(() => {
    if (selectedLead) {
      const fresh = leads.find((l) => l.id === selectedLead.id);
      if (fresh) setSelectedLead(fresh);
    }
    // Don't reopen a lead that was intentionally closed
  }, [leads]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setNoteValue(selectedLead?.notes ?? "");
    setEditingContact(false);
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (lead: Lead, newStatus: string) => {
    const updated = { ...lead, status: newStatus as Lead["status"] };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    if (selectedLead?.id === lead.id) setSelectedLead(updated);
    try {
      const r = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
    } catch (err) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
      if (selectedLead?.id === lead.id) setSelectedLead(lead);
      toast.error(`Помилка: ${err instanceof Error ? err.message : "невідома"}`);
    }
  };

  const onCardDragStart = (e: React.DragEvent, lead: Lead) => {
    didDragRef.current = true; // mark as dragging immediately
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };
  const onCardDragEnd = () => {
    setDraggedLead(null); setDragOverCol(null);
    // Use 100ms delay so onClick fires while didDragRef is still true, then reset
    setTimeout(() => { didDragRef.current = false; }, 100);
  };
  const onColDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(status);
  };
  const onColDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
  };
  const onColDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault(); setDragOverCol(null);
    if (draggedLead && draggedLead.status !== status) handleStatusChange(draggedLead, status);
    setDraggedLead(null);
  };
  const onCardClick = (lead: Lead) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    if (selectedLead?.id === lead.id) {
      // User is closing the panel — remember this lead was closed
      closedLeadIdRef.current = lead.id;
      setSelectedLead(null);
    } else {
      closedLeadIdRef.current = null;
      setSelectedLead(lead);
    }
  };

  const getLeadsByStatus = (status: string) => leads.filter((l) => l.status === status);

  // ── Touch drag for mobile kanban ─────────────────────────────────────────
  const onCardTouchStart = (e: React.TouchEvent, lead: Lead) => {
    touchDragLeadRef.current = lead;
    didDragRef.current = false;
    const touch = e.touches[0];
    // Create ghost element
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.85;background:white;border:2px solid var(--color-primary);border-radius:8px;padding:10px 14px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);transform:translate(-50%,-50%);left:${touch.clientX}px;top:${touch.clientY}px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    ghost.textContent = lead.customer_data?.name ?? "Замовлення";
    document.body.appendChild(ghost);
    touchGhostRef.current = ghost;
  };
  const onCardTouchMove = (e: React.TouchEvent) => {
    if (!touchDragLeadRef.current) return;
    didDragRef.current = true;
    e.preventDefault();
    const touch = e.touches[0];
    if (touchGhostRef.current) {
      touchGhostRef.current.style.left = `${touch.clientX}px`;
      touchGhostRef.current.style.top = `${touch.clientY}px`;
    }
    // Find column under finger
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = el?.closest("[data-kanban-col]");
    const colStatus = col?.getAttribute("data-kanban-col") ?? null;
    setDragOverCol(colStatus);
  };
  const onCardTouchEnd = (e: React.TouchEvent, lead: Lead) => {
    if (touchGhostRef.current) { document.body.removeChild(touchGhostRef.current); touchGhostRef.current = null; }
    const wasDrag = didDragRef.current;
    didDragRef.current = false;
    if (!wasDrag) {
      if (selectedLead?.id === lead.id) {
        closedLeadIdRef.current = lead.id;
        setSelectedLead(null);
      } else {
        closedLeadIdRef.current = null;
        setSelectedLead(lead);
      }
    }
    else if (dragOverCol && dragOverCol !== lead.status) {
      handleStatusChange(lead, dragOverCol);
    }
    touchDragLeadRef.current = null;
    setDragOverCol(null);
  };

  const onDrawerDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDrawer(true);
    const startX = e.clientX;
    const startWidth = drawerWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setDrawerWidth(Math.min(640, Math.max(280, startWidth + delta)));
    };
    const onUp = () => {
      setIsDraggingDrawer(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleSaveNote = async () => {    if (!selectedLead) return;
    setSavingNote(true);
    try {
      const r = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteValue }),
      });
      if (!r.ok) throw new Error();
      const updated = { ...selectedLead, notes: noteValue };
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? updated : l));
      setSelectedLead(updated);
    } catch { toast.error("Помилка збереження нотатки"); }
    finally { setSavingNote(false); }
  };

  const handleToggleTag = async (tagId: string) => {
    if (!selectedLead || savingTags) return;
    const current = selectedLead.tags ?? [];
    const next = current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId];
    const optimistic = { ...selectedLead, tags: next };
    setSelectedLead(optimistic);
    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? optimistic : l));
    setSavingTags(true);
    try {
      const r = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      if (!r.ok) throw new Error();
    } catch {
      // Revert on error
      setSelectedLead(selectedLead);
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? selectedLead : l));
      toast.error("Помилка збереження тегу");
    } finally { setSavingTags(false); }
  };

  const handleAddCustomTag = async (value: string) => {
    if (!selectedLead || !value.trim() || savingTags) return;
    const current = selectedLead.tags ?? [];
    if (current.includes(value.trim())) return;
    await handleToggleTag(value.trim());
    setDrawerCustomTagInput("");
  };

  const handleSaveContact = async () => {
    if (!selectedLead || !editContactData) return;
    setSavingContact(true);
    try {
      const r = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_data: editContactData }),
      });
      if (!r.ok) throw new Error();
      const updated = { ...selectedLead, customer_data: editContactData };
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? updated : l));
      setEditingContact(false);
      toast.success("Контактні дані збережено");
    } catch { toast.error("Помилка збереження"); }
    finally { setSavingContact(false); }
  };
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Kanban area ── */}
      <div className="flex-1 flex flex-col overflow-hidden lg:transition-[margin-right] lg:duration-200 [margin-right:0] lg:[margin-right:var(--detail-width,0px)]"
        style={{ "--detail-width": selectedLead ? drawerWidth + "px" : "0px" } as React.CSSProperties}>

        {/* Header */}
        <div className="h-12 px-4 border-b border-border shrink-0 flex items-center justify-between sticky top-0 z-30 bg-background">
          <p className="font-semibold text-base">Замовлення {leads.length > 0 && <span className="text-muted-foreground font-normal text-sm">({leads.length})</span>}</p>
          <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => router.push("/orders/new")}>
            <Plus className="size-3.5" /> <span className="hidden md:inline">Нове замовлення</span>
          </Button>
        </div>

        {/* Board — horizontally scrollable, columns fill full height */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex gap-3 h-full px-4 py-4" style={{ width: "max-content", minWidth: "100%" }}>
              {STATUSES.map((status) => {
                const colLeads = getLeadsByStatus(status);
                const isOver = dragOverCol === status;
                return (
                  <div
                    key={status}
                    data-kanban-col={status}
                    onDragOver={(e) => onColDragOver(e, status)}
                    onDragLeave={onColDragLeave}
                    onDrop={(e) => onColDrop(e, status)}
                    className={`flex flex-col rounded-lg p-3 border transition-colors flex-1 min-w-64 overflow-y-auto ${
                      isOver ? "bg-primary/5 border-primary" : 
                      status === "archived" ? "bg-red-50/60 border-red-200" :
                      status === "completed" ? "bg-emerald-50/60 border-emerald-200" :
                      "bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <p className="text-sm font-semibold">{STATUS_LABELS[status]}</p>
                      <span className="text-xs text-muted-foreground bg-background border border-border rounded-full px-2 py-0.5">
                        {colLeads.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {colLeads.map((lead) => {
                        const isSelected = selectedLead?.id === lead.id;
                        const isDragging = draggedLead?.id === lead.id;
                        const subtitle = lead.customer_data?.company || lead.customer_data?.email;
                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => onCardDragStart(e, lead)}
                            onDragEnd={onCardDragEnd}
                            onClick={() => onCardClick(lead)}
                            onTouchStart={(e) => onCardTouchStart(e, lead)}
                            onTouchMove={onCardTouchMove}
                            onTouchEnd={(e) => onCardTouchEnd(e, lead)}
                            onKeyDown={(e) => e.key === "Enter" && setSelectedLead(lead)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Замовлення від ${lead.customer_data?.name}`}
                            aria-pressed={isSelected}
                            className={`bg-card rounded-lg border p-3 cursor-pointer select-none transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary outline-none touch-none ${
                              isDragging ? "opacity-40 scale-95" : ""
                            } ${isSelected ? "ring-2 ring-primary border-primary" : "border-border"}`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 cursor-grab" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{lead.customer_data?.name}</p>
                                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {lead.order_items && lead.order_items.length > 0 && (
                                <span className="text-xs text-muted-foreground">{lead.order_items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
                              )}
                              {lead.total_amount_cents > 0 && (
                                <span className="text-xs font-medium ml-auto">{(lead.total_amount_cents / 100).toLocaleString("uk-UA")} ₴</span>
                              )}
                            </div>
                            {(lead.tags ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(lead.tags ?? []).map((tagId) => {
                                  const tag = PREDEFINED_TAGS.find((t) => t.id === tagId);
                                  return tag ? (
                                    <span key={tagId}
                                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                                      style={{ color: tag.color, backgroundColor: tag.bg, borderColor: `${tag.color}30` }}>
                                      <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                      {tag.label}
                                    </span>
                                  ) : (
                                    <span key={tagId}
                                      className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/50 text-foreground">
                                      {tagId}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {colLeads.length === 0 && (
                        <EmptyState icon={Inbox} title="Порожньо" className="py-8 opacity-50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel — bottom sheet on mobile, resizable side panel on desktop ── */}
      {selectedLead && (() => {
        return (
          <>
            {/* Mobile: backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black/40 z-20"
              onClick={() => { closedLeadIdRef.current = selectedLead?.id ?? null; setSelectedLead(null); }}
            />

            {/* Panel */}
            <div
              className={[
                "fixed z-30 bg-card flex flex-col",
                // Mobile: bottom sheet — full width, no overflow-hidden so content scrolls inside
                "bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden",
                // Desktop: full-height side panel
                "lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:h-screen lg:max-h-none lg:rounded-none lg:border-l lg:border-border lg:shadow-xl",
                isDraggingDrawer ? "select-none" : "",
              ].join(" ")}
              ref={(el) => {
                if (!el) return;
                if (window.innerWidth >= 1024) {
                  el.style.width = drawerWidth + "px";
                } else {
                  el.style.width = "";
                }
              }}
            >
              {/* Mobile: drag handle pill */}
              <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Desktop: resize handle — 4px wide, left edge only */}
              <div
                onMouseDown={onDrawerDragStart}
                className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
              />

              {/* Header */}
              <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
                <span className="font-semibold text-base">Деталі замовлення</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { closedLeadIdRef.current = selectedLead?.id ?? null; setSelectedLead(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Avatar + name + status + quick stats */}
              <div className="flex flex-col items-center py-5 px-4 border-b border-border">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-2.5">
                  <span className="text-xl font-bold text-primary">
                    {selectedLead.customer_data?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <p className="font-semibold text-base text-center">{selectedLead.customer_data?.name}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger className="mt-1.5 flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full cursor-pointer">
                    <StatusBadge status={selectedLead.status} />
                    <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    {STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(selectedLead, s)} className="gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s]?.className ?? ""}`} />
                        {STATUS_LABELS[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Chat button */}
              <div className="px-4 pt-4 pb-2">
                <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/messages?leadId=${selectedLead.id}`)}>
                  <MessageCircle className="w-4 h-4" /> Чат
                </Button>
              </div>

              {/* Tabs */}
              <div className="px-4 border-b border-border">
                <div className="flex gap-4">
                  {(["contacts", "items"] as const).map((tab) => {
                    const labels = {
                      contacts: "Клієнт",
                      items: "Товари",
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab: Contacts */}
              {activeTab === "contacts" && (
                <div className="px-4 py-4 space-y-3">
                  {/* Edit / View toggle header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Контактні дані</p>
                    {!editingContact ? (
                      <button onClick={() => { setEditingContact(true); setEditContactData({ ...selectedLead.customer_data }); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="size-3" /> Редагувати
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingContact(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Скасувати</button>
                        <button onClick={handleSaveContact} disabled={savingContact}
                          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline disabled:opacity-50">
                          <Check className="size-3" /> {savingContact ? "Збереження..." : "Зберегти"}
                        </button>
                      </div>
                    )}
                  </div>

                  {editingContact && editContactData ? (
                    /* ── Edit mode ── */
                    <div className="space-y-3">
                      {[
                        { key: "name",             label: "Ім'я та прізвище", type: "text"  },
                        { key: "phone",            label: "Телефон",          type: "tel"   },
                        { key: "email",            label: "Email",            type: "email" },
                        { key: "company",          label: "Компанія",         type: "text"  },
                        { key: "edrpou",           label: "ЄДРПОУ",           type: "text"  },
                        { key: "delivery_details", label: "Адреса доставки",  type: "text"  },
                        { key: "comment",          label: "Коментар",         type: "text"  },
                      ].map(({ key, label, type }) => (
                        <div key={key}>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">{label}</label>
                          <input type={type}
                            value={(editContactData as Record<string, unknown>)[key] as string ?? ""}
                            onChange={(e) => setEditContactData({ ...editContactData, [key]: e.target.value })}
                            className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Доставка</label>
                        <select value={editContactData.delivery ?? "nova_poshta"}
                          onChange={(e) => setEditContactData({ ...editContactData, delivery: e.target.value })}
                          className="w-full h-9">
                          <option value="nova_poshta">Нова Пошта</option>
                          <option value="pickup">Самовивіз</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Дедлайн</label>
                        <input type="date" value={editContactData.deadline ?? ""}
                          onChange={(e) => setEditContactData({ ...editContactData, deadline: e.target.value })}
                          className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                  {selectedLead.customer_data?.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-sm">{selectedLead.customer_data.phone}</p><p className="text-xs text-muted-foreground">Телефон</p></div>
                    </div>
                  )}
                  {selectedLead.customer_data?.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-sm break-all">{selectedLead.customer_data.email}</p><p className="text-xs text-muted-foreground">Email</p></div>
                    </div>
                  )}
                  {selectedLead.customer_data?.company && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">{selectedLead.customer_data.company}</p>
                        {selectedLead.customer_data?.edrpou && <p className="text-xs text-muted-foreground">ЄДРПОУ: {selectedLead.customer_data.edrpou}</p>}
                        <p className="text-xs text-muted-foreground">Компанія</p>
                      </div>
                    </div>
                  )}
                  {selectedLead.customer_data?.social_channel && (
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-sm">{selectedLead.customer_data.social_channel}</p><p className="text-xs text-muted-foreground">Соцмережа</p></div>
                    </div>
                  )}
                  {selectedLead.customer_data?.delivery && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">
                          {selectedLead.customer_data.delivery === "nova_poshta" ? "Нова Пошта" :
                           selectedLead.customer_data.delivery === "pickup" ? "Самовивіз" :
                           selectedLead.customer_data.delivery}
                        </p>
                        {selectedLead.customer_data?.delivery_details && (
                          <p className="text-xs text-muted-foreground">{selectedLead.customer_data.delivery_details}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Доставка</p>
                      </div>
                    </div>
                  )}
                  {selectedLead.customer_data?.deadline && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">{new Date(selectedLead.customer_data.deadline).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}</p>
                        <p className="text-xs text-muted-foreground">Бажаний дедлайн</p>
                      </div>
                    </div>
                  )}
                  {selectedLead.customer_data?.comment && (
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-sm">{selectedLead.customer_data.comment}</p><p className="text-xs text-muted-foreground">Коментар клієнта</p></div>
                    </div>
                  )}
                  {(selectedLead.customer_data?.attachments as string[] | undefined)?.length ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Вкладення клієнта</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedLead.customer_data.attachments as string[]).map((url: string, i: number) => (
                          <a key={i} href={url} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">
                            <Download className="w-3 h-3" /> Файл {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm">{new Date(selectedLead.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="text-xs text-muted-foreground">Дата звернення</p>
                    </div>
                  </div>
                  {(selectedLead.status === "completed" || selectedLead.status === "archived") && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">
                          {new Date(selectedLead.updated_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                          {" "}<span className="text-muted-foreground text-xs">({Math.round((new Date(selectedLead.updated_at).getTime() - new Date(selectedLead.created_at).getTime()) / 86400000)} дн.)</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Дата завершення</p>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Теги</p>
                    <div className="flex flex-wrap gap-2">
                      {/* Predefined tags — dot always visible, no close icon */}
                      {PREDEFINED_TAGS.map((tag) => {
                        const active = (selectedLead.tags ?? []).includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            disabled={savingTags}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                            style={active
                              ? { color: tag.color, backgroundColor: tag.bg, borderColor: `${tag.color}50` }
                              : { color: "var(--color-muted-foreground)", backgroundColor: "transparent", borderColor: "var(--color-border)" }
                            }
                          >
                            <span className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color, opacity: active ? 1 : 0.35 }} />
                            {tag.label}
                          </button>
                        );
                      })}

                      {/* Custom tags already on this lead */}
                      {(selectedLead.tags ?? [])
                        .filter((t) => !PREDEFINED_TAGS.find((p) => p.id === t))
                        .map((tag) => (
                          <span key={tag}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground">
                            {tag}
                            <button type="button" onClick={() => handleToggleTag(tag)} disabled={savingTags}
                              className="opacity-40 hover:opacity-80 transition-opacity disabled:pointer-events-none">
                              <X className="size-2.5" />
                            </button>
                          </span>
                        ))
                      }

                      {/* Add custom tag */}
                      <form onSubmit={(e) => { e.preventDefault(); void handleAddCustomTag(drawerCustomTagInput); }}
                        className="inline-flex items-center gap-1.5">
                        <input
                          value={drawerCustomTagInput}
                          onChange={(e) => setDrawerCustomTagInput(e.target.value)}
                          placeholder="Свій тег..."
                          className="h-7 text-xs border border-dashed border-border/70 rounded-full px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-transparent placeholder:text-muted-foreground/50 w-24 transition-all focus:w-32"
                        />
                        {drawerCustomTagInput.trim() && (
                          <button type="submit" disabled={savingTags}
                            className="h-7 w-7 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0">
                            <Plus className="size-3" />
                          </button>
                        )}
                      </form>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Нотатка</p>
                    <textarea
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      placeholder="Додати нотатку..."
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {noteValue !== (selectedLead.notes ?? "") && (
                      <button onClick={handleSaveNote} disabled={savingNote}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
                        {savingNote ? "Збереження..." : "Зберегти"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Items */}
              {activeTab === "items" && (
                <div className="px-4 py-4 space-y-3">
                  {!selectedLead.order_items?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Немає позицій</p>
                  ) : (
                    <>
                      {/* Total + summary at top */}
                      {selectedLead.total_amount_cents > 0 && (
                        <div className="pb-2 border-b border-border space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Загальна сума</span>
                            <span className="text-base font-semibold">{(selectedLead.total_amount_cents / 100).toLocaleString("uk-UA")} ₴</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Одиниць</span>
                            <span className="text-xs font-medium">{selectedLead.order_items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Позицій</span>
                            <span className="text-xs font-medium">{selectedLead.order_items.length}</span>
                          </div>
                        </div>
                      )}
                      {selectedLead.order_items.map((item) => {
                        const product = products[item.product_id];
                        const productImgArr = product
                          ? (() => {
                              const pi = (product as any).product_images;
                              if (pi && pi.length > 0) return pi;
                              return Object.entries(product.images || {}).map(([key, url], i) => ({ key, url, label: key, is_customizable: true, sort_order: i }));
                            })()
                          : [];
                        const productImg = item.technical_metadata?.product_image_url
                          || productImgArr.find((i: any) => i.key === "front")?.url
                          || productImgArr[0]?.url
                          || product?.images?.front
                          || Object.values(product?.images || {})[0];
                        const layers = item.technical_metadata?.layers ?? [];
                        const mockupImg = item.mockup_url;
                        const mockupBackImg = (item.technical_metadata as any)?.mockup_back_url as string | undefined;
                        // Use full mockups map if available, fall back to front/back
                        const mockupsMap = (item.technical_metadata as any)?.mockups_map as Record<string, string> | undefined;
                        const allMockups: Record<string, string> = mockupsMap
                          ? mockupsMap
                          : {
                              ...(mockupImg ? { front: mockupImg } : {}),
                              ...(mockupBackImg ? { back: mockupBackImg } : {}),
                            };
                        // Derive side keys from layers or product images
                        const prodImages = (() => {
                          const pi = (product as any)?.product_images;
                          if (pi && pi.length > 0) return Object.fromEntries(pi.filter((i: any) => i.is_customizable).map((i: any) => [i.key, i.url]));
                          return product?.images ?? {};
                        })();
                        const layerSides = [...new Set(layers.map(l => l.side))];
                        const frontKey = layerSides[0] ?? Object.keys(prodImages)[0] ?? "front";
                        const backKey = layerSides[1] ?? Object.keys(prodImages)[1] ?? "back";
                        return (
                          <div key={item.id} className="border border-border rounded-xl overflow-hidden">
                            {/* Always show composite: mockup if available, else product+print overlay */}
                            <div className="relative bg-muted border-b border-border flex justify-center p-3">
                              {Object.keys(allMockups).length > 0 ? (
                                <div className="relative group w-full">
                                  <MockupViewerOrders mockupsMap={allMockups} />
                                  <div className="absolute top-1 right-1 flex gap-1 flex-wrap justify-end">
                                    {Object.entries(allMockups).map(([side, url]) => (
                                      <a key={side} href={url} download={`mockup-${side}.png`} target="_blank" rel="noopener noreferrer"
                                        title={`Завантажити ${side}`}
                                        className="bg-black/60 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}>
                                        <Download className="w-3 h-3 text-white" />
                                        <span className="text-[9px] text-white font-medium">{side.slice(0, 2).toUpperCase()}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : productImg ? (
                                // Composite: product image + print overlays
                                <div className="relative w-48 h-48">
                                  <img src={productImg} alt={product?.name} className="w-full h-full object-contain" />
                                  {layers.filter(l => l.side === "front").map((layer, li) => (
                                    <img key={li} src={layer.url} alt="print"
                                      className="absolute inset-0 w-full h-full object-contain p-8"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="w-48 h-48 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">
                                {mockupImg ? "Мокап" : "Превью"}
                              </span>
                            </div>

                            {/* Item info */}
                            <div className="p-3 space-y-1">
                              <p className="text-sm font-semibold truncate">{product?.name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{item.quantity} шт. · {item.size} · {item.color}</p>
                              {(() => {
                                const unitCents = item.unit_price_cents ?? item.technical_metadata?.unit_price_cents;
                                const printCents = item.technical_metadata?.print_cost_cents ?? 0;
                                if (!unitCents) return null;
                                // Detect discount: stored discounted price vs base product price
                                const baseCents = products[item.product_id]?.base_price_cents ?? unitCents;
                                const hasItemDiscount = baseCents > unitCents;
                                const itemDiscountPct = hasItemDiscount ? Math.round((1 - unitCents / baseCents) * 100) : 0;
                                const lineTotal = (unitCents + printCents) * item.quantity;
                                const lineTotalBase = (baseCents + printCents) * item.quantity;
                                const savings = lineTotalBase - lineTotal;
                                return (
                                  <div className="mt-2 rounded-lg border border-border/40 bg-muted/30 overflow-hidden">
                                    {/* Item price row */}
                                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-xs font-medium">Товар</p>
                                        {hasItemDiscount && (
                                          <p className="text-[10px] text-muted-foreground">
                                            <span className="line-through">{(baseCents / 100).toFixed(0)} ₴</span>
                                            <span className="ml-1 text-emerald-600 font-semibold">−{itemDiscountPct}%</span>
                                          </p>
                                        )}
                                      </div>
                                      <p className="text-xs font-semibold tabular-nums">{(unitCents / 100).toFixed(0)} ₴<span className="text-muted-foreground font-normal">/шт</span></p>
                                    </div>
                                    {/* Per-layer rows */}
                                    {layers.map((layer, li) => {
                                      const lp = layer.priceCents ?? 0;
                                      if (!lp) return null;
                                      return (
                                        <div key={li} className="border-t border-border/30 px-3 py-1.5 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-xs font-medium">{layer.type?.toUpperCase()}</p>
                                            {layer.sizeLabel && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{layer.sizeLabel}</span>}
                                            <span className="text-[10px] text-muted-foreground opacity-60">{layer.side}</span>
                                          </div>
                                          <p className="text-xs font-semibold tabular-nums">{(lp / 100).toFixed(0)} ₴<span className="text-muted-foreground font-normal">/шт</span></p>
                                        </div>
                                      );
                                    })}
                                    {/* Savings */}
                                    {savings > 0 && (
                                      <div className="border-t border-border/30 px-3 py-1.5 flex items-center justify-between bg-emerald-50/60">
                                        <p className="text-xs text-emerald-700 font-medium">Економія</p>
                                        <p className="text-xs font-semibold text-emerald-700">−{(savings / 100).toFixed(0)} ₴</p>
                                      </div>
                                    )}
                                    {/* Total */}
                                    <div className="border-t border-border/40 px-3 py-2 flex items-baseline justify-between bg-background/60">
                                      <div>
                                        <p className="text-xs font-bold">Разом</p>
                                        {item.quantity > 1 && <p className="text-[10px] text-muted-foreground">{item.quantity} шт × {((unitCents + printCents) / 100).toFixed(0)} ₴</p>}
                                      </div>
                                      <p className="text-sm font-black text-primary tabular-nums">{(lineTotal / 100).toLocaleString("uk-UA")} ₴</p>
                                    </div>
                                  </div>
                                );
                              })()}
                              {item.technical_metadata?.item_note && (
                                <p className="text-xs text-muted-foreground italic mt-1">"{item.technical_metadata.item_note}"</p>
                              )}
                            </div>

                            {/* Print layers — both mockup preview AND original file + details */}
                            {layers.length > 0 && (
                              <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                  Нанесення ({layers.length})
                                </p>
                                {layers.map((layer, li) => (
                                  <div key={li} className="rounded-lg border border-border bg-background overflow-hidden">
                                    {/* Row: file preview + details */}
                                    <div className="flex items-start gap-2.5 p-2.5">
                                      {/* Preview — SVG for text layers, image for print layers */}
                                      {layer.kind === "text" ? (
                                        <a href={layer.url || undefined} download={layer.url ? `text-${(layer.textContent ?? "text").slice(0, 20)}.svg` : undefined}
                                          target="_blank" rel="noopener noreferrer"
                                          className={`rounded-lg overflow-hidden border border-violet-200 bg-violet-50 w-16 h-16 shrink-0 flex items-center justify-center ${layer.url ? "hover:border-violet-400 transition-colors" : ""}`}
                                          onClick={(e) => e.stopPropagation()}>
                                          {(() => {
                                            const font = layer.textFont ?? "Montserrat";
                                            const color = layer.textColor ?? "#000000";
                                            const lines = (layer.textContent ?? "T").split("\n").filter(Boolean);
                                            const displayLines = lines.slice(0, 3);
                                            const maxLen = Math.max(...displayLines.map((l) => l.length), 1);
                                            const fs = Math.min(18, Math.max(8, Math.round(52 / maxLen * 1.2)));
                                            const lh = fs * 1.3;
                                            const totalH = lh * displayLines.length;
                                            const startY = (56 - totalH) / 2 + fs;
                                            const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;700&subset=cyrillic,latin`;
                                            return (
                                              <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                                                <defs><style>{`@import url('${fontUrl}');`}</style></defs>
                                                <text textAnchor="middle" fontFamily={`'${font}', sans-serif`} fontSize={fs} fill={color}>
                                                  {displayLines.map((line, i) => (
                                                    <tspan key={i} x="28" y={startY + i * lh}>{line}</tspan>
                                                  ))}
                                                </text>
                                              </svg>
                                            );
                                          })()}
                                        </a>
                                      ) : (
                                        <a href={layer.url} download target="_blank" rel="noopener noreferrer"
                                          className="group relative rounded-lg overflow-hidden border border-border bg-muted w-16 h-16 shrink-0 block"
                                          onClick={(e) => e.stopPropagation()}>
                                          <img src={layer.url} alt="Принт" className="w-full h-full object-contain p-0.5" />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Download className="w-3.5 h-3.5 text-white" />
                                          </div>
                                        </a>
                                      )}
                                      {/* Details — unified hierarchy for both text and image layers */}
                                      <div className="flex-1 min-w-0 space-y-1">
                                        {/* Row 1: type badge + side */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {layer.kind === "text" ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">Текст</span>
                                          ) : null}
                                          <PrintTypeBadge typeId={layer.type ?? "dtf"} small />
                                          <span className="text-[10px] text-muted-foreground">{layer.side}</span>
                                        </div>

                                        {/* Row 2: main content */}
                                        {layer.kind === "text" ? (
                                          <>
                                            <p className="text-xs font-medium">"{layer.textContent}"</p>
                                            <p className="text-xs text-muted-foreground">
                                              {layer.sizeLabel
                                                ? layer.sizeLabel
                                                : layer.sizeMinCm && layer.sizeMaxCm
                                                  ? `${layer.sizeMinCm}–${layer.sizeMaxCm} см`
                                                  : "Розмір не вказано"}
                                            </p>
                                          </>
                                        ) : (layer.sizeMinCm || layer.sizeLabel) ? (
                                          <p className="text-xs font-medium">
                                            {layer.sizeLabel || `${layer.sizeMinCm}–${layer.sizeMaxCm} см`}
                                            {layer.sizeMinCm && layer.sizeMaxCm && ` (${layer.sizeMinCm}×${layer.sizeMaxCm} см)`}
                                          </p>
                                        ) : null}

                                        {/* Row 3: secondary info (text only) */}
                                        {layer.kind === "text" && (
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] text-muted-foreground">{layer.textFont}</span>
                                            <div className="flex items-center gap-1">
                                              <div className="size-2.5 rounded-full border border-border shrink-0" style={{ backgroundColor: layer.textColor ?? "#000" }} />
                                              <span className="text-[10px] text-muted-foreground font-mono">{layer.textColor ?? "#000000"}</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Row 4: price — shown in item card above */}

                                        {/* Row 5: download */}
                                        {layer.url && (
                                          <a href={layer.url} download target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                            onClick={(e) => e.stopPropagation()}>
                                            <Download className="w-3 h-3" /> Завантажити
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Fallback: custom_print_url */}
                            {!layers.length && item.custom_print_url && (
                              <div className="border-t border-border p-3 space-y-1.5 bg-muted/20">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Файл принту</p>
                                <a href={item.custom_print_url} download target="_blank" rel="noopener noreferrer"
                                  className="group relative rounded-lg overflow-hidden border border-border bg-muted block"
                                  onClick={(e) => e.stopPropagation()}>
                                  <img src={item.custom_print_url} alt="Принт" className="w-full object-contain max-h-32" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Download className="w-5 h-5 text-white" />
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Footer — delete */}
            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <button
                disabled={deletingLead}
                onClick={async () => {
                  if (!confirm(`Видалити замовлення від "${selectedLead.customer_data?.name}"?\n\nЦю дію неможливо скасувати.`)) return;
                  if (deletingLead) return;
                  setDeletingLead(true);
                  try {
                    const r = await fetch(`/api/leads/${selectedLead.id}`, { method: "DELETE" });
                    if (!r.ok) throw new Error();
                    setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
                    setSelectedLead(null);
                    toast.success("Замовлення видалено");
                  } catch {
                    toast.error("Помилка при видаленні");
                  } finally {
                    setDeletingLead(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors py-2 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingLead
                  ? <><Loader2 className="size-3.5 animate-spin" /> Видаляємо...</>
                  : <><Trash2 className="size-3.5" /> Видалити замовлення</>
                }
              </button>
            </div>
          </div>
          </>
        );
      })()}
    </div>
  );
}
