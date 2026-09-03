"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#17171a",
        color: "#f2ede2",
        fontFamily: "-apple-system, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</div>
      <p style={{ color: "#9b9488", fontSize: 14, maxWidth: 360 }}>
        That was likely a brief hiccup — trying again usually fixes it.
      </p>
      <button
        onClick={reset}
        style={{
          background: "#e8b94a",
          border: "none",
          color: "#241c05",
          fontWeight: 700,
          padding: "10px 20px",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
