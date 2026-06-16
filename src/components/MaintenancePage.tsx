import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { splitBrand } from "@/lib/brand";

export function MaintenancePage() {
  const { siteName } = getSettings();
  const { before, after } = splitBrand(siteName);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "var(--s7)",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(0.8); }
        }
        .mnt-rss:hover { color: var(--ink) !important; }
        .mnt-admin:hover { opacity: 1 !important; }
      `}</style>

      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--ff-h)",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-.03em",
          color: "var(--ink)",
          textDecoration: "none",
          marginBottom: "var(--s9)",
        }}
      >
        {before}
        {after && <span style={{ fontStyle: "italic", color: "var(--ac)" }}>·{after}</span>}
      </Link>

      {/* Status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s6)" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--wn)",
            display: "inline-block",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--ff-m)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: ".12em",
            color: "var(--wn)",
          }}
        >
          Maintenance
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "var(--ff-h)",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700,
          letterSpacing: "-.03em",
          color: "var(--ink)",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "var(--s5)",
          maxWidth: 520,
        }}
      >
        On revient vite.
      </h1>

      {/* Body */}
      <p
        style={{
          fontFamily: "var(--ff-b)",
          fontSize: 16,
          color: "var(--ink-f)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 400,
          marginBottom: "var(--s9)",
        }}
      >
        Le site est en cours de maintenance. Merci de repasser dans quelques instants.
      </p>

      {/* Divider */}
      <div style={{ width: 40, height: 2, background: "var(--ac)", marginBottom: "var(--s9)" }} />

      {/* RSS hint */}
      <a
        href="/flux.xml"
        className="mnt-rss"
        style={{
          fontFamily: "var(--ff-m)",
          fontSize: 11,
          color: "var(--ink-f)",
          textDecoration: "none",
          letterSpacing: ".06em",
          transition: "color var(--d)",
        }}
      >
        S&apos;abonner au flux RSS ↗
      </a>

      {/* Admin access — bottom right, discreet */}
      <Link
        href="/admin"
        className="mnt-admin"
        style={{
          position: "absolute",
          bottom: "var(--s6)",
          right: "var(--s6)",
          fontFamily: "var(--ff-m)",
          fontSize: 10,
          color: "var(--ink-f)",
          textDecoration: "none",
          letterSpacing: ".06em",
          opacity: 0.4,
          transition: "opacity var(--d)",
        }}
      >
        admin ↗
      </Link>
    </div>
  );
}
