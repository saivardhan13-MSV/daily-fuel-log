export function Skeleton({
  width,
  height,
  style,
  className = "",
}: {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return <div className={`skeleton ${className}`} style={{ width, height, ...style }} />;
}

export function TopbarSkeleton() {
  return (
    <div className="topbar">
      <div className="brand">
        <Skeleton width={28} height={28} style={{ borderRadius: "50%" }} />
        <Skeleton width={160} height={26} />
      </div>
      <Skeleton width={280} height={38} />
    </div>
  );
}
