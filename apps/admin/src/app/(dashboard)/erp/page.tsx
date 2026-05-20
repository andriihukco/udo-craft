"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, ClipboardCheck, Factory, Loader2, PackagePlus, Repeat2, Truck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashboardHeader } from "@/components/dashboard-header";
import type { ErpMaterial, ErpSupplier, ErpWarehouse, ProductVariantSku } from "@udo-craft/shared";

type Product = { id: string; name: string; slug: string };
type ProductionOrder = { id: string; status: string; quantity: number; notes?: string | null; lines?: ProductionLine[] };
type ProductionLine = {
  id: string;
  quantity: number;
  due_date?: string | null;
  comment?: string | null;
  variant_sku?: ProductVariantSku | null;
  product?: Product | null;
  material_requirements?: Array<{ material?: ErpMaterial; required_quantity: number; available_quantity: number; shortage_quantity: number }>;
};

const money = (cents: number) => `${(cents / 100).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;

export default function ErpPage() {
  const [materials, setMaterials] = useState<ErpMaterial[]>([]);
  const [warehouses, setWarehouses] = useState<ErpWarehouse[]>([]);
  const [suppliers, setSuppliers] = useState<ErpSupplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variantSkus, setVariantSkus] = useState<ProductVariantSku[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [receipt, setReceipt] = useState({ material_id: "", supplier_id: "", warehouse_id: "", quantity: 1, unit_cost: 0, comment: "" });
  const [production, setProduction] = useState({ variant_sku_id: "", product_id: "", quantity: 1, due_date: "", comment: "" });
  const [act, setAct] = useState({ production_order_id: "", warehouse_id: "", comment: "" });
  const [transfer, setTransfer] = useState({ material_id: "", from_warehouse_id: "", to_warehouse_id: "", quantity: 1, comment: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsRes, warehousesRes, suppliersRes, productsRes, skusRes, ordersRes] = await Promise.all([
        fetch("/api/erp/materials"),
        fetch("/api/erp/warehouses"),
        fetch("/api/erp/suppliers"),
        fetch("/api/products"),
        fetch("/api/erp/variant-skus"),
        fetch("/api/erp/production-orders"),
      ]);
      const [materialsData, warehousesData, suppliersData, productsData, skusData, ordersData] = await Promise.all([
        materialsRes.ok ? materialsRes.json() : [],
        warehousesRes.ok ? warehousesRes.json() : [],
        suppliersRes.ok ? suppliersRes.json() : [],
        productsRes.ok ? productsRes.json() : [],
        skusRes.ok ? skusRes.json() : [],
        ordersRes.ok ? ordersRes.json() : [],
      ]);
      setMaterials(materialsData);
      setWarehouses(warehousesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setVariantSkus(skusData);
      setOrders(ordersData);
      setReceipt((prev) => ({ ...prev, material_id: prev.material_id || materialsData[0]?.id || "", warehouse_id: prev.warehouse_id || warehousesData[0]?.id || "" }));
      setProduction((prev) => ({ ...prev, variant_sku_id: prev.variant_sku_id || skusData[0]?.id || "", product_id: prev.product_id || productsData[0]?.id || "" }));
      setAct((prev) => ({ ...prev, production_order_id: prev.production_order_id || ordersData[0]?.id || "", warehouse_id: prev.warehouse_id || warehousesData.find((w: ErpWarehouse) => w.code === "READY")?.id || warehousesData[0]?.id || "" }));
      setTransfer((prev) => ({ ...prev, material_id: prev.material_id || materialsData[0]?.id || "", from_warehouse_id: prev.from_warehouse_id || warehousesData[0]?.id || "", to_warehouse_id: prev.to_warehouse_id || warehousesData[1]?.id || "" }));
    } catch {
      toast.error("Не вдалося завантажити ERP дані");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedMaterial = useMemo(() => materials.find((m) => m.id === receipt.material_id), [materials, receipt.material_id]);
  const totalStockValue = materials.reduce((sum, m) => sum + Number(m.stock_quantity || 0) * Number(m.unit_cost_cents || 0), 0);
  const shortages = orders.flatMap((order) => order.lines ?? []).flatMap((line) => (line.material_requirements ?? []).filter((req) => Number(req.shortage_quantity || 0) > 0));

  async function postJson(kind: string, url: string, body: unknown, success: string) {
    setSaving(kind);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Помилка документа");
      toast.success(success);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Помилка документа");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex h-0 flex-1 flex-col overflow-hidden">
      <DashboardHeader
        title="CRM-ERP: рух товару"
        subtitle="Постачання, варіації SKU, виробництво, переробка, переміщення і замовлення"
        actions={<Link href="/warehouse" className={buttonVariants({ size: "sm" })}><Boxes className="h-4 w-4" />Склад</Link>}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric icon={Boxes} label="Номенклатура" value={materials.length.toString()} sub="матеріали та товари" />
          <Metric icon={WalletCards} label="Вартість складу" value={money(Math.round(totalStockValue))} sub="за собівартістю" />
          <Metric icon={ClipboardCheck} label="Виробничі документи" value={orders.length.toString()} sub="замовлення на виробництво" />
          <Metric icon={Factory} label="Дефіцит" value={shortages.length.toString()} sub="рядків з нестачею" tone={shortages.length ? "danger" : "ok"} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackagePlus className="h-4 w-4" />Постачання товару</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Товар / матеріал"><Select value={receipt.material_id} onValueChange={(v) => setReceipt({ ...receipt, material_id: v ?? "" })}><SelectTrigger><span>{selectedMaterial?.name ?? "Матеріал"}</span></SelectTrigger><SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {m.unit}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Постачальник"><Select value={receipt.supplier_id || "none"} onValueChange={(v) => setReceipt({ ...receipt, supplier_id: v === "none" || !v ? "" : v })}><SelectTrigger><span>{suppliers.find((s) => s.id === receipt.supplier_id)?.name ?? "Без постачальника"}</span></SelectTrigger><SelectContent><SelectItem value="none">Без постачальника</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Склад"><WarehouseSelect value={receipt.warehouse_id} warehouses={warehouses} onChange={(v) => setReceipt({ ...receipt, warehouse_id: v })} /></Field>
                <Field label={`Кількість, ${selectedMaterial?.unit ?? "од."}`}><Input type="number" min="0" step="0.001" value={receipt.quantity} onChange={(e) => setReceipt({ ...receipt, quantity: Number(e.target.value) })} /></Field>
                <Field label="Ціна за одиницю, ₴"><Input type="number" min="0" step="0.01" value={receipt.unit_cost} onChange={(e) => setReceipt({ ...receipt, unit_cost: Number(e.target.value) })} /></Field>
                <Field label="Сума"><Input readOnly value={money(Math.round(receipt.quantity * receipt.unit_cost * 100))} /></Field>
              </div>
              <Textarea rows={2} value={receipt.comment} onChange={(e) => setReceipt({ ...receipt, comment: e.target.value })} placeholder="Коментар, партія, інвойс..." />
              <Button onClick={() => postJson("receipt", "/api/erp/receipts", { supplier_id: receipt.supplier_id || null, warehouse_id: receipt.warehouse_id || null, comment: receipt.comment, lines: [{ erp_material_id: receipt.material_id, unit: selectedMaterial?.unit ?? "шт.", quantity: receipt.quantity, unit_cost_cents: Math.round(receipt.unit_cost * 100) }] }, "Постачання оприбутковано")} disabled={saving === "receipt"}>{saving === "receipt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}Оприбуткувати</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4" />Замовлення на виробництво</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Варіація SKU"><Select value={production.variant_sku_id || "none"} onValueChange={(v) => setProduction({ ...production, variant_sku_id: v === "none" || !v ? "" : v })}><SelectTrigger><span>{variantSkus.find((s) => s.id === production.variant_sku_id)?.sku ?? "Без SKU"}</span></SelectTrigger><SelectContent><SelectItem value="none">Без SKU</SelectItem>{variantSkus.map((s) => <SelectItem key={s.id} value={s.id}>{s.sku} · {s.size}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Продукт"><Select value={production.product_id} onValueChange={(v) => setProduction({ ...production, product_id: v ?? "" })}><SelectTrigger><span>{products.find((p) => p.id === production.product_id)?.name ?? "Продукт"}</span></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Кількість"><Input type="number" min="1" value={production.quantity} onChange={(e) => setProduction({ ...production, quantity: Number(e.target.value) })} /></Field>
                <Field label="Термін"><Input type="date" value={production.due_date} onChange={(e) => setProduction({ ...production, due_date: e.target.value })} /></Field>
              </div>
              <Textarea rows={2} value={production.comment} onChange={(e) => setProduction({ ...production, comment: e.target.value })} placeholder="Коментар до пошиття..." />
              <Button onClick={() => postJson("production", "/api/erp/production-orders", { lines: [{ variant_sku_id: production.variant_sku_id || null, product_id: production.product_id || null, quantity: production.quantity, due_date: production.due_date || null, comment: production.comment }] }, "Замовлення на виробництво створено")} disabled={saving === "production"}>{saving === "production" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}Створити документ</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Factory className="h-4 w-4" />Акт переробки</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Документ виробництва"><Select value={act.production_order_id} onValueChange={(v) => setAct({ ...act, production_order_id: v ?? "" })}><SelectTrigger><span>{orders.find((o) => o.id === act.production_order_id)?.id.slice(0, 8).toUpperCase() ?? "Документ"}</span></SelectTrigger><SelectContent>{orders.map((o) => <SelectItem key={o.id} value={o.id}>#{o.id.slice(0, 8).toUpperCase()} · {o.quantity} шт. · {o.status}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Склад готової продукції"><WarehouseSelect value={act.warehouse_id} warehouses={warehouses} onChange={(v) => setAct({ ...act, warehouse_id: v })} /></Field>
              <Textarea rows={2} value={act.comment} onChange={(e) => setAct({ ...act, comment: e.target.value })} placeholder="Факт пошиття, контроль якості..." />
              <Button onClick={() => postJson("act", "/api/erp/processing-acts", { production_order_id: act.production_order_id, warehouse_id: act.warehouse_id || null, comment: act.comment }, "Акт переробки проведено")} disabled={saving === "act"}>{saving === "act" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Factory className="h-4 w-4" />}Провести акт</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Repeat2 className="h-4 w-4" />Переміщення між складами</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Матеріал"><Select value={transfer.material_id} onValueChange={(v) => setTransfer({ ...transfer, material_id: v ?? "" })}><SelectTrigger><span>{materials.find((m) => m.id === transfer.material_id)?.name ?? "Матеріал"}</span></SelectTrigger><SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Зі складу"><WarehouseSelect value={transfer.from_warehouse_id} warehouses={warehouses} onChange={(v) => setTransfer({ ...transfer, from_warehouse_id: v })} /></Field>
                <Field label="На склад"><WarehouseSelect value={transfer.to_warehouse_id} warehouses={warehouses} onChange={(v) => setTransfer({ ...transfer, to_warehouse_id: v })} /></Field>
              </div>
              <Field label="Кількість"><Input type="number" min="0" step="0.001" value={transfer.quantity} onChange={(e) => setTransfer({ ...transfer, quantity: Number(e.target.value) })} /></Field>
              <Button onClick={() => postJson("transfer", "/api/erp/transfers", { from_warehouse_id: transfer.from_warehouse_id || null, to_warehouse_id: transfer.to_warehouse_id || null, comment: transfer.comment, lines: [{ erp_material_id: transfer.material_id, quantity: transfer.quantity, unit: materials.find((m) => m.id === transfer.material_id)?.unit ?? "шт." }] }, "Переміщення проведено")} disabled={saving === "transfer"}>{saving === "transfer" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}Перемістити</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Дефіцит у виробництві</CardTitle></CardHeader>
          <CardContent>
            {shortages.length === 0 ? <p className="text-sm text-muted-foreground">Нестачі за поточними виробничими документами немає.</p> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2 text-left">Матеріал</th><th className="py-2 text-right">Потрібно</th><th className="py-2 text-right">Доступно</th><th className="py-2 text-right">Не вистачає</th></tr></thead><tbody>{shortages.map((req, i) => <tr key={i} className="border-t"><td className="py-2">{req.material?.name ?? "Матеріал"}</td><td className="py-2 text-right">{req.required_quantity}</td><td className="py-2 text-right">{req.available_quantity}</td><td className="py-2 text-right font-semibold text-destructive">{req.shortage_quantity}</td></tr>)}</tbody></table></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof Boxes; label: string; value: string; sub: string; tone?: "danger" | "ok" }) {
  return <Card><CardContent className="p-4"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-primary" /><Badge variant={tone === "danger" ? "destructive" : "secondary"}>{sub}</Badge></div><p className="mt-4 text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function WarehouseSelect({ value, warehouses, onChange }: { value: string; warehouses: ErpWarehouse[]; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={(next) => onChange(next ?? "")}><SelectTrigger><span>{warehouses.find((w) => w.id === value)?.name ?? "Склад"}</span></SelectTrigger><SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>;
}
