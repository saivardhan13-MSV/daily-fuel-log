---
name: web-ui-checklist
description: A condensed pre-delivery checklist for web UI quality — accessibility, touch targets, responsive layout, typography/color, animation, and forms. Use when building or reviewing UI for this app.
---

# Web UI Quality Checklist

A condensed set of standards-based checks for web interface work on this project.
Distilled and rewritten from public UI/UX guidance (citing WCAG 2.2, Apple HIG,
Material Design) for relevance to a Next.js web app — not every rule from a
native-mobile checklist applies here, so this keeps only what does.

## Accessibility (check first — highest impact)
- Text contrast ≥ 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- Visible focus rings on every interactive element — never remove them
- Icon-only buttons get an `aria-label`; decorative icons get `aria-hidden="true"`
- Tab order matches visual order; every action reachable by keyboard
- Never convey meaning with color alone — pair with icon or text
- Respect `prefers-reduced-motion` — reduce or disable animation when set
- Sticky headers/overlays must not obscure the keyboard-focused element
- Form errors: inline near the field, plus a focused error summary after a failed multi-error submit

## Touch & Interaction
- Tap targets ≥ 24×24 CSS px minimum (WCAG), 44×44px is the safer practical floor
- ≥ 8px spacing between adjacent touch targets
- Visible pressed/hover feedback on every clickable element, not just cursor change
- Disable buttons during async work and show a loading state — never leave a dead click
- `cursor: pointer` on anything clickable that isn't a native button/link

## Layout & Responsive
- Mobile-first; no horizontal scroll at any width
- Consistent breakpoints (e.g. 375 / 768 / 1024 / 1440)
- 16px minimum body text on mobile (prevents iOS auto-zoom on inputs)
- 4/8px spacing scale, used consistently — not arbitrary values
- Fixed/sticky bars reserve safe padding so scrolled content never hides behind them
- Prefer `min-height: 100dvh` over `100vh` on mobile

## Typography & Color
- Body line-height 1.5–1.75; line length 60–75 characters desktop, 35–60 mobile
- Consistent type scale, not ad-hoc sizes
- Semantic color tokens (already the pattern here — CSS custom properties), never raw hex sprinkled in components
- Dark-mode contrast is verified independently, not assumed to carry over from light mode
- Tabular/monospaced figures for numbers in aligned columns (`font-variant-numeric: tabular-nums`)

## Animation
- Transform/opacity only for animated properties — never animate width/height/top/left (causes layout thrash)
- One shared duration/easing system, not a different feel per component
- Every animation should express cause-and-effect, not just decorate
- Animations must be interruptible and never block input
- A single orchestrated moment beats scattered effects everywhere — see `frontend-design` skill for when *not* to add motion

## Forms & Feedback
- Every input has a visible label — never placeholder-only
- Validate on blur, not on every keystroke
- Errors state the cause and how to fix it, not just "Invalid input"
- Destructive actions get a confirm step and visually distinct (danger-colored) styling
- Toasts don't steal focus; use `aria-live="polite"` for screen-reader announcement

## Charts & Data (relevant to /trends)
- Match chart type to data shape: trend → line, comparison → bar
- Always show a legend, positioned near the chart
- Provide tooltips/labels showing exact values on hover
- Data contrast ≥ 3:1 against background; label text ≥ 4.5:1
- Respect `prefers-reduced-motion` for chart entrance animation — data should be readable immediately either way

## Before shipping a UI change
1. Check contrast and focus rings in both light and dark (if the page supports both)
2. Test at a small mobile width and confirm no horizontal scroll
3. Tab through the new UI with keyboard only
4. Confirm animations respect reduced-motion
5. Screenshot and look at it once before calling it done
