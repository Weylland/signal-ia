"use client";

import { useEffect, useRef } from "react";

/**
 * Rend le corps HTML de l'article et enrichit chaque bloc de code d'un bouton
 * « Copier » en haut à droite. L'enrichissement se fait après le rendu (le HTML
 * vient de la base via dangerouslySetInnerHTML, on le post-traite côté client).
 */
export function ArticleBody({ html, copyLabel = "Copier", copiedLabel = "Copié" }: {
  html: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const blocks = Array.from(root.querySelectorAll("pre"));
    const cleanups: (() => void)[] = [];

    for (const pre of blocks) {
      if (pre.dataset.enhanced === "1") continue;
      pre.dataset.enhanced = "1";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.textContent = copyLabel;
      btn.setAttribute("aria-label", copyLabel);

      let timer: ReturnType<typeof setTimeout> | undefined;
      const flashCopied = () => {
        btn.textContent = copiedLabel;
        btn.classList.add("is-copied");
        clearTimeout(timer);
        timer = setTimeout(() => {
          btn.textContent = copyLabel;
          btn.classList.remove("is-copied");
        }, 1600);
      };
      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          flashCopied();
        } catch {
          // Repli pour les contextes non sécurisés / sans API Clipboard
          const ta = document.createElement("textarea");
          ta.value = code;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            flashCopied();
          } catch {
            /* abandon silencieux */
          }
          ta.remove();
        }
      };
      btn.addEventListener("click", onClick);
      pre.appendChild(btn);

      cleanups.push(() => {
        clearTimeout(timer);
        btn.removeEventListener("click", onClick);
        btn.remove();
        delete pre.dataset.enhanced;
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [html, copyLabel, copiedLabel]);

  return <div className="prose" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
