"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GlossaryEntry } from "@/lib/glossary";

export function GlossaryManager({ entries }: { entries: GlossaryEntry[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ term: "", defFr: "", defEn: "" });
  const [newForm, setNewForm] = useState({ term: "", defFr: "", defEn: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function startEdit(entry: GlossaryEntry) {
    setEditing(entry.id);
    setForm({
      term: entry.term,
      defFr: entry.definitionHtml.replace(/<p>|<\/p>/g, ""),
      defEn: (entry.definitionEnHtml ?? "").replace(/<p>|<\/p>/g, ""),
    });
  }

  async function save(id: number) {
    setLoading(true);
    const res = await fetch("/api/admin/glossary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, term: form.term, defFr: form.defFr, defEn: form.defEn }),
    });
    setMsg(res.ok ? "Sauvegardé." : "Erreur.");
    setLoading(false);
    if (res.ok) { setEditing(null); router.refresh(); }
  }

  async function del(id: number) {
    if (!confirm("Supprimer ce terme ?")) return;
    await fetch("/api/admin/glossary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function create() {
    if (!newForm.term || !newForm.defFr) return;
    setLoading(true);
    const res = await fetch("/api/admin/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    setLoading(false);
    if (res.ok) { setNewForm({ term: "", defFr: "", defEn: "" }); router.refresh(); }
  }

  async function autoTranslate(id: number, term: string, defFr: string) {
    setLoading(true);
    const res = await fetch("/api/admin/glossary/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, term, defFr }),
    });
    if (res.ok) {
      const { defEn } = await res.json() as { defEn: string };
      setForm((f) => ({ ...f, defEn }));
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add new term */}
      <div className="nb-card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Ajouter un terme</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field sm:col-span-2" placeholder="Terme" value={newForm.term}
            onChange={(e) => setNewForm((f) => ({ ...f, term: e.target.value }))} />
          <textarea className="field" rows={2} placeholder="Définition FR"
            value={newForm.defFr} onChange={(e) => setNewForm((f) => ({ ...f, defFr: e.target.value }))} />
          <textarea className="field" rows={2} placeholder="Définition EN (optionnel)"
            value={newForm.defEn} onChange={(e) => setNewForm((f) => ({ ...f, defEn: e.target.value }))} />
        </div>
        <button onClick={create} disabled={loading || !newForm.term || !newForm.defFr}
          className="nb-btn nb-btn-primary mt-3 text-sm">
          + Ajouter
        </button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {entries.map((entry) => (
        <div key={entry.id} className="nb-card p-4">
          {editing === entry.id ? (
            <div className="flex flex-col gap-3">
              <input className="field font-display text-lg" value={form.term}
                onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="meta mb-1 block uppercase">FR</label>
                  <textarea className="field" rows={3} value={form.defFr}
                    onChange={(e) => setForm((f) => ({ ...f, defFr: e.target.value }))} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="meta uppercase">EN</label>
                    <button type="button" onClick={() => autoTranslate(entry.id, form.term, form.defFr)}
                      disabled={loading} className="meta text-xs hover:text-[var(--accent)]">
                      ✨ Traduire
                    </button>
                  </div>
                  <textarea className="field" rows={3} value={form.defEn}
                    onChange={(e) => setForm((f) => ({ ...f, defEn: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => save(entry.id)} disabled={loading}
                  className="nb-btn nb-btn-primary text-sm">Sauvegarder</button>
                <button onClick={() => setEditing(null)} className="nb-btn text-sm">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-lg">{entry.term}</h3>
                <div className="mt-1 flex gap-2">
                  <span className="nb-pill text-xs">FR ✓</span>
                  {entry.definitionEnHtml && <span className="nb-pill text-xs">EN ✓</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startEdit(entry)} className="nb-btn text-sm">Éditer</button>
                <button onClick={() => del(entry.id)} className="nb-btn bg-[var(--peach)] text-sm">✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
