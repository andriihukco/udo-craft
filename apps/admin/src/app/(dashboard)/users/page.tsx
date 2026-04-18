"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "admin" | "manager" | "viewer";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

const ROLES: { value: Role; label: string }[] = [
  { value: "admin",   label: "Адмін" },
  { value: "manager", label: "Менеджер" },
  { value: "viewer",  label: "Перегляд" },
];

const FILTERS: { value: Role | "all"; label: string }[] = [
  { value: "all",     label: "Всі" },
  { value: "admin",   label: "Адміни" },
  { value: "manager", label: "Менеджери" },
  { value: "viewer",  label: "Перегляд" },
];

function roleLabel(role: Role) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.charAt(0).toUpperCase();
}

// ── Role picker used in both dialogs ─────────────────────────────────────────

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-lg border py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value === r.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { email: "", full_name: "", role: "viewer" as Role };

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Role | "all">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "all" ? users : users.filter((u) => u.role === filter);

  const handleInvite = async () => {
    if (!form.email) { toast.error("Введіть email"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Запрошення надіслано на ${form.email}`);
      setInviteOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editUser.full_name, role: editUser.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Оновлено");
      setEditUser(null);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Видалено");
      setDeleteUser(null);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка");
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Користувачі</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="Оновити">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setInviteOpen(true); }}>
            <UserPlus className="size-4 mr-2" />
            Запросити
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? users.length : users.filter((u) => u.role === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                filter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 text-xs", filter === f.value ? "opacity-70" : "opacity-50")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Користувач</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="hidden md:table-cell">Зареєстрований</TableHead>
                <TableHead className="hidden md:table-cell">Останній вхід</TableHead>
                <TableHead className="hidden sm:table-cell">Статус</TableHead>
                <TableHead className="w-16"><span className="sr-only">Дії</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Немає користувачів
                  </TableCell>
                </TableRow>
              )}
              {visible.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-lg shrink-0">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                          {initials(u.full_name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{roleLabel(u.role)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{fmtDate(u.last_sign_in_at)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {u.confirmed ? "Активний" : "Запрошений"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditUser({ ...u })} aria-label="Редагувати">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteUser(u)} aria-label="Видалити">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Запросити користувача</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ім&apos;я</Label>
              <Input
                placeholder="Ім'я Прізвище"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <RolePicker value={form.role} onChange={(r) => setForm((f) => ({ ...f, role: r }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Скасувати</Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Надіслати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Редагувати</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label>Ім&apos;я</Label>
                <Input
                  value={editUser.full_name}
                  onChange={(e) => setEditUser((u) => u ? { ...u, full_name: e.target.value } : u)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Роль</Label>
                <RolePicker
                  value={editUser.role}
                  onChange={(r) => setEditUser((u) => u ? { ...u, role: r } : u)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Скасувати</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити користувача?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUser?.email} буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
