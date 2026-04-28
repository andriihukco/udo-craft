"use client";

// SND UI Sound Library — https://snd.dev
// Kit SND01 "sine" — clean, minimal, fits the brand
import Snd from "snd-lib";

let snd: Snd | null = null;
let loaded = false;
let loading = false;

async function getSnd(): Promise<Snd> {
  if (snd && loaded) return snd;
  if (!snd) snd = new Snd();
  if (!loading) {
    loading = true;
    await snd.load(Snd.KITS.SND01);
    loaded = true;
  }
  return snd;
}

export const sound = {
  tap: () => getSnd().then((s) => s.play(Snd.SOUNDS.TAP)).catch(() => {}),
  button: () => getSnd().then((s) => s.play(Snd.SOUNDS.BUTTON)).catch(() => {}),
  toggle: (on: boolean) =>
    getSnd()
      .then((s) => s.play(on ? Snd.SOUNDS.TOGGLE_ON : Snd.SOUNDS.TOGGLE_OFF))
      .catch(() => {}),
  select: () => getSnd().then((s) => s.play(Snd.SOUNDS.SELECT)).catch(() => {}),
  open: () => getSnd().then((s) => s.play(Snd.SOUNDS.TRANSITION_OPEN)).catch(() => {}),
  close: () => getSnd().then((s) => s.play(Snd.SOUNDS.TRANSITION_CLOSE)).catch(() => {}),
  type: () => getSnd().then((s) => s.play(Snd.SOUNDS.TYPE)).catch(() => {}),
  notification: () => getSnd().then((s) => s.play(Snd.SOUNDS.NOTIFICATION)).catch(() => {}),
  caution: () => getSnd().then((s) => s.play(Snd.SOUNDS.CAUTION)).catch(() => {}),
  celebration: () => getSnd().then((s) => s.play(Snd.SOUNDS.CELEBRATION)).catch(() => {}),
};
