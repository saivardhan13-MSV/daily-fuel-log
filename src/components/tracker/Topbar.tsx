import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function Topbar({
  active,
  userEmail,
}: {
  active: "tracker" | "history" | "targets";
  userEmail?: string;
}) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="display">DAILY FUEL LOG</span>
        <span className="tag">track every plate, every day</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="view-toggle">
          <Link href="/" className={active === "tracker" ? "active" : ""}>
            Today
          </Link>
          <Link href="/history" className={active === "history" ? "active" : ""}>
            History
          </Link>
          <Link href="/targets" className={active === "targets" ? "active" : ""}>
            Targets
          </Link>
        </div>
        <form action={signOut} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {userEmail && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{userEmail}</span>
          )}
          <button
            type="submit"
            className="today-btn"
            style={{ padding: "9px 12px" }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
