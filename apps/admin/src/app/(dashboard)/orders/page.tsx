"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { PREDEFINED_TAGS } from "@udo-craft/shared";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Columns3, Filter, List, Loader2, Plus, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
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
const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "Весь час",
  today: "Сьогодні",
  week: "7 днів",
  month: "30 днів",
};
const AMOUNT_FILTER_LABELS: Record<AmountFilter, string> = {
  all: "Будь-яка сума",
  with_amount: "Є сума",
  without_amount: "Без суми",
};
const SORT_FILTER_LABELS: Record<SortFilter, string> = {
  newest: "Нові спочатку",
  oldest: "Старі спочатку",
  updated: "Оновлені",
  amount_desc: "Сума ↓",
  amount_asc: "Сума ↑",
};
const UNASSIGNED_TAG_VALUE = "__untagged__";
const CUSTOM_TAG_VALUE = "__custom__";

type StatusFilter = "all" | (typeof STATUSES)[number];
type TagFilter = "all" | typeof UNASSIGNED_TAG_VALUE | typeof CUSTOM_TAG_VALUE | (typeof PREDEFINED_TAGS)[number]["id"];
type DateFilter = "all" | "today" | "week" | "month";
type AmountFilter = "all" | "with_amount" | "without_amount";
type SortFilter = "newest" | "oldest" | "amount_desc" | "amount_asc" | "updated";
type ViewMode = "kanban" | "list";

function getTagFilterLabel(filter: TagFilter) {
  if (filter === "all") return "Всі теги";
  if (filter === UNASSIGNED_TAG_VALUE) return "Без тегів";
  if (filter === CUSTOM_TAG_VALUE) return "Інші теги";
  return PREDEFINED_TAGS.find((tag) => tag.id === filter)?.label ?? filter;
}

function getDateStart(filter: DateFilter) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (filter === "week") start.setDate(start.getDate() - 6);
  if (filter === "month") start.setDate(start.getDate() - 29);

  return start;
}

function matchesSearch(lead: Lead, query: string) {
  if (!query) return true;
  const customer = lead.customer_data ?? {};
  const haystack = [
    lead.id,
    lead.notes,
    customer.name,
    customer.email,
    customer.phone,
    customer.company,
    ...(lead.order_items ?? []).flatMap((item) => [
      item.size,
      item.color,
      item.technical_metadata?.item_note,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase().trim());
}

function formatOrderDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getItemCount(lead: Lead) {
  return lead.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

function OrdersBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");
  const [showEmptyColumns, setShowEmptyColumns] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [syncingKeycrm, setSyncingKeycrm] = useState(false);

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
      setLeads((await r.json()) || []);
    } catch { toast.error("Помилка при завантаженні замовлень"); setLeads([]); }
    finally { if (showLoading) setLoading(false); }
  }, []);

  const debouncedRealtimeFetch = useDebouncedCallback(() => {
    playNotificationTone();
    fetchLeads(false);
  }, 3000);

  const handleKeycrmSync = useCallback(async () => {
    setSyncingKeycrm(true);
    try {
      const response = await fetch("/api/keycrm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: 2 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      toast.success(`KeyCRM: ${data.created ?? 0} нових, ${data.updated ?? 0} оновлено`);
      await fetchLeads(false);
    } catch (error) {
      toast.error(`KeyCRM sync failed: ${error instanceof Error ? error.message : "невідома помилка"}`);
    } finally {
      setSyncingKeycrm(false);
    }
  }, [fetchLeads]);

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

  const filteredLeads = useMemo(() => {
    const dateStart = dateFilter === "all" ? null : getDateStart(dateFilter);

    return leads
      .filter((lead) => matchesSearch(lead, search))
      .filter((lead) => statusFilter === "all" || lead.status === statusFilter)
      .filter((lead) => {
        const tags = lead.tags ?? [];
        if (tagFilter === "all") return true;
        if (tagFilter === UNASSIGNED_TAG_VALUE) return tags.length === 0;
        if (tagFilter === CUSTOM_TAG_VALUE) {
          return tags.some((tag) => !PREDEFINED_TAGS.some((predefined) => predefined.id === tag));
        }
        return tags.includes(tagFilter);
      })
      .filter((lead) => {
        if (!dateStart) return true;
        return new Date(lead.created_at) >= dateStart;
      })
      .filter((lead) => {
        if (amountFilter === "all") return true;
        if (amountFilter === "with_amount") return lead.total_amount_cents > 0;
        return lead.total_amount_cents <= 0;
      })
      .sort((a, b) => {
        if (sortFilter === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortFilter === "amount_desc") return b.total_amount_cents - a.total_amount_cents;
        if (sortFilter === "amount_asc") return a.total_amount_cents - b.total_amount_cents;
        if (sortFilter === "updated") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [amountFilter, dateFilter, leads, search, sortFilter, statusFilter, tagFilter]);

  const visibleStatuses = useMemo(() => {
    if (showEmptyColumns) return STATUSES;
    return STATUSES.filter((status) => filteredLeads.some((lead) => lead.status === status));
  }, [filteredLeads, showEmptyColumns]);

  const hasFilters =
    search.trim() ||
    statusFilter !== "all" ||
    tagFilter !== "all" ||
    dateFilter !== "all" ||
    amountFilter !== "all" ||
    sortFilter !== "newest" ||
    !showEmptyColumns;

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setTagFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
    setSortFilter("newest");
    setShowEmptyColumns(true);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden selection:bg-primary/10 selection:text-primary">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Замовлення"
          subtitle={
            leads.length > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/10">
                {filteredLeads.length} з {leads.length}
              </span>
            )
          }
          actions={
            <>
              <Button
                variant="outline"
                size="lg"
                className="h-10 gap-2 px-4 text-xs font-semibold uppercase tracking-widest"
                onClick={handleKeycrmSync}
                disabled={syncingKeycrm}
              >
                {syncingKeycrm ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span>Sync KeyCRM</span>
              </Button>
              <Button
                size="lg"
                className="h-10 gap-2 px-4 text-xs font-semibold uppercase tracking-widest"
                onClick={() => router.push("/orders/new")}
              >
                <Plus className="size-4" />
                <span>Нове замовлення</span>
              </Button>
            </>
          }
        />

        <div className="border-b border-border bg-background px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Пошук за клієнтом, email, телефоном..."
                className="h-9 rounded-md pl-8 pr-8 text-sm"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Очистити пошук"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex h-9 items-center rounded-md border border-border bg-muted/30 p-1">
              <ViewModeButton
                active={viewMode === "kanban"}
                icon={Columns3}
                label="Канбан"
                onClick={() => setViewMode("kanban")}
              />
              <ViewModeButton
                active={viewMode === "list"}
                icon={List}
                label="Список"
                onClick={() => setViewMode("list")}
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-9 w-[150px] rounded-md text-xs">
                <SelectValue>
                  {statusFilter === "all" ? "Всі статуси" : STATUS_LABELS[statusFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={(value) => setTagFilter(value as TagFilter)}>
              <SelectTrigger className="h-9 w-[164px] rounded-md text-xs">
                <SelectValue>{getTagFilterLabel(tagFilter)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі теги</SelectItem>
                {PREDEFINED_TAGS.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>{tag.label}</SelectItem>
                ))}
                <SelectItem value={UNASSIGNED_TAG_VALUE}>Без тегів</SelectItem>
                <SelectItem value={CUSTOM_TAG_VALUE}>Інші теги</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger className="h-9 w-[142px] rounded-md text-xs">
                <SelectValue>{DATE_FILTER_LABELS[dateFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Весь час</SelectItem>
                <SelectItem value="today">Сьогодні</SelectItem>
                <SelectItem value="week">7 днів</SelectItem>
                <SelectItem value="month">30 днів</SelectItem>
              </SelectContent>
            </Select>

            <Select value={amountFilter} onValueChange={(value) => setAmountFilter(value as AmountFilter)}>
              <SelectTrigger className="h-9 w-[142px] rounded-md text-xs">
                <SelectValue>{AMOUNT_FILTER_LABELS[amountFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Будь-яка сума</SelectItem>
                <SelectItem value="with_amount">Є сума</SelectItem>
                <SelectItem value="without_amount">Без суми</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortFilter} onValueChange={(value) => setSortFilter(value as SortFilter)}>
              <SelectTrigger className="h-9 w-[154px] rounded-md text-xs">
                <SelectValue>{SORT_FILTER_LABELS[sortFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Нові спочатку</SelectItem>
                <SelectItem value="oldest">Старі спочатку</SelectItem>
                <SelectItem value="updated">Оновлені</SelectItem>
                <SelectItem value="amount_desc">Сума ↓</SelectItem>
                <SelectItem value="amount_asc">Сума ↑</SelectItem>
              </SelectContent>
            </Select>

            {viewMode === "kanban" && (
              <label className="ml-auto flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={showEmptyColumns}
                  onCheckedChange={(checked) => setShowEmptyColumns(checked === true)}
                />
                Порожні колонки
              </label>
            )}

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-2 px-3 text-xs"
                onClick={resetFilters}
              >
                <X className="size-3.5" />
                Скинути
              </Button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-1 font-medium">
              <SlidersHorizontal className="size-3.5" />
              {filteredLeads.length} замовлень у {viewMode === "kanban" ? "дошці" : "списку"}
            </span>
            {statusFilter !== "all" && <FilterChip>{STATUS_LABELS[statusFilter]}</FilterChip>}
            {tagFilter !== "all" && <FilterChip>{getTagFilterLabel(tagFilter)}</FilterChip>}
            {dateFilter !== "all" && (
              <FilterChip>{DATE_FILTER_LABELS[dateFilter]}</FilterChip>
            )}
            {amountFilter !== "all" && <FilterChip>{AMOUNT_FILTER_LABELS[amountFilter]}</FilterChip>}
            {sortFilter !== "newest" && <FilterChip>{SORT_FILTER_LABELS[sortFilter]}</FilterChip>}
            {!showEmptyColumns && <FilterChip>Тільки заповнені колонки</FilterChip>}
          </div>
        </div>

        <div className={cn("flex-1", viewMode === "kanban" ? "overflow-x-auto overflow-y-hidden" : "overflow-auto")}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-10 animate-spin text-primary/40" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="flex max-w-sm flex-col items-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-md border border-border bg-muted/30">
                  <Filter className="size-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-foreground">Нічого не знайдено</p>
                <p className="mt-1 text-sm text-muted-foreground">Змініть фільтри або скиньте їх, щоб повернути всі замовлення.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  Скинути фільтри
                </Button>
              </div>
            </div>
          ) : viewMode === "list" ? (
            <OrdersListView
              orders={filteredLeads}
              selectedOrderId={selectedLead?.id ?? null}
              onOrderClick={drag.onCardClick}
            />
          ) : (
            <div className="flex h-full gap-4 px-6 py-6 animate-in" style={{ width: "max-content", minWidth: "100%" }}>
              {visibleStatuses.map((status) => {
                const colLeads = filteredLeads.filter((l) => l.status === status);
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

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border border-border bg-muted/40 px-2",
        "text-[11px] font-semibold text-foreground"
      )}
    >
      {children}
    </span>
  );
}

function ViewModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function OrdersListView({
  orders,
  selectedOrderId,
  onOrderClick,
}: {
  orders: Lead[];
  selectedOrderId: string | null;
  onOrderClick: (lead: Lead) => void;
}) {
  return (
    <div className="px-6 py-5 animate-in">
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table className="min-w-[920px] table-fixed">
          <TableHeader>
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className="w-[30%]">Клієнт</TableHead>
              <TableHead className="w-[14%]">Статус</TableHead>
              <TableHead className="w-[24%]">Теги</TableHead>
              <TableHead className="w-[10%]">Позиції</TableHead>
              <TableHead className="w-[12%]">Дата</TableHead>
              <TableHead className="w-[10%] text-right">Сума</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((lead) => {
              const subtitle = lead.customer_data?.company || lead.customer_data?.email || lead.customer_data?.phone;
              const tags = lead.tags ?? [];

              return (
                <TableRow
                  key={lead.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Відкрити замовлення ${lead.customer_data?.name ?? lead.id}`}
                  data-state={selectedOrderId === lead.id ? "selected" : undefined}
                  onClick={() => onOrderClick(lead)}
                  onKeyDown={(event) => event.key === "Enter" && onOrderClick(lead)}
                  className="h-14 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {lead.customer_data?.name || "Без імені"}
                      </p>
                      {subtitle && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-64 flex-wrap gap-1">
                      {tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <>
                          {tags.slice(0, 2).map((tagId) => {
                            const tag = PREDEFINED_TAGS.find((item) => item.id === tagId);
                            return (
                              <Badge
                                key={tagId}
                                variant="outline"
                                className="h-6 normal-case tracking-normal"
                                style={tag ? {
                                  color: tag.color,
                                  backgroundColor: `${tag.bg}40`,
                                  borderColor: `${tag.color}20`,
                                } : undefined}
                              >
                                {tag?.label ?? tagId}
                              </Badge>
                            );
                          })}
                          {tags.length > 2 && (
                            <Badge variant="secondary" className="h-6 normal-case tracking-normal">
                              +{tags.length - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getItemCount(lead)} шт.
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatOrderDate(lead.created_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary">
                    {lead.total_amount_cents > 0
                      ? `${(lead.total_amount_cents / 100).toLocaleString("uk-UA")} ₴`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
