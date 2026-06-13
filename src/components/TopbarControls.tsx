"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="cursor-pointer uppercase transition-colors hover:text-[var(--accent)]"
      title={theme === "dark" ? "Thème clair" : "Thème sombre"}
      aria-label="Changer de thème"
    >
      {theme === "dark" ? "☾ Sombre" : "☀ Clair"}
    </button>
  );
}

export function LangSwitcher({ lang }: { lang: "fr" | "en" }) {
  const router = useRouter();

  function setLang(next: "fr" | "en") {
    if (next === lang) return;
    document.cookie = `lang=${next}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
    router.refresh();
  }

  return (
    <span className="flex gap-1.5">
      <button
        onClick={() => setLang("fr")}
        className={`cursor-pointer uppercase transition-colors hover:text-[var(--accent)] ${lang === "fr" ? "text-[var(--accent)]" : ""}`}
      >
        FR
      </button>
      <span className="opacity-40">/</span>
      <button
        onClick={() => setLang("en")}
        className={`cursor-pointer uppercase transition-colors hover:text-[var(--accent)] ${lang === "en" ? "text-[var(--accent)]" : ""}`}
      >
        EN
      </button>
    </span>
  );
}
