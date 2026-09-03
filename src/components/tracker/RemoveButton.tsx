"use client";

import { useTransition } from "react";
import { removeEntry } from "@/app/actions/entries";

export default function RemoveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="rm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void removeEntry(id);
        })
      }
      aria-label="Remove item"
    >
      &times;
    </button>
  );
}
