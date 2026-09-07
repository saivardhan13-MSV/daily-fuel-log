import { TopbarSkeleton, Skeleton } from "@/components/tracker/Skeleton";
import "../tracker.css";

export default function Loading() {
  return (
    <div className="tracker-root">
      <div className="app">
        <TopbarSkeleton />
        <Skeleton height={40} width={160} style={{ margin: "18px 0 8px" }} />
        <Skeleton height={18} width={260} style={{ marginBottom: 20 }} />
        <div className="trend-stats" style={{ marginBottom: 14 }}>
          <Skeleton height={70} />
          <Skeleton height={70} />
          <Skeleton height={70} />
        </div>
        <Skeleton height={220} style={{ marginBottom: 14 }} />
        <Skeleton height={240} />
      </div>
    </div>
  );
}
