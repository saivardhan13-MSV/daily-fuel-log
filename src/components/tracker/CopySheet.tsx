"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round" />
    </svg>
  );
}

// Shared overlay chrome for the copy-preview flows — same backdrop/sheet
// classes as the Log Food launcher (.quickadd-backdrop/.quickadd-sheet), so
// it looks and behaves like the same system rather than a second one, while
// staying fully independent of QuickAddLauncher's own state.
export default function CopySheet({
  open,
  title,
  onClose,
  returnFocusRef,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const triggerEl = returnFocusRef.current;

    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      } else if (idx === items.length - 1 || idx === -1) {
        e.preventDefault();
        items[0].focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      triggerEl?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reduced = prefersReducedMotion();

  // Portalled to .tracker-root (not document.body) so this fixed-position
  // sheet is positioned against the real viewport instead of whichever
  // ancestor's CSS `animation` (e.g. the page's .reveal entrance animation,
  // which animates `transform`) happens to establish a new containing block
  // — while staying a descendant of .tracker-root, since every rule here
  // (.tracker-root .quickadd-sheet etc.) is scoped to that ancestor.
  // `document` is never defined during server render and always defined
  // once this client component's code runs in the browser, so this check is
  // stable per environment and carries no hydration-mismatch risk. By the
  // time this component re-renders with open=true, .tracker-root is already
  // in the DOM from the page's initial render/hydration.
  if (typeof document === "undefined") return null;
  const portalTarget = document.querySelector(".tracker-root") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="copy-backdrop"
            className="quickadd-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
          />
          <motion.div
            key="copy-sheet"
            ref={panelRef}
            className="quickadd-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reduced ? 0.001 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="quickadd-sheet-head">
              <span className="quickadd-sheet-title display">{title}</span>
              <button type="button" className="quickadd-close" aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </button>
            </div>
            <div className="quickadd-sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget,
  );
}
