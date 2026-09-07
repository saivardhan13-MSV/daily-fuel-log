import Link from "next/link";
import { login, signup } from "./actions";
import Logomark from "@/components/tracker/Logomark";
import "../tracker.css";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const message = typeof searchParams.message === "string" ? searchParams.message : null;

  return (
    <div className="tracker-root">
      <div className="login-shell">
        <div className="login-brand">
          <div className="login-logo-row">
            <Logomark size={36} />
            <div className="display login-logo">Daily Fuel Log</div>
          </div>
          <p className="login-pitch">
            Log meals in seconds, watch your macros fill in real time, and see
            exactly how today adds up against your goal.
          </p>
          <ul className="login-macro-list" aria-hidden="true">
            <li>
              <i className="login-macro-dot" style={{ background: "var(--protein)" }} />
              Protein
            </li>
            <li>
              <i className="login-macro-dot" style={{ background: "var(--carbs)" }} />
              Carbs
            </li>
            <li>
              <i className="login-macro-dot" style={{ background: "var(--fat)" }} />
              Fat
            </li>
          </ul>
        </div>

        <div className="login-card">
          <span className="name display login-card-title">Welcome back</span>

          {error && <p className="login-banner login-banner-error">{error}</p>}
          {message && <p className="login-banner login-banner-ok">{message}</p>}

          <form className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email
              </label>
              <input id="email" name="email" type="email" required className="login-input" />
            </div>
            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="login-input"
              />
            </div>
            <button formAction={login} className="add-btn login-submit">
              Sign in
            </button>
            <button formAction={signup} className="login-secondary">
              Don&rsquo;t have an account? Sign up
            </button>
          </form>

          <p className="disclaimer-footer login-disclaimer">
            For personal tracking only — not medical or dietary advice. Consult a
            doctor or registered dietitian before making significant diet changes.
            <br />
            <Link href="/about" className="disclaimer-about-link">
              About this app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
