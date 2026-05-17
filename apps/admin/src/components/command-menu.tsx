"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  ShoppingBag,
  Users,
  MessagesSquare,
  BarChart2,
  Box,
  Palette,
  FileEdit,
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

interface CommandMenuProps {
  trigger?: React.ReactNode;
}

export function CommandMenu({ trigger }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
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

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="w-full">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border/50 rounded-lg hover:bg-accent/50 hover:text-foreground transition-all group shrink-0"
        >
          <Search className="size-4 group-hover:text-primary transition-colors" />
          <span className="hidden md:inline-block">Швидкий пошук...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Що ви шукаєте?" />
        <CommandList>
          <CommandEmpty>Результатів не знайдено.</CommandEmpty>
          <CommandGroup heading="Навігація">
            <CommandItem onSelect={() => runCommand(() => router.push("/orders"))}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Замовлення</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/clients"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Клієнти</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/messages"))}>
              <MessagesSquare className="mr-2 h-4 w-4" />
              <span>Повідомлення</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
              <BarChart2 className="mr-2 h-4 w-4" />
              <span>Аналітика</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Каталог">
            <CommandItem onSelect={() => runCommand(() => router.push("/catalog?tab=products"))}>
              <Box className="mr-2 h-4 w-4" />
              <span>Всі товари</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/prints?tab=prints"))}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Бібліотека принтів</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Система">
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Налаштування</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/cms"))}>
              <FileEdit className="mr-2 h-4 w-4" />
              <span>Керування контентом</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

