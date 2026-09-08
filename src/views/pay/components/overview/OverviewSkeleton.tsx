export function AdminOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading overview">
      <div className="h-[148px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.54fr]">
        <div className="min-h-[540px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
        <div className="min-h-[540px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
      </div>
    </div>
  );
}

export function EmployeeOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading overview">
      <div className="h-8 w-48 animate-pulse rounded-[12px] bg-[#e8e8e8]" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="h-[110px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
        <div className="h-[110px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-h-[454px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
        <div className="min-h-[454px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
      </div>
      <div className="h-[280px] animate-pulse rounded-[20px] bg-[#e8e8e8]" />
    </div>
  );
}
