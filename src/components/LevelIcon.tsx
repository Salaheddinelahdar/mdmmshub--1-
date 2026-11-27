import { BookOpen, Crown, Flame, Sprout, Zap, type LucideIcon } from 'lucide-react';

export const LEVEL_ICONS: Record<number, LucideIcon> = {
  1: Sprout,
  2: BookOpen,
  3: Zap,
  4: Flame,
  5: Crown,
};

export function LevelIcon({ level, className = 'h-3.5 w-3.5' }: { level: number; className?: string }) {
  const Icon = LEVEL_ICONS[level] ?? Sprout;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
