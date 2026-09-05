import Link from "next/link";
import { login, signup } from "./actions";
import "../tracker.css";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PREVIEW_PCT = 78;
const PREVIEW_OFFSET = CIRCUMFERENCE * (1 - PREVIEW_PCT / 100);

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const message = typeof searchParams.message === "string" ? searchParams.message : null;

  return (
    <div className="tracker-root">
      <div className="login-shell">
        <div className="login-brand">
          <div>
            <div className="display login-logo">DAILY FUEL LOG</div>
            <p className="tag login-tag">track every plate, every day</p>
            <p className="login-pitch">
              Log meals in seconds, watch your macros fill in real time, and see
              exactly how today adds up against your goal.
            </p>
          </div>

          <div className="login-preview" aria-hidden="true">
            <div className="score-tile ring-tile ring-tile-hero cal">
              <div className="ring-wrap">
                <svg viewBox="0 0 100 100" className="ring-svg">
                  <circle cx="50" cy="50" r={RADIUS} className="ring-track" />
                  <circle
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    className="ring-fill"
                    style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: PREVIEW_OFFSET }}
                  />
                </svg>
                <div className="ring-center">
                  <div className="val display">1847</div>
                </div>
              </div>
              <div className="lbl">Calories</div>
              <div className="target">of 2200</div>
            </div>
            <span className="login-preview-caption">a look at your daily dashboard</span>
          </div>
        </div>

        <div className="login-card">
          <span className="name display login-card-title">Sign In</span>
          <p className="login-card-sub">or create a new account below</p>

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
            <div className="login-actions">
              <button formAction={login} className="add-btn login-submit">
                Sign in
              </button>
              <button formAction={signup} className="login-secondary">
                Sign up
              </button>
            </div>
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
