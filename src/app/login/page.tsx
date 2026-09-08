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
      <div className="login-page">
        <div className="login-logo-row">
          <Logomark size={30} />
          <div className="display login-logo">Daily Fuel Log</div>
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
        </div>

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

        <p className="disclaimer-footer login-disclaimer">
          For personal tracking only — not medical or dietary advice.
          <br />
          <Link href="/about" className="disclaimer-about-link">
            About this app
          </Link>
        </p>
      </div>
    </div>
  );
}
