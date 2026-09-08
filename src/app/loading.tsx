import { TopbarSkeleton, Skeleton } from "@/components/tracker/Skeleton";
import "./tracker.css";

export default function Loading() {
  return (
    <div className="tracker-root">
      <div className="app">
        <TopbarSkeleton />
        <Skeleton height={70} style={{ marginBottom: 24 }} />
        <Skeleton height={90} style={{ marginBottom: 24 }} />
        <Skeleton height={50} style={{ marginBottom: 24 }} />
        <Skeleton height={44} style={{ marginBottom: 10 }} />
        <Skeleton height={44} style={{ marginBottom: 10 }} />
        <Skeleton height={44} style={{ marginBottom: 24 }} />
        <Skeleton height={80} />
      </div>
    </div>
  );
}
