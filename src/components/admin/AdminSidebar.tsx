"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { splitBrand } from "@/lib/brand";


const NAV = [
  {
    section: "Contenu",
    items: [
      { l: "Dashboard", p: "/admin", i: "◉" },
      { l: "Articles", p: "/admin/articles", i: "◈" },
      { l: "Pipeline", p: "/admin/pipeline", i: "⊂" },
    ],
  },
  {
    section: "Audience",
    items: [
      { l: "Newsletter", p: "/admin/newsletter", i: "◎" },
      { l: "Réseaux (X)", p: "/admin/x", i: "✕" },
      { l: "Messages", p: "/admin/messages", i: "◷" },
      { l: "Analytics", p: "/admin/analytics", i: "↑" },
    ],
  },
  {
    section: "Système",
    items: [
      { l: "Tags", p: "/admin/tags", i: "#" },
      { l: "Sources RSS", p: "/admin/sources", i: "⊚" },
      { l: "Réglages", p: "/admin/reglages", i: "⚙" },
      { l: "Sauvegarde", p: "/admin/backup", i: "⊞" },
    ],
  },
];

function SidebarInner({ path, onClose, onLogout, siteName }: { path: string; onClose?: () => void; onLogout: () => void; siteName: string }) {
  const brand = splitBrand(siteName);
  return (
    <aside className="adm-side">
      {/* Logo */}
      <div
        style={{
          padding: "var(--s4) var(--s5)",
          borderBottom: "1px solid var(--ln)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--ff-h)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-.03em",
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span><span style={{ color: "var(--ac)" }}>{brand.before}</span>{brand.after && `·${brand.after}`}</span>
          <span
            style={{
              fontFamily: "var(--ff-m)",
              fontSize: 9,
              color: "var(--ink-f)",
              border: "1px solid var(--ln)",
              padding: "1px 5px",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            ADMIN
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "var(--s3) 0", overflowY: "auto" }}>
        {NAV.map((g) => (
          <div key={g.section} style={{ marginBottom: "var(--s3)" }}>
            <div
              style={{
                fontFamily: "var(--ff-m)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: ".12em",
                color: "var(--ink-f)",
                padding: "var(--s2) var(--s5)",
                marginBottom: 2,
              }}
            >
              {g.section}
            </div>
            {g.items.map((it) => {
              const on =
                path === it.p || (it.p !== "/admin" && path.startsWith(it.p));
              return (
                <Link
                  key={it.p}
                  href={it.p}
                  onClick={onClose}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s3)",
                    padding: "8px var(--s5)",
                    background: on ? "var(--bg-r)" : "none",
                    borderLeft: on ? "2px solid var(--ac)" : "2px solid transparent",
                    color: on ? "var(--ink)" : "var(--ink-d)",
                    fontFamily: "var(--ff-h)",
                    fontSize: 13,
                    fontWeight: on ? 600 : 400,
                    minHeight: 36,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ff-m)",
                      fontSize: 12,
                      color: on ? "var(--ac)" : "var(--ink-f)",
                      width: 16,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {it.i}
                  </span>
                  {it.l}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "var(--s3) var(--s5)",
          borderTop: "1px solid var(--ln)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--s2)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--ff-m)",
            fontSize: 11,
            color: "var(--ink-f)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            minHeight: 32,
          }}
        >
          ← site public
        </Link>
        <button
          onClick={onLogout}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--ff-m)",
            fontSize: 11,
            color: "var(--er)",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 6,
            minHeight: 32,
            padding: 0,
            opacity: 0.7,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
        >
          ⏻ Déconnexion
        </button>
      </div>
    </aside>
  );
}

export function AdminLayoutClient({ children, siteName = "watch·ia" }: { children: React.ReactNode; siteName?: string }) {
  const [mob, setMob] = useState(false);
  const path = usePathname() ?? "/admin";
  const router = useRouter();
  const brand = splitBrand(siteName);

  const label = (() => {
    for (const g of NAV)
      for (const it of g.items)
        if (it.p === path || (it.p !== "/admin" && path.startsWith(it.p))) return it.l;
    return "Admin";
  })();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="adm-wrap">
      {/* Mobile overlay */}
      <div
        className={`adm-over${mob ? " show" : ""}`}
        onClick={() => setMob(false)}
      />

      <SidebarInner path={path} onClose={() => setMob(false)} onLogout={handleLogout} siteName={siteName} />

      <div className="adm-main">
        {/* Top bar */}
        <header
          style={{
            height: 52,
            borderBottom: "1px solid var(--ln)",
            display: "flex",
            alignItems: "center",
            padding: "0 var(--s5)",
            gap: "var(--s4)",
            background: "var(--bg-d)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMob(true)}
            className="hd"
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            ≡
          </button>
          <div
            style={{
              flex: 1,
              fontFamily: "var(--ff-m)",
              fontSize: 12,
              color: "var(--ink-d)",
            }}
          >
            <span style={{ color: "var(--ink-f)" }}>{brand.before}{brand.after && `·${brand.after}`} /</span>{" "}
            <span style={{ color: "var(--ac)" }}>{label}</span>
          </div>
          <Link href="/admin/articles/new" className="btn btn-p btn-sm">
            + Nouvel article
          </Link>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "var(--s7)", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
