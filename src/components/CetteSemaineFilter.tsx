"use client";

import { useRouter, usePathname } from "next/navigation";

type DayEntry = { day: string; label: string; count: number };

export function CetteSemaineFilter({
  days,
  selected,
}: {
  days: DayEntry[];
  selected: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function pick(day: string | null) {
    const params = new URLSearchParams();
    if (day) params.set("day", day);
    router.push(`${pathname}${day ? `?${params}` : ""}`);
  }

  if (days.length <= 1) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)", marginBottom: "var(--s7)" }}>
      <button
        onClick={() => pick(null)}
        className={`btn btn-sm ${!selected ? "btn-p" : "btn-g"}`}
        style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
      >
        Tous les jours
      </button>
      {days.map((d) => (
        <button
          key={d.day}
          onClick={() => pick(d.day)}
          className={`btn btn-sm ${selected === d.day ? "btn-p" : "btn-g"}`}
          style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
        >
          {d.label}
          <span style={{ marginLeft: 5, opacity: 0.6, fontFamily: "var(--ff-m)", fontSize: 10 }}>
            {d.count}
          </span>
        </button>
      ))}
    </div>
  );
}
