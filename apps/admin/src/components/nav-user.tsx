"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface NavUserProps {
  user: { name: string; email: string; avatar: string };
}

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const supabase = createClient();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navigate = (path: string) => {
    if (isMobile) setOpenMobile(false);
    router.push(path);
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={isCollapsed ? "rounded-full size-8 p-0 flex items-center justify-center hover:bg-sidebar-accent transition-colors" : "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent transition-colors data-[state=open]:bg-sidebar-accent"}>
        <Avatar className={isCollapsed ? "size-8 rounded-full" : "size-8 rounded-lg"}>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className={isCollapsed ? "rounded-full bg-primary/15 text-primary text-xs font-semibold" : "rounded-lg bg-primary/15 text-primary text-xs font-semibold"}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-56" side="top" align="end" sideOffset={8}>
        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={async () => { if (isMobile) setOpenMobile(false); await handleLogout(); }}>
          <LogOut className="size-4" />
          Вийти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
