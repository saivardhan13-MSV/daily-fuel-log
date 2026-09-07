import Link from "next/link";
import { signOut } from "@/app/login/actions";
import Logomark from "./Logomark";

function IconToday() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="3" width="12" height="11" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" />
      <rect x="7" y="9" width="2" height="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8.5" r="5.5" />
      <path d="M8 5.5V8.5L10.2 10" />
      <path d="M8 1v1.6" />
    </svg>
  );
}
function IconTrends() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 14V9M6.5 14V5M11 14V8M15 14V2" strokeLinecap="round" />
    </svg>
  );
}
function IconTargets() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Topbar({
  active,
  userEmail,
  streak,
}: {
  active: "tracker" | "history" | "targets" | "trends";
  userEmail?: string;
  streak?: number;
}) {
  return (
    <div className="topbar">
      <div className="brand">
        <Logomark />
        <span className="display">Daily Fuel Log</span>
        <span className="tag">track every plate, every day</span>
        {streak != null && streak > 0 && (
          <span className="streak-badge" title={`${streak} day logging streak`}>
            🔥 {streak}
          </span>
        )}
      </div>
      <div className="topbar-right">
        <div className="view-toggle">
          <Link href="/" className={active === "tracker" ? "active" : ""}>
            <IconToday />
            Today
          </Link>
          <Link href="/history" className={active === "history" ? "active" : ""}>
            <IconHistory />
            History
          </Link>
          <Link href="/trends" className={active === "trends" ? "active" : ""}>
            <IconTrends />
            Trends
          </Link>
          <Link href="/targets" className={active === "targets" ? "active" : ""}>
            <IconTargets />
            Targets
          </Link>
        </div>
        <form action={signOut} className="account-row">
          {userEmail && <span className="account-email">{userEmail}</span>}
          <button type="submit" className="signout-btn">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
