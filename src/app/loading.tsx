import { TopbarSkeleton, Skeleton } from "@/components/tracker/Skeleton";
import "./tracker.css";

export default function Loading() {
  return (
    <div className="tracker-root">
      <div className="page-shell">
        <TopbarSkeleton />
        <div className="page-body">
          <div className="app">
            <Skeleton height={44} style={{ marginBottom: 14 }} />
            <Skeleton height={280} style={{ marginBottom: 14 }} />
            <div className="scoreboard scoreboard-secondary" style={{ marginBottom: 14 }}>
              <Skeleton height={140} />
              <Skeleton height={140} />
              <Skeleton height={140} />
            </div>
            <Skeleton height={56} style={{ marginBottom: 10 }} />
            <Skeleton height={56} style={{ marginBottom: 10 }} />
            <Skeleton height={56} style={{ marginBottom: 10 }} />
          </div>
          <aside className="sidebar">
            <Skeleton height={260} />
          </aside>
        </div>
      </div>
    </div>
  );
}
