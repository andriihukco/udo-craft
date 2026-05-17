"use client";

import React from "react";
import { CommandMenu } from "@/components/command-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalTopBar() {
  const { isMobile } = useSidebar();

  return (
    <div className="hidden md:flex h-16 items-center px-8 border-b border-border/40 glass sticky top-0 z-40">
      <div className="flex-1" />
      {/* Search and actions could be added here if needed, but per previous request they are in the sidebar. */}
    </div>
  );
}
