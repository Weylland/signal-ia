import Link from "next/link";

export type TickerItem = { slug: string; title: string; time: string };

export function Ticker({ items, label }: { items: TickerItem[]; label: string }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className="has-scanlines flex h-[34px] shrink-0 items-center overflow-hidden border-b"
      style={{ background: "var(--bg-d)", borderColor: "var(--ac)" }}
      role="region"
      aria-label={label}
    >
      <div
        className="flex h-full shrink-0 items-center whitespace-nowrap border-r px-4 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ background: "var(--ac)", color: "var(--on-ac)", borderColor: "var(--on-ac)" }}
      >
        {label}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="tk-t">
          {doubled.map((it, i) => (
            <Link
              key={`${it.slug}-${i}`}
              href={`/articles/${it.slug}`}
              className="whitespace-nowrap px-8 font-mono text-[12px]"
              style={{ color: "var(--ink)" }}
            >
              <b style={{ color: "var(--ac)" }}>{it.time}</b> — {it.title}
              <span className="ml-6" style={{ color: "var(--ln-h)" }}>
                ·
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
