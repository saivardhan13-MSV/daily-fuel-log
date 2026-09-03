"use client";

import { useState, type ReactNode } from "react";

export default function SectionAccordion({
  defaultOpen,
  headerLeft,
  headerRight,
  children,
}: {
  defaultOpen: boolean;
  headerLeft: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        className="section-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="shead-left">{headerLeft}</span>
        <span className="shead-right">
          {headerRight}
          <span className={`chevron${open ? " open" : ""}`} aria-hidden="true">
            ▾
          </span>
        </span>
      </button>
      {open && children}
    </>
  );
}
