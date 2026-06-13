"use client";

import { useState } from "react";

type Labels = {
  name: string;
  email: string;
  message: string;
  send: string;
  sent: string;
  error: string;
};

export function ContactForm({ labels }: { labels: Labels }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="nb-card max-w-md p-6 text-sm text-[var(--ink-dim)]">{labels.sent}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="meta mb-1.5 block uppercase">{labels.name}</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="field w-full"
        />
      </div>
      <div>
        <label className="meta mb-1.5 block uppercase">{labels.email}</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="field w-full"
        />
      </div>
      <div>
        <label className="meta mb-1.5 block uppercase">{labels.message}</label>
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="field w-full resize-none"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-500">{labels.error}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="nb-btn nb-btn-primary self-start disabled:opacity-50"
      >
        {status === "sending" ? "…" : labels.send}
      </button>
    </form>
  );
}
