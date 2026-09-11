"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SECTIONS, inferSectionForTime, type SectionKey } from "@/lib/food-db";
import type { CustomFoodRow, QuickAddSuggestion } from "@/lib/db";
import AddItemRow from "./AddItemRow";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 2.5v11M2.5 8h11" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round" />
    </svg>
  );
}

export default function QuickAddLauncher({
  date,
  customFoods,
  quickAdd,
}: {
  date: string;
  customFoods: CustomFoodRow[];
  quickAdd: Record<SectionKey, QuickAddSuggestion[]>;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionKey>(() => inferSectionForTime());
  const panelRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function openSheet(triggerEl: HTMLButtonElement | null) {
    returnFocusRef.current = triggerEl;
    setSection(inferSectionForTime());
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
  }

  // Focus trap + Escape + body scroll lock — set up once per open/close cycle.
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
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
      returnFocusRef.current?.focus();
    };
  }, [open]);

  // Focus the search field on open and whenever the section switches (the
  // embedded AddItemRow remounts on section change, taking the old input
  // with it, so focus needs re-homing each time).
  useEffect(() => {
    if (!open) return;
    const input = panelRef.current?.querySelector<HTMLInputElement>("input.food");
    input?.focus();
  }, [open, section]);

  const reduced = prefersReducedMotion();
  const sectionQuickAdd = quickAdd[section] ?? [];

  return (
    <>
      <button
        ref={desktopTriggerRef}
        type="button"
        className="quickadd-trigger quickadd-trigger-desktop"
        onClick={() => openSheet(desktopTriggerRef.current)}
      >
        <PlusIcon />
        Log food
      </button>
      <button
        ref={mobileTriggerRef}
        type="button"
        className="quickadd-trigger quickadd-trigger-mobile"
        onClick={() => openSheet(mobileTriggerRef.current)}
      >
        <PlusIcon />
        <span>Log food</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="quickadd-backdrop"
              className="quickadd-backdrop"
              onClick={closeSheet}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
            />
            <motion.div
              key="quickadd-sheet"
              ref={panelRef}
              className="quickadd-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Log food"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: reduced ? 0.001 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="quickadd-sheet-head">
                <span className="quickadd-sheet-title display">Log food</span>
                <button type="button" className="quickadd-close" aria-label="Close" onClick={closeSheet}>
                  <CloseIcon />
                </button>
              </div>

              <div className="quickadd-section-switch" role="group" aria-label="Meal section">
                {SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`quickadd-section-chip${section === s.key ? " active" : ""}`}
                    aria-pressed={section === s.key}
                    onClick={() => setSection(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="quickadd-sheet-body">
                <AddItemRow key={section} section={section} date={date} customFoods={customFoods} quickAdd={sectionQuickAdd} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
