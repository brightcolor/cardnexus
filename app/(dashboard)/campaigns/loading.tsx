import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
