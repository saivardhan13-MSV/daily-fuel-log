export default function LoginVisual() {
  return (
    <div className="login-visual" aria-hidden="true">
      <div className="login-visual-glow" />
      <div className="login-visual-spin">
        <svg viewBox="0 0 32 32" className="login-visual-mark">
          <path d="M16,16 L16,2 A14,14 0 0,1 20.3,29.3 Z" fill="var(--protein)" />
          <path d="M16,16 L20.3,29.3 A14,14 0 0,1 2.7,11.7 Z" fill="var(--carbs)" />
          <path d="M16,16 L2.7,11.7 A14,14 0 0,1 16,2 Z" fill="var(--fat)" />
          <circle cx="16" cy="16" r="6.5" fill="var(--surface)" />
        </svg>
        <div className="login-visual-tags">
          <span
            className="login-visual-tag"
            style={{ "--tag-color": "var(--protein)", top: "-6px", left: "50%", marginLeft: "-33px" } as React.CSSProperties}
          >
            Protein
          </span>
          <span
            className="login-visual-tag"
            style={{ "--tag-color": "var(--carbs)", bottom: "26px", left: "-18px" } as React.CSSProperties}
          >
            Carbs
          </span>
          <span
            className="login-visual-tag"
            style={{ "--tag-color": "var(--fat)", bottom: "26px", right: "-18px" } as React.CSSProperties}
          >
            Fat
          </span>
        </div>
      </div>
    </div>
  );
}
