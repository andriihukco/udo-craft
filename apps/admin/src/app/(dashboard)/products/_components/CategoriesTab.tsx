"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { CategoryDialog } from "./CategoryDialog";
import type { Category } from "@udo-craft/shared";

export interface CategoriesTabProps {
  categories: Category[];
  onRefresh: () => void;
  loading?: boolean;
}

export function CategoriesTab({ categories: propCategories, onRefresh, loading = false }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>(propCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const dragItem = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sync local state whenever parent passes new categories
  useEffect(() => { setCategories(propCategories); }, [propCategories]);

  const openCreate = () => { setEditingCategory(undefined); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditingCategory(cat); setDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Категорію видалено");
      onRefresh();
    } catch { toast.error("Помилка видалення"); }
    finally { setDeleteTarget(null); }
  };

  const handleToggle = async (cat: Category) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      if (!res.ok) throw new Error();
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
    } catch { toast.error("Помилка"); }
  };

  const reorder = (items: Category[], fromId: string, toId: string): Category[] => {
    const from = items.findIndex(i => i.id === fromId);
    const to = items.findIndex(i => i.id === toId);
    if (from === -1 || to === -1 || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const persistOrder = async (items: Category[]) => {
    await Promise.all(items.map((cat, i) =>
      fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: i }),
      })
    ));
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Категорії</p>
          <p className="text-xs text-muted-foreground mt-0.5">Групи товарів для навігації та фільтрації</p>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Нова категорія
        </Button>
      </div>

      {loading ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-6" /><TableHead className="w-10" /><TableHead className="w-10" />
              <TableHead>Назва</TableHead><TableHead>Slug</TableHead><TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {[4, 8, 8, 40, 24, 8].map((w, j) => (
                  <TableCell key={j}><div className={`h-4 w-${w} bg-muted rounded animate-pulse`} /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Категорій ще немає"
          description="Створіть першу категорію для організації товарів"
          action={<Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Нова категорія</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-6"><span className="sr-only">Перетягнути</span></TableHead>
              <TableHead className="w-10"><span className="sr-only">Активна</span></TableHead>
              <TableHead className="w-10"><span className="sr-only">Фото</span></TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20"><span className="sr-only">Дії</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(cat => (
              <TableRow
                key={cat.id}
                draggable
                onDragStart={() => { dragItem.current = cat.id; }}
                onDragOver={e => { e.preventDefault(); setDragOverId(cat.id); }}
                onDragLeave={() => { if (dragOverId === cat.id) setDragOverId(null); }}
                onDragEnd={() => { dragItem.current = null; setDragOverId(null); }}
                onDrop={e => {
                  e.preventDefault();
                  if (dragItem.current && dragItem.current !== cat.id) {
                    const next = reorder(categories, dragItem.current, cat.id);
                    setCategories(next);
                    persistOrder(next);
                  }
                  dragItem.current = null;
                  setDragOverId(null);
                }}
                className={`group hover:bg-muted/40 cursor-move ${dragOverId === cat.id ? "bg-primary/5 border-t-2 border-t-primary" : ""}`}
              >
                <TableCell className="text-muted-foreground cursor-grab active:cursor-grabbing pr-0">
                  <GripVertical className="w-4 h-4" />
                </TableCell>
                <TableCell>
                  <Switch checked={cat.is_active} onCheckedChange={() => handleToggle(cat)} aria-label={`Активна: ${cat.name}`} />
                </TableCell>
                <TableCell>
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-7 h-7 rounded object-contain bg-muted" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="cursor-pointer font-medium text-sm" onClick={() => openEdit(cat)}>
                  {cat.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">/{cat.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CategoryDialog
        key={editingCategory?.id ?? "new"}
        category={editingCategory}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingCategory(undefined); }}
        onSaved={() => { onRefresh(); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити категорію?</AlertDialogTitle>
            <AlertDialogDescription>
              Категорія «{deleteTarget?.name}» буде видалена. Товари залишаться без категорії.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
