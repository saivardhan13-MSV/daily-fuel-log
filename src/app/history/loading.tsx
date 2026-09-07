import { TopbarSkeleton, Skeleton } from "@/components/tracker/Skeleton";
import "../tracker.css";

export default function Loading() {
  const cells = Array.from({ length: 35 });
  return (
    <div className="tracker-root">
      <div className="app">
        <TopbarSkeleton />
        <Skeleton height={32} width={220} style={{ margin: "18px auto 16px" }} />
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}
        >
          {cells.map((_, i) => (
            <Skeleton key={i} height={76} />
          ))}
        </div>
      </div>
    </div>
  );
}
