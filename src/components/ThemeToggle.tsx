import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

const LABEL = { system: 'Theme: follows your device', light: 'Theme: light', dark: 'Theme: dark' } as const;

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { pref, cycle } = useTheme();
  const Icon = pref === 'system' ? Monitor : pref === 'light' ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABEL[pref]}. Tap to change.`}
      title={LABEL[pref]}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.09] transition-colors cursor-pointer ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
