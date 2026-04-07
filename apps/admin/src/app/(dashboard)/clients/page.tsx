"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Mail, ExternalLink, Loader2, X, MessageCircle, Phone, Calendar, UserPlus, Trash2 } from "lucide-react";
import { StatusBadge, type LeadStatus } from "@/components/status-badge";
import { fmtMoney, fmtDate } from "@/lib/utils";

interface Lead {
  id: string;
  status: LeadStatus;
  customer_data: { name: string; email: string; phone?: string; company?: string; social_channel?: string };
  total_amount_cents: number;
  created_at: string;
}

interface ClientRecord {
  key: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  social_channel?: string;
  leads: Lead[];
  totalSpent: number;
  ordersCount: number;
  lastOrderAt: string;
}

const DRAWER_MIN = 280;
const DRAWER_MAX = 600;

const EMPTY_FORM = { name: "", email: "", phone: "", company: "", social_channel: "" };

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { toast.error("Помилка завантаження клієнтів"); setLoading(false); return; }

    const map = new Map<string, ClientRecord>();
    for (const lead of (data || []) as Lead[]) {
      // Use lead id as fallback key so orders without email aren't merged
      const email = lead.customer_data?.email?.trim() || "";
      const key = email || `__noemail__${lead.id}`;
      if (!map.has(key)) {
        map.set(key, { key, email, name: lead.customer_data?.name || email || "Невідомий", phone: lead.customer_data?.phone, company: lead.customer_data?.company, social_channel: lead.customer_data?.social_channel, leads: [], totalSpent: 0, ordersCount: 0, lastOrderAt: lead.created_at });
      }
      const rec = map.get(key)!;
      rec.leads.push(lead);
      rec.totalSpent += lead.total_amount_cents;
      rec.ordersCount += 1;
      if (lead.created_at > rec.lastOrderAt) rec.lastOrderAt = lead.created_at;
    }
    setClients(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase()) ||
           (c.phone ?? "").includes(search)
  );

  const handleDeleteClient = async (client: ClientRecord) => {
    if (!confirm(`Видалити клієнта "${client.name}" та всі його записи? Це незворотно.`)) return;
    try {
      await Promise.all(client.leads.map((l) =>
        fetch(`/api/leads/${l.id}`, { method: "DELETE" })
      ));
      setClients((cs) => cs.filter((c) => c.key !== client.key));
      if (selected?.key === client.key) setSelected(null);
      toast.success("Клієнта видалено");
    } catch {
      toast.error("Помилка видалення");
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email) { toast.error("Ім'я та email обов'язкові"); return; }
    setAddLoading(true);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "new",
          customer_data: {
            name: addForm.name,
            email: addForm.email,
            phone: addForm.phone || undefined,
            company: addForm.company || undefined,
            social_channel: addForm.social_channel || undefined,
          },
          total_amount_cents: 0,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Помилка");
      toast.success("Клієнта додано");
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Помилка");
    } finally {
      setAddLoading(false);
    }
  };

  const onDrawerDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startW = drawerWidth;
    const el = (e.currentTarget as HTMLElement).closest("[data-drawer]") as HTMLElement | null;
    const onMove = (ev: MouseEvent) => {
      const w = Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, startW + startX - ev.clientX));
      if (el) el.style.width = `${w}px`;
    };
    const onUp = (ev: MouseEvent) => {
      const w = Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, startW + startX - ev.clientX));
      setDrawerWidth(w);
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
    <div className={`flex flex-1 h-0 overflow-hidden${isDragging ? " select-none" : ""}`}>

      {/* ── Table area ── */}
      <div className="flex-1 flex flex-col overflow-hidden transition-[margin] duration-200" style={{ marginRight: selected ? drawerWidth : 0 }}>

        {/* Header */}
        <div className="h-12 px-4 border-b border-border shrink-0 flex items-center gap-4">
          <p className="font-semibold text-base shrink-0">
            Клієнти {clients.length > 0 && <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span>}
          </p>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Пошук..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button size="sm" className="ml-auto gap-1.5 shrink-0" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-3.5" /> Додати клієнта
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Клієнтів не знайдено
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Замовлень</TableHead>
                  <TableHead>Загальна сума</TableHead>
                  <TableHead>Останнє замовлення</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow
                    key={client.key}
                    className={`cursor-pointer transition-colors group ${selected?.key === client.key ? "bg-muted/60" : "hover:bg-muted/40"}`}
                    onClick={() => setSelected((p) => p?.key === client.key ? null : client)}
                  >
                    <TableCell>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </TableCell>
                    <TableCell><span className="text-sm">{client.ordersCount}</span></TableCell>
                    <TableCell><span className="text-sm font-medium">{fmtMoney(client.totalSpent)}</span></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{fmtDate(client.lastOrderAt)}</span></TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded hover:text-destructive transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div
          data-drawer
          className="fixed top-0 right-0 h-full border-l border-border bg-card flex flex-col overflow-hidden z-20"
          style={{ width: drawerWidth }}
        >
          {/* Drag handle */}
          <div onMouseDown={onDrawerDragStart} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10" />

          {/* Header */}
          <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
            <span className="font-semibold text-base">Клієнт</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClient(selected)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* Avatar + name + stats */}
            <div className="flex flex-col items-center py-5 px-4 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-2.5">
                <span className="text-xl font-bold text-primary">{selected.name[0]?.toUpperCase()}</span>
              </div>
              <p className="font-semibold text-base text-center">{selected.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.email}</p>
              {selected.company && <p className="text-xs text-muted-foreground">{selected.company}</p>}
              <div className="flex gap-3 mt-3 w-full">
                <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-center">
                  <p className="text-lg font-bold">{selected.ordersCount}</p>
                  <p className="text-[10px] text-muted-foreground">замовлень</p>
                </div>
                <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-center">
                  <p className="text-base font-bold">{fmtMoney(selected.totalSpent)}</p>
                  <p className="text-[10px] text-muted-foreground">витрачено</p>
                </div>
              </div>
            </div>

            {/* Chat button */}
            {selected.leads[0] && (
              <div className="px-4 pt-4">
                <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/messages?leadId=${selected.leads[0].id}`)}>
                  <MessageCircle className="w-4 h-4" /> Чат
                </Button>
              </div>
            )}

            {/* Contact */}
            <div className="px-4 py-4 space-y-3 border-b border-border">
              {selected.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{selected.phone}</p>
                    <p className="text-xs text-muted-foreground">Телефон</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <a href={`mailto:${selected.email}`} className="text-sm hover:underline break-all">{selected.email}</a>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>
              {selected.social_channel && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <a href={selected.social_channel} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate block">{selected.social_channel}</a>
                    <p className="text-xs text-muted-foreground">Соцмережа</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm">{fmtDate(selected.lastOrderAt)}</p>
                  <p className="text-xs text-muted-foreground">Останнє замовлення</p>
                </div>
              </div>
            </div>

            {/* Order history */}
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Історія замовлень</p>
              {selected.leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/orders?leadId=${lead.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{fmtMoney(lead.total_amount_cents)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(lead.created_at)}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>

      {/* ── Add Client Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новий клієнт</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="c-name">Ім&apos;я та прізвище *</Label>
                <Input id="c-name" placeholder="Іван Петренко" value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="c-email">Email *</Label>
                <Input id="c-email" type="email" placeholder="hr@company.com" value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">Телефон</Label>
                <Input id="c-phone" type="tel" placeholder="+380 XX XXX XX XX" value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-company">Компанія</Label>
                <Input id="c-company" placeholder="ТОВ «Назва»" value={addForm.company}
                  onChange={(e) => setAddForm({ ...addForm, company: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="c-social">Telegram / Instagram</Label>
                <Input id="c-social" placeholder="@username" value={addForm.social_channel}
                  onChange={(e) => setAddForm({ ...addForm, social_channel: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Скасувати</Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Додати
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
