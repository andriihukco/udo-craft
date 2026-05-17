"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Search,
  ShoppingBag,
  Users,
  MessagesSquare,
  BarChart2,
  Box,
  Palette,
  FileEdit,
  Hash,
  Loader2,
  PackageSearch,
  ArrowRight,
  FolderTree,
  UserCog,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  trigger?: React.ReactNode;
}

type SearchResult = {
  id: string;
  type: "order" | "client" | "product" | "category" | "user" | "page";
  title: string;
  subtitle?: string;
  url: string;
  actionLabel?: string;
};

const TYPE_META: Record<SearchResult["type"], { label: string; icon: React.ElementType; className: string }> = {
  order: { label: "Замовлення", icon: Hash, className: "bg-blue-50 text-blue-700 border-blue-100" },
  client: { label: "Клієнт", icon: User, className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  product: { label: "Товар", icon: PackageSearch, className: "bg-violet-50 text-violet-700 border-violet-100" },
  category: { label: "Категорія", icon: FolderTree, className: "bg-amber-50 text-amber-700 border-amber-100" },
  user: { label: "Користувач", icon: UserCog, className: "bg-slate-100 text-slate-700 border-slate-200" },
  page: { label: "Сторінка", icon: ArrowRight, className: "bg-muted text-muted-foreground border-border" },
};

export function CommandMenu({ trigger }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 180 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const groupedResults = React.useMemo(() => {
    return results.reduce<Record<SearchResult["type"], SearchResult[]>>((acc, item) => {
      acc[item.type] = [...(acc[item.type] || []), item];
      return acc;
    }, {} as Record<SearchResult["type"], SearchResult[]>);
  }, [results]);

  const renderResult = (item: SearchResult) => {
    const meta = TYPE_META[item.type];
    const Icon = meta.icon;

    return (
      <CommandItem
        key={item.id}
        value={`${item.type} ${item.title} ${item.subtitle || ""}`}
        onSelect={() => runCommand(() => router.push(item.url))}
        className="items-center gap-3 px-3 py-2.5"
      >
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", meta.className)}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{item.title}</span>
          {item.subtitle && (
            <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
          )}
        </span>
        <CommandShortcut className="text-[10px] normal-case tracking-normal">{item.actionLabel || "Open"}</CommandShortcut>
      </CommandItem>
    );
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="w-full">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent/50 hover:text-foreground"
        >
          <Search className="size-4 transition-colors" />
          <span className="hidden md:inline-block">Швидкий пошук...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="border-b border-border/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Швидкий пошук</p>
              <p className="text-xs text-muted-foreground">Замовлення, клієнти, товари, користувачі</p>
            </div>
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Номер замовлення, ім'я, email, товар..."
          />
        </div>
        <CommandList className="max-h-[420px] p-2">
          <CommandEmpty>{loading ? "Шукаємо..." : "Нічого не знайдено."}</CommandEmpty>
          {(["order", "client", "product", "category", "user", "page"] as const).map((type, index) => {
            const items = groupedResults[type] || [];
            if (!items.length) return null;
            return (
              <React.Fragment key={type}>
                {index > 0 && <CommandSeparator className="my-1" />}
                <CommandGroup heading={TYPE_META[type].label}>
                  {items.map(renderResult)}
                </CommandGroup>
              </React.Fragment>
            );
          })}
          {!query && (
            <>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Швидкі дії">
                <CommandItem onSelect={() => runCommand(() => router.push("/orders/new"))}>
                  <ShoppingBag className="mr-2 size-4" />
                  <span>Створити замовлення</span>
                  <CommandShortcut>New</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/clients"))}>
                  <Users className="mr-2 size-4" />
                  <span>Відкрити клієнтів</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/messages"))}>
                  <MessagesSquare className="mr-2 size-4" />
                  <span>Відкрити повідомлення</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
                  <BarChart2 className="mr-2 size-4" />
                  <span>Переглянути аналітику</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/catalog?tab=products"))}>
                  <Box className="mr-2 size-4" />
                  <span>Каталог товарів</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/prints?tab=prints"))}>
                  <Palette className="mr-2 size-4" />
                  <span>Бібліотека принтів</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                  <Settings className="mr-2 size-4" />
                  <span>Налаштування</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/cms"))}>
                  <FileEdit className="mr-2 size-4" />
                  <span>Керування контентом</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
