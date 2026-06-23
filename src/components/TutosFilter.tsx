"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  current: string | null;
  q?: string;
  difficulties: { value: string; label: string }[];
  allLabel: string;
};

export function TutosFilter({ current, q, difficulties, allLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function set(value: string | null) {
    const params = new URLSearchParams();
    if (value) params.set("difficulty", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <button
        onClick={() => set(null)}
        className={`btn btn-sm${!current ? " btn-p" : ""}`}
      >
        {allLabel}
      </button>
      {difficulties.map((d) => (
        <button
          key={d.value}
          onClick={() => set(d.value)}
          className={`btn btn-sm${current === d.value ? " btn-p" : ""}`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
