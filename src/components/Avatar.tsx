import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const PALETTES = [
  'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
  'bg-sky-500/20 text-sky-200 border-sky-400/30',
  'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  'bg-violet-500/20 text-violet-200 border-violet-400/30',
  'bg-amber-500/20 text-amber-200 border-amber-400/30',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const sizeCls = SIZE_CLASSES[size];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${name} profile photo`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeCls} rounded-full object-cover border border-white/10 shrink-0 bg-slate-800 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={`${name} avatar`}
      className={`${sizeCls} ${getPalette(name)} rounded-full border flex items-center justify-center font-display font-semibold tracking-tight shrink-0 select-none ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
