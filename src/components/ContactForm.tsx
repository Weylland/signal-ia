"use client";

import { useState } from "react";
import Link from "next/link";

type Labels = {
  name: string;
  email: string;
  subject: string;
  message: string;
  send: string;
  sent: string;
  sentBody: string;
  error: string;
  note: string;
  back: string;
  subjects: string[];
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-f)]">
    {children}
  </span>
);

export function ContactForm({ labels }: { labels: Labels }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const message = form.subject ? `[${form.subject}] ${form.message}` : form.message;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, message, website: form.website }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="mx-auto flex max-w-[560px] flex-col items-center gap-4 py-16 text-center"
        style={{ border: "1px solid var(--ln)", background: "var(--bg-r)", borderTop: "3px solid var(--ok)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-[26px]"
          style={{ background: "color-mix(in srgb, var(--ok) 14%, transparent)", color: "var(--ok)" }}
        >
          ✓
        </div>
        <h2 className="font-display text-[24px] font-bold">{labels.sent}</h2>
        <p className="max-w-[360px] font-serif text-[15px] leading-relaxed text-[var(--ink-d)]">{labels.sentBody}</p>
        <Link href="/" className="btn btn-g mt-2 font-mono text-[12px]">
          ← {labels.back}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-[560px] flex-col gap-5 p-6 max-sm:p-5"
      style={{ border: "1px solid var(--ln)", background: "var(--bg-r)", borderTop: "3px solid var(--ac)" }}
    >
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>
          Ne pas remplir
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label>{labels.name} *</Label>
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="inp"
            placeholder="Jane Doe"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{labels.email} *</Label>
          <input
            type="email"
            required
            maxLength={254}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="inp"
            placeholder="jane@exemple.fr"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{labels.subject}</Label>
        <select
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="inp"
        >
          <option value="">—</option>
          {labels.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>{labels.message} *</Label>
          <span className="font-mono text-[10px] text-[var(--ink-f)]">{form.message.length}/5000</span>
        </div>
        <textarea
          required
          maxLength={5000}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="inp resize-y font-serif leading-relaxed"
          style={{ minHeight: 150 }}
          placeholder="…"
        />
      </div>

      {status === "error" && (
        <p
          className="font-mono text-[12px]"
          style={{ color: "var(--er)", border: "1px solid var(--er)", padding: "8px 12px" }}
        >
          {labels.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ln)] pt-4">
        <p className="max-w-[300px] font-mono text-[10px] leading-relaxed text-[var(--ink-f)]">{labels.note}</p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn btn-p btn-lg disabled:opacity-50"
        >
          {status === "sending" ? "…" : labels.send + " →"}
        </button>
      </div>
    </form>
  );
}
