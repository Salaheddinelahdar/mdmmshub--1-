export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading leaderboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-44 rounded-2xl bg-[#11182E]/70 border border-white/[0.08] p-6 animate-pulse flex flex-col justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/[0.06]" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-28 rounded bg-white/[0.08]" />
                <div className="h-3 w-20 rounded bg-white/[0.05]" />
              </div>
            </div>
            <div className="h-8 w-24 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#11182E]/70 border border-white/[0.08] divide-y divide-white/[0.06]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-6 w-8 rounded bg-white/[0.07]" />
              <div className="h-12 w-12 rounded-full bg-white/[0.06]" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-white/[0.08]" />
                <div className="h-3 w-24 rounded bg-white/[0.05]" />
              </div>
            </div>
            <div className="h-6 w-20 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>
    </div>
  );
}
