import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
