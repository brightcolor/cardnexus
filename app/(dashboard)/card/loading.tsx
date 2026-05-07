import { Skeleton } from "@/components/ui/skeleton";

export default function CardLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-9 w-44" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
