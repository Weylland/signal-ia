"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  current: string | null;
  difficulties: { value: string; label: string }[];
  allLabel: string;
};

export function TutosFilter({ current, difficulties, allLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function set(value: string | null) {
    const url = value ? `${pathname}?difficulty=${value}` : pathname;
    router.push(url);
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
