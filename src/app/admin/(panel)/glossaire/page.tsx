import { getGlossary } from "@/lib/glossary";
import { GlossaryManager } from "@/components/admin/GlossaryManager";
import { GlossaryTranslateAll } from "@/components/admin/GlossaryTranslateAll";

export const dynamic = "force-dynamic";

export default function AdminGlossairePage() {
  const entries = getGlossary();
  const missingEn = entries.filter((e) => !e.definitionEnHtml).length;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Glossaire</h1>
        <span className="meta uppercase">{entries.length} termes · {missingEn} sans EN</span>
      </div>
      <div className="mb-6">
        <GlossaryTranslateAll />
      </div>
      <GlossaryManager entries={entries} />
    </div>
  );
}
