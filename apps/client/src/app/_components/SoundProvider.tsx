"use client";

import { useSoundInit } from "@/hooks/useSoundInit";

/** Mounts the sound kit on first user interaction. Drop into the root layout. */
export function SoundProvider() {
  useSoundInit();
  return null;
}
