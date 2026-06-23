"use client";

import { useEffect, useRef } from "react";

/**
 * Rend le corps HTML de l'article et habille chaque bloc de code d'une fenêtre
 * type éditeur : barre de titre (pastilles macOS) + langage détecté + bouton
 * « Copier ». Les blocs de commandes shell prennent une variante « terminal ».
 * Tout se fait après le rendu (le HTML vient de la base via dangerouslySetInnerHTML).
 */

function isShell(text: string): boolean {
  if (/^\s*(\$|>|PS>|#)\s/m.test(text)) return true;
  return /(^|\n)\s*(npm|npx|pnpm|yarn|pip3?|python3?|node|deno|bun|curl|wget|docker(?:-compose)?|ollama|git|claude|railway|vercel|psql|ssh|cd|ls|mkdir|cp|mv|rm|export|setx|sudo|apt|apt-get|brew|chmod|ant|make|sh|bash|source)\b/.test(text);
}

function detectLang(text: string, shell: boolean): string {
  if (shell) {
    if (/(^|\n)\s*(Set-|Get-|New-|Remove-|\$env:|setx)\b/.test(text)) return "PowerShell";
    return "bash";
  }
  const t = text.trim();
  if (/^[{[]/.test(t) && /[}\]]$/.test(t)) return "JSON";
  if (/(^|\n)\s*(def |import |from \S+ import|print\()/.test(text)) return "Python";
  if (/(className=|<\/?[A-Za-z][\w-]*[\s/>])/.test(text)) return "TSX";
  if (/(^|\n)\s*(const |let |function |export |=>|console\.)/.test(text)) return "JavaScript";
  if (/(^|\n)\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/i.test(text)) return "SQL";
  return "Code";
}

export function ArticleBody({ html, copyLabel = "Copier", copiedLabel = "Copié" }: {
  html: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const pres = Array.from(root.querySelectorAll("pre"));
    const wrappers: { win: HTMLElement; pre: HTMLElement }[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const pre of pres) {
      if (pre.closest(".code-window")) continue;

      const codeEl = pre.querySelector("code") ?? pre;
      const raw = (codeEl.textContent ?? "").replace(/\n$/, "");
      const shell = isShell(raw);
      const lang = detectLang(raw, shell);

      const win = document.createElement("div");
      win.className = "code-window" + (shell ? " code-window--term" : "");

      // Barre de titre
      const bar = document.createElement("div");
      bar.className = "cw-bar";
      const dots = document.createElement("div");
      dots.className = "cw-dots";
      dots.innerHTML =
        '<span class="cw-dot cw-dot--r"></span><span class="cw-dot cw-dot--y"></span><span class="cw-dot cw-dot--g"></span>';
      const label = document.createElement("span");
      label.className = "cw-label";
      label.textContent = lang;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cw-copy";
      btn.textContent = copyLabel;

      const flashCopied = () => {
        btn.textContent = copiedLabel;
        btn.classList.add("is-copied");
        const tm = setTimeout(() => {
          btn.textContent = copyLabel;
          btn.classList.remove("is-copied");
        }, 1600);
        timers.push(tm);
      };
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(raw);
          flashCopied();
        } catch {
          const ta = document.createElement("textarea");
          ta.value = raw;
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
      });
      bar.append(dots, label, btn);

      // Corps. Les lignes reviennent toujours à la ligne (aucun débordement
      // horizontal). Pour le code, chaque ligne logique est une rangée
      // [numéro][texte] : le numéro reste en haut quand le texte wrappe.
      const body = document.createElement("div");
      if (shell) {
        body.className = "cw-code cw-code--term";
        const txt = document.createElement("div");
        txt.className = "cw-txt";
        txt.textContent = raw;
        body.appendChild(txt);
      } else {
        body.className = "cw-code";
        raw.split("\n").forEach((line, i) => {
          const row = document.createElement("div");
          row.className = "cw-row";
          const ln = document.createElement("span");
          ln.className = "cw-ln";
          ln.setAttribute("aria-hidden", "true");
          ln.textContent = String(i + 1);
          const tx = document.createElement("span");
          tx.className = "cw-txt";
          tx.textContent = line;
          row.append(ln, tx);
          body.appendChild(row);
        });
      }

      pre.parentNode?.insertBefore(win, pre);
      pre.remove(); // détaché, conservé pour le nettoyage (HMR/démontage)
      win.append(bar, body);
      wrappers.push({ win, pre });
    }

    return () => {
      timers.forEach(clearTimeout);
      for (const { win, pre } of wrappers) {
        win.parentNode?.insertBefore(pre, win);
        win.remove();
      }
    };
  }, [html, copyLabel, copiedLabel]);

  return <div className="prose" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
