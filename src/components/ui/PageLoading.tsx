/**
 * The loading state of the pages whose header is « Back | small image | title » (a person, a studio, the staff, a franchise, a work).
 * The anime page has its own, shaped like its hero (`AnimeDetailSkeleton`). What a route shows the instant it is tapped, before its own screen exists: the page's bar and a skeleton with the
 * geometry of the real content (a header, a few rows), so the tap is seen to have been taken and nothing jumps when the
 * page arrives. A server component with no data: it is prefetched with the layout.
 */
export function PageLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} data-testid="page-loading">
      <div className="px-safe flex h-12 items-center" style={{ paddingTop: "var(--safe-top)", boxSizing: "content-box" }}>
        <div className="skeleton -ml-1 h-9 w-9 rounded-full" />
      </div>
      <div className="px-safe mt-3 flex items-center gap-4">
        <div className="skeleton aspect-[5/7] w-20 rounded-[var(--radius-poster)]" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
      <div className="px-safe mt-8 space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <div className="skeleton aspect-[5/7] w-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
