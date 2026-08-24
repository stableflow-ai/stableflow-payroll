export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,456px)]">
        <div className="h-[475px] animate-pulse rounded-[20px] bg-[#f3f3f3]" />
        <div className="h-[475px] animate-pulse rounded-[20px] bg-[#f3f3f3]" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-[356px] animate-pulse rounded-[20px] bg-[#f3f3f3]" />
        <div className="h-[356px] animate-pulse rounded-[20px] bg-[#f3f3f3]" />
        <div className="h-[356px] animate-pulse rounded-[20px] bg-[#f3f3f3]" />
      </div>
    </div>
  );
}
