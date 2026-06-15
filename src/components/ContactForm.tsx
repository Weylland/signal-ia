"use client";

import { useState } from "react";

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
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="font-mono text-[32px] text-[var(--ok)]">✓</div>
        <h2 className="text-[24px] font-bold">{labels.sent}</h2>
        <p className="font-serif text-[16px] text-[var(--ink-d)]">{labels.sentBody}</p>
        <a href="/" className="btn mt-3">
          ← {labels.back}
        </a>
      </div>
    );
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-f)]">
      {children}
    </span>
  );

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[560px] flex-col gap-4">
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
        <Label>{labels.message} *</Label>
        <textarea
          required
          maxLength={5000}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="inp resize-y font-serif leading-relaxed"
          style={{ minHeight: 140 }}
        />
      </div>

      {status === "error" && <p className="text-sm text-[var(--er)]">{labels.error}</p>}

      <button type="submit" disabled={status === "sending"} className="btn btn-p btn-lg self-start disabled:opacity-50">
        {status === "sending" ? "…" : labels.send}
      </button>
      <p className="font-mono text-[11px] text-[var(--ink-f)]">{labels.note}</p>
    </form>
  );
}
