import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-(color:--c-ink)/10 bg-(color:--c-page)">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-(color:--c-muted)">
        <p className="font-display text-base text-(color:--c-ink)">
          MDMMS<span className="text-(color:--c-accent)">space</span>
        </p>
        <p className="text-center">Built for the Marketing Digital cohort, UCA</p>
        <p className="inline-flex items-center gap-1.5">
          Made with <Heart className="h-3.5 w-3.5 text-(color:--c-accent)" aria-hidden="true" /> anonymously
        </p>
      </div>
    </footer>
  );
}
