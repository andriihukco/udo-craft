"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2, Users, MessagesSquare, ShoppingBag, Box,
  Settings, ChevronRight, UserCog,
  LayoutDashboard, FileEdit,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { NavUser } from "@/components/nav-user";
import { createClient } from "@/lib/supabase/client";
import { playNotificationTone } from "@/lib/notifications";
import { toast } from "sonner";
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
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const MAIN_NAV: NavItem[] = [
  { title: "Дашборд",      url: "/",          icon: LayoutDashboard },
  { title: "Продажі",      url: "/orders",    icon: ShoppingBag,    badgeKey: "orders" },
  { title: "Клієнти",      url: "/clients",   icon: Users },
  { title: "Повідомлення", url: "/messages",  icon: MessagesSquare, badgeKey: "messages" },
  { title: "Аналітика",    url: "/analytics", icon: BarChart2 },
];

const CATALOG_NAV: NavItem[] = [
  {
    title: "Каталог",
    url: "/products",
    icon: Box,
    children: [
      { title: "Товари",      url: "/products" },
      { title: "Категорії",   url: "/products?tab=categories" },
      { title: "Кольори",     url: "/products?tab=materials" },
      { title: "Ціни друку",  url: "/products?tab=print_pricing" },
      { title: "Принти",      url: "/products?tab=prints" },
    ],
  },
];

const SYSTEM_NAV: NavItem[] = [
  {
    title: "CMS",
    url: "/cms",
    icon: FileEdit,
    children: [
      { title: "Сторінки",        url: "/cms" },
      { title: "Умови та правила", url: "/cms/terms" },
      { title: "Конфіденційність", url: "/cms/privacy" },
    ],
  },
  {
    title: "Користувачі",
    url: "/users",
    icon: UserCog,
  },
  {
    title: "Налаштування",
    url: "/settings",
    icon: Settings,
  },
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

  // Track which collapsibles are open
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    "/products": pathname.startsWith("/products"),
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
      if (confirm("Покинути сторінку? Незбережене замовлення буде втрачено.")) {
        sessionStorage.removeItem("new-order-draft");
        router.push(url);
      }
      return false;
    }
    return true;
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
        >
          <item.icon aria-hidden="true" />
          <span>{item.title}</span>
        </SidebarMenuButton>
        {showBadge && (
          <SidebarMenuBadge className="bg-destructive/10 text-destructive rounded-full text-[10px] font-semibold">
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
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isGroupActive}
              aria-current={isGroupActive ? "page" : undefined}
            >
              <item.icon aria-hidden="true" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((child) => {
                const childActive = child.url.includes("?")
                  ? pathname === child.url.split("?")[0]
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className={`flex items-center py-1 px-2 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="U:DO CRAFT"
            >
              <BrandLogo />
            </Link>
          )}
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel>Головне</SidebarGroupLabel>
          <SidebarMenu>
            {MAIN_NAV.map(renderSimpleItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Catalog */}
        <SidebarGroup>
          <SidebarGroupLabel>Каталог</SidebarGroupLabel>
          <SidebarMenu>
            {CATALOG_NAV.map((item) =>
              item.children ? renderCollapsibleItem(item) : renderSimpleItem(item)
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel>Система</SidebarGroupLabel>
          <SidebarMenu>
            {SYSTEM_NAV.map((item) =>
              item.children ? renderCollapsibleItem(item) : renderSimpleItem(item)
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
