import { getDb } from "./db";

// Corrections de noms propres clairement mal francisés (le « The » de la marque traduit).
// Conservateur : on ne touche QUE les cas non ambigus. Ajouter une ligne pour étendre.
const FIXES: [RegExp, string][] = [
  [/\b[Ll]e Verge\b/g, "The Verge"],
  [/\b[Ll]e Information\b/g, "The Information"],
  [/\b[Ll]e Next Web\b/g, "The Next Web"],
  [/\b[Ll]e Decoder\b/g, "The Decoder"],
  [/\b[Ll]e Register\b/g, "The Register"],
];

const FIELDS = ["title", "excerpt", "content_html", "tldr", "title_en", "excerpt_en", "content_html_en", "tldr_en"] as const;

function applyFixes(value: string): { out: string; n: number } {
  let out = value;
  let n = 0;
  for (const [re, repl] of FIXES) {
    out = out.replace(re, () => { n++; return repl; });
  }
  return { out, n };
}

export function fixProperNouns(): { articlesChanged: number; replacements: number } {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, ${FIELDS.join(", ")} FROM articles`)
    .all() as Record<string, string | null>[];

  const update = db.prepare(
    `UPDATE articles SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`
  );

  let articlesChanged = 0;
  let replacements = 0;

  const run = db.transaction(() => {
    for (const row of rows) {
      let changed = false;
      const values = FIELDS.map((f) => {
        const original = row[f];
        if (typeof original !== "string" || !original) return original ?? null;
        const { out, n } = applyFixes(original);
        if (n > 0) {
          changed = true;
          replacements += n;
        }
        return out;
      });
      if (changed) {
        update.run(...values, row.id as unknown as number);
        articlesChanged++;
      }
    }
  });
  run();

  return { articlesChanged, replacements };
}
