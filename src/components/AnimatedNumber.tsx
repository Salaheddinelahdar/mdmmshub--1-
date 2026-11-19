import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  durationMs = 520,
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplay(endVal);
      prevValueRef.current = endVal;
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplay(current);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        prevValueRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  const cleanSuffix = suffix.trim();

  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="font-mono-tabular">{display.toLocaleString()}</span>
      {cleanSuffix && (
        <span className="text-[0.72em] font-sans font-medium text-slate-400">
          {cleanSuffix}
        </span>
      )}
    </span>
  );
}
