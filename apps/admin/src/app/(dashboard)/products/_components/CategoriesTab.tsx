"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ImageIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { CategoryDialog } from "./CategoryDialog";
import type { Category } from "@udo-craft/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoriesTabProps {
  categories: Category[];
  onRefresh: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openCreate = () => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(undefined);
  };

  const handleSaved = () => {
    onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Категорію видалено");
      onRefresh();
    } catch {
      toast.error("Помилка видалення");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4" /> Категорії
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Групи товарів для навігації та фільтрації
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Нова категорія
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <EmptyState
          icon={Layers}
          title="Категорій ще немає"
          description="Створіть першу категорію для організації товарів"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Нова категорія
            </Button>
          }
        />
      )}

      {/* Responsive card grid: 1 → 2 → 3 columns */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              {/* Top: image + active badge */}
              <div className="flex items-start justify-between gap-3 mb-4">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-12 h-12 rounded object-contain bg-muted"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                  </div>
                )}
                <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px]">
                  {cat.is_active ? "Активна" : "Неактивна"}
                </Badge>
              </div>

              {/* Name + meta */}
              <div className="space-y-1 mb-4">
                <p className="font-semibold text-sm">{cat.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">/{cat.slug}</span>
                  <span>Сорт: {cat.sort_order}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-blue-600 bg-blue-50 hover:bg-blue-100"
                  onClick={() => openEdit(cat)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Редагувати
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive bg-red-50 hover:bg-red-100"
                  onClick={() => setDeleteTarget(cat)}
                  aria-label={`Видалити категорію ${cat.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <CategoryDialog
        key={editingCategory?.id ?? "new"}
        category={editingCategory}
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
      />

      {/* Delete confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити категорію?</AlertDialogTitle>
            <AlertDialogDescription>
              Категорія «{deleteTarget?.name}» буде видалена. Товари, прив'язані до неї, залишаться без категорії.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
