export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0F1E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 text-xs text-slate-400">
          <p className="text-center sm:text-left whitespace-nowrap">© 2026 MDMMS.space</p>
          <p className="text-center text-slate-300">
            Built for Marketing Digital Cohort — UCA
          </p>
          <p className="text-center sm:text-right whitespace-nowrap">
            Created with ❤️ anonymously
          </p>
        </div>
      </div>
    </footer>
  );
}
