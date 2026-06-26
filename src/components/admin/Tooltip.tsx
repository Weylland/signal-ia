"use client";
import { useState } from "react";

export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 15, height: 15, borderRadius: "50%",
          border: "1px solid var(--ink-f)",
          background: "transparent",
          color: "var(--ink-f)",
          fontSize: 9, lineHeight: 1,
          cursor: "help",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginLeft: 5, flexShrink: 0, padding: 0,
        }}
        aria-label="Info"
      >
        ?
      </button>
      {open && (
        <span style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-d)",
          border: "1px solid var(--ln)",
          padding: "6px 10px",
          borderRadius: 4,
          fontFamily: "var(--ff-m)",
          fontSize: 11,
          fontWeight: 400,
          color: "var(--ink)",
          width: 240,
          zIndex: 200,
          lineHeight: 1.55,
          pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,.4)",
          whiteSpace: "normal",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
