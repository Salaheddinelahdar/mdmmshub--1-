import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'mdmms-theme';
const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage blocked: fall back to system */
  }
  return 'system';
}

let pref: ThemePref = typeof window === 'undefined' ? 'system' : readPref();
const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
export const resolveTheme = (p: ThemePref = pref): 'light' | 'dark' => (p === 'system' ? (systemDark() ? 'dark' : 'light') : p);

export function applyTheme() {
  const dark = resolveTheme() === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  applyTheme();
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (pref === 'system') {
      applyTheme();
      listeners.forEach((l) => l());
    }
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useTheme() {
  const p = useSyncExternalStore(subscribe, () => pref, () => 'system' as ThemePref);
  const resolved = useSyncExternalStore(subscribe, () => resolveTheme(), () => 'light' as const);
  const cycle = () => setThemePref(p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system');
  return { pref: p, resolved, cycle, setPref: setThemePref };
}
