"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Users, MessagesSquare, ShoppingBag, Box } from "lucide-react";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Продажі",      url: "/orders",    icon: ShoppingBag,     badgeKey: "orders"   as const },
  { title: "Клієнти",      url: "/clients",   icon: Users },
  { title: "Повідомлення", url: "/messages",  icon: MessagesSquare,  badgeKey: "messages" as const },
  { title: "Каталог",      url: "/products",  icon: Box },
  { title: "Аналітика",    url: "/analytics", icon: BarChart2 },
];

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
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.url);
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
                      if (isMobile) setOpenMobile(false);
                      // Guard: if there's an unsaved new-order draft, confirm before leaving
                      const hasDraft = typeof sessionStorage !== "undefined" && !!sessionStorage.getItem("new-order-draft");
                      if (hasDraft && !isActive) {
                        e.preventDefault();
                        if (confirm("Покинути сторінку? Незбережене замовлення буде втрачено.")) {
                          sessionStorage.removeItem("new-order-draft");
                          router.push(item.url);
                        }
                      }
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
            })}
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