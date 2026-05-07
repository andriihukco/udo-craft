"use client";

import { useEffect } from "react";
import { sound } from "@/lib/sound";

/** Preloads the sound kit on first user interaction */
export function useSoundInit() {
  useEffect(() => {
    const init = () => {
      sound.tap(); // triggers load + plays silent tap to unlock audio context
      window.removeEventListener("pointerdown", init);
    };
    window.addEventListener("pointerdown", init, { once: true });
    return () => window.removeEventListener("pointerdown", init);
  }, []);
}
