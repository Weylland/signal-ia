"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Actions par message : marquer lu (si non lu) + supprimer (avec confirmation inline).
export function MessageActions({ id, unread }: { id: number; unread: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function markRead() {
    setBusy(true);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function del() {
    setBusy(true);
    await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      {unread && (
        <button
          className="btn btn-sm btn-g"
          disabled={busy}
          onClick={markRead}
          style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}
        >
          Marquer lu
        </button>
      )}
      {confirmDel ? (
        <span style={{ display: "inline-flex", gap: "var(--s2)", alignItems: "center" }}>
          <button
            className="btn btn-sm"
            disabled={busy}
            onClick={del}
            style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--er)", borderColor: "var(--er)" }}
          >
            {busy ? "…" : "Confirmer"}
          </button>
          <button
            className="btn btn-sm btn-g"
            onClick={() => setConfirmDel(false)}
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          className="btn btn-sm btn-g"
          onClick={() => setConfirmDel(true)}
          style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}
        >
          Supprimer
        </button>
      )}
    </>
  );
}

// Bouton d'en-tête : marque tous les messages non lus comme lus.
export function MarkAllReadButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (count === 0) return null;

  async function run() {
    setBusy(true);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="btn btn-sm btn-p" disabled={busy} onClick={run}>
      {busy ? "…" : `Tout marquer lu (${count})`}
    </button>
  );
}
