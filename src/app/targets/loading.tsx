import { TopbarSkeleton, Skeleton } from "@/components/tracker/Skeleton";
import "../tracker.css";

export default function Loading() {
  return (
    <div className="tracker-root">
      <div className="app">
        <TopbarSkeleton />
        <Skeleton height={40} width={200} style={{ margin: "18px 0 8px" }} />
        <Skeleton height={18} width={320} style={{ marginBottom: 20 }} />
        <Skeleton height={150} style={{ marginBottom: 14 }} />
        <Skeleton height={340} />
      </div>
    </div>
  );
}
