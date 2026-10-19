'use client';

import { useSyncExternalStore } from 'react';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the end time has passed. */
  done: boolean;
}

// One shared 1-second clock for every countdown on the page.
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) timer = window.setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}
const nowSeconds = () => Math.floor(Date.now() / 1000);
// null during SSR and hydration, so server HTML never contains a clock that
// is already stale by the time it hydrates.
const serverSnapshot = () => null;

/** Live countdown to `endsAt`; null before mount or without a valid end time. */
export function useCountdown(endsAt: string | null | undefined): CountdownParts | null {
  const now = useSyncExternalStore(subscribe, nowSeconds, serverSnapshot);
  const end = endsAt ? Math.floor(new Date(endsAt).getTime() / 1000) : NaN;
  if (now === null || !Number.isFinite(end)) return null;

  const s = Math.max(0, end - now);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: s <= 0,
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
