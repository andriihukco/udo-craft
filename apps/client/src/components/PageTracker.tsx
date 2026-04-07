"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Fire session_start once per session, then pageview
    const sessionKey = "udo_session_started";
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      track("session_start");
    }
    track("pageview");
  }, [pathname]);

  return null;
}
