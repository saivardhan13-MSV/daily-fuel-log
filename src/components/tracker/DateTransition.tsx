"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function DateTransition({ date, children }: { date: string; children: ReactNode }) {
  const [prevDate, setPrevDate] = useState(date);
  const [dir, setDir] = useState(0);

  if (date !== prevDate) {
    setDir(date > prevDate ? 1 : -1);
    setPrevDate(date);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={date}
        initial={{ opacity: 0, x: dir * 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -dir * 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
