"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2, Users, MessagesSquare, ShoppingBag, Box,
  Settings, ChevronRight, UserCog,
  LayoutDashboard, FileEdit, Palette, Search,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { NavUser } from "@/components/nav-user";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { toast } from "sonner";
import { CommandMenu } from "@/components/command-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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

// ── Nav structure ─────────────────────────────────────────────────────────────

interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badgeKey?: "orders" | "messages";
  children?: NavSubItem[];
}

const SALES_NAV: NavItem[] = [
  { title: "Замовлення",   url: "/orders",    icon: ShoppingBag,    badgeKey: "orders" },
  { title: "Клієнти",      url: "/clients",   icon: Users },
  { title: "Повідомлення", url: "/messages",  icon: MessagesSquare, badgeKey: "messages" },
];

const INVENTORY_NAV: NavItem[] = [
  {
    title: "Каталог товарів",
    url: "/catalog",
    icon: Palette,
    children: [
      { title: "Всі товари",     url: "/catalog?tab=products" },
      { title: "Категорії",      url: "/catalog?tab=categories" },
      { title: "Кольори та матеріали",    url: "/catalog?tab=colors" },
      { title: "Розмірна сітка",    url: "/catalog?tab=sizes" },
    ],
  },
  {
    title: "Принти та Друк",
    url: "/prints",
    icon: Box,
    children: [
      { title: "Бібліотека принтів", url: "/prints?tab=prints" },
      { title: "Технології друку",    url: "/prints?tab=types" },
      { title: "Формати друку",      url: "/prints?tab=sizes" },
    ],
  },
];

const INSIGHTS_NAV: NavItem[] = [
  { title: "Аналітика",    url: "/analytics", icon: BarChart2 },
];

const SYSTEM_NAV: NavItem[] = [
  {
    title: "Контент (CMS)",
    url: "/cms",
    icon: FileEdit,
    children: [
      { title: "Сторінки",        url: "/cms" },
      { title: "Умови та правила", url: "/cms/terms" },
      { title: "Конфіденційність", url: "/cms/privacy" },
    ],
  },
  { title: "Користувачі",  url: "/users",     icon: UserCog },
  { title: "Налаштування", url: "/settings",  icon: Settings },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  user: { name: string; email: string; avatar: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const supabase = React.useMemo(() => createClient(), []);
  const [badges, setBadges] = React.useState({ orders: 0, messages: 0 });
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);

  // Track which collapsibles are open
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    "/catalog": pathname.startsWith("/catalog"),
    "/prints": pathname.startsWith("/prints"),
    "/cms": pathname.startsWith("/cms"),
  });

  React.useEffect(() => {
    if (pathname.startsWith("/messages")) setUnreadMessages(0);
  }, [pathname]);

  React.useEffect(() => {
    let mounted = true;
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/dashboard/badges");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setBadges({ orders: Number(data?.orders || 0), messages: Number(data?.messages || 0) });
      } catch { /* noop */ }
    };

    fetchBadges();

    const channel = supabase
      .channel("admin-sidebar-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchBadges)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        if (localStorage.getItem("notif_enabled") !== "false") {
          router.push("/orders");
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: { sender?: string; sender_email?: string; body?: string; lead_id?: string } }) => {
          const msg = payload.new;
          if (msg.sender !== "client") return;
          playNotificationTone();
          if (!window.location.pathname.startsWith("/messages")) setUnreadMessages((n) => n + 1);
          if (localStorage.getItem("notif_enabled") !== "false") {
            toast.info(msg.sender_email || "Client", {
              description: msg.body || "New message",
              action: { label: "Open", onClick: () => router.push(`/messages?leadId=${msg.lead_id || ""}`) },
            });
          }
        }
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [supabase, router]);

  const handleNavClick = (url: string, isActive: boolean) => {
    if (isMobile) setOpenMobile(false);
    const hasDraft = typeof sessionStorage !== "undefined" && !!sessionStorage.getItem("new-order-draft");
    if (hasDraft && !isActive) {
      setPendingUrl(url);
      return false;
    }
    return true;
  };

  const handleConfirmLeave = () => {
    if (pendingUrl) {
      sessionStorage.removeItem("new-order-draft");
      router.push(pendingUrl);
    }
    setPendingUrl(null);
  };

  const renderSimpleItem = (item: NavItem) => {
    const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
    const count = item.badgeKey === "messages" ? unreadMessages : item.badgeKey === "orders" ? badges.orders : 0;
    const suppress =
      (item.badgeKey === "messages" && pathname.startsWith("/messages")) ||
      (item.badgeKey === "orders" && pathname.startsWith("/orders"));
    const showBadge = !!item.badgeKey && count > 0 && !suppress;

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          render={<Link href={item.url} />}
          isActive={isActive}
          tooltip={item.title}
          aria-current={isActive ? "page" : undefined}
          onClick={(e) => {
            const ok = handleNavClick(item.url, isActive);
            if (!ok) e.preventDefault();
          }}
          className="transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
        >
          <item.icon className={`transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
          <span className={isActive ? "font-medium text-foreground" : "text-muted-foreground"}>{item.title}</span>
        </SidebarMenuButton>
        {showBadge && (
          <SidebarMenuBadge className="bg-primary text-primary-foreground rounded-full text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 border-2 border-background">
            {count > 99 ? "99+" : count}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  const renderCollapsibleItem = (item: NavItem) => {
    const isGroupActive = pathname.startsWith(item.url);
    const isOpen = openGroups[item.url] ?? isGroupActive;

    return (
      <Collapsible
        key={item.title}
        open={isOpen}
        onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [item.url]: open }))}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isGroupActive}
            aria-current={isGroupActive ? "page" : undefined}
            aria-expanded={isOpen}
            onClick={() => setOpenGroups((prev) => ({ ...prev, [item.url]: !isOpen }))}
            className="transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
          >
            <item.icon className={`transition-colors ${isGroupActive ? "text-primary" : "text-muted-foreground"}`} />
            <span className={isGroupActive ? "font-medium text-foreground" : "text-muted-foreground"}>{item.title}</span>
            <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground" />
          </SidebarMenuButton>
          <CollapsibleContent className="data-[state=closed]:animate-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
            <SidebarMenuSub className="ml-4 border-l border-border/50 pl-2 mt-1 space-y-0.5">
              {item.children?.map((child) => {
                const childActive = child.url.includes("?")
                  ? pathname === child.url.split("?")[0] && (new URLSearchParams(child.url.split("?")[1])).get("tab") === (new URLSearchParams(window.location.search)).get("tab")
                  : pathname === child.url || pathname.startsWith(child.url + "/");
                return (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton
                      render={<Link href={child.url} />}
                      isActive={childActive}
                      onClick={(e) => {
                        const ok = handleNavClick(child.url, childActive);
                        if (!ok) e.preventDefault();
                      }}
                      className={`text-xs transition-colors py-1.5 ${childActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {child.title}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <>
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar/40 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/40">
        <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded active:scale-95"
              aria-label="U:DO CRAFT"
            >
              <BrandLogo className="h-6 w-auto" />
            </Link>
          )}
          <SidebarTrigger className="-mr-2 hover:bg-accent/40 transition-colors" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6 gap-8">
        {/* Search */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <CommandMenu
                trigger={
                  <SidebarMenuButton tooltip="Швидкий пошук (⌘K)" className="bg-muted/30 hover:bg-accent/40 transition-all border border-border/30 h-10 shadow-sm group">
                    <Search className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground font-medium text-xs">Швидкий пошук...</span>
                    {!isCollapsed && (
                      <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background/50 px-1.5 font-mono text-[9px] font-bold opacity-70 md:flex">
                        <span className="text-[10px]">⌘</span>K
                      </kbd>
                    )}
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Sales */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Продажі та CRM</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {SALES_NAV.map(renderSimpleItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Inventory */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Інвентар</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {INVENTORY_NAV.map((item) =>
              item.children ? renderCollapsibleItem(item) : renderSimpleItem(item)
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Insights */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Аналітика</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {INSIGHTS_NAV.map(renderSimpleItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Керування</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {SYSTEM_NAV.map((item) =>
              item.children ? renderCollapsibleItem(item) : renderSimpleItem(item)
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <AlertDialog open={!!pendingUrl} onOpenChange={(open) => { if (!open) setPendingUrl(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Покинути сторінку?</AlertDialogTitle>
          <AlertDialogDescription>
            У вас є незбережене замовлення. Якщо ви покинете сторінку, всі зміни буде втрачено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Залишитись</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Покинути
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
