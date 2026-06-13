import { getGlossary } from "@/lib/glossary";
import { GlossaryManager } from "@/components/admin/GlossaryManager";

export const dynamic = "force-dynamic";

export default function AdminGlossairePage() {
  const entries = getGlossary();
  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-bold">Glossaire</h1>
        <span className="meta uppercase">{entries.length} termes</span>
      </div>
      <GlossaryManager entries={entries} />
    </div>
  );
}
