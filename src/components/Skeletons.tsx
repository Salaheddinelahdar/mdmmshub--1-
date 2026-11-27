export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading leaderboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-44 rounded-xl bg-(color:--c-surface) border border-(color:--c-ink)/[0.10] p-6 animate-pulse flex flex-col justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-(color:--c-ink)/[0.045]" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-28 rounded bg-(color:--c-ink)/[0.045]" />
                <div className="h-3 w-20 rounded bg-(color:--c-ink)/[0.045]" />
              </div>
            </div>
            <div className="h-8 w-24 rounded bg-(color:--c-ink)/[0.045]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-(color:--c-surface) border border-(color:--c-ink)/[0.10] divide-y divide-(color:--c-ink)/[0.10]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-6 w-8 rounded bg-(color:--c-ink)/[0.045]" />
              <div className="h-12 w-12 rounded-full bg-(color:--c-ink)/[0.045]" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-(color:--c-ink)/[0.045]" />
                <div className="h-3 w-24 rounded bg-(color:--c-ink)/[0.045]" />
              </div>
            </div>
            <div className="h-6 w-20 rounded bg-(color:--c-ink)/[0.045]" />
          </div>
        ))}
      </div>
    </div>
  );
}
