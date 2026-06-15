import type { ReactNode } from "react";

/** En-tête de page (bande sombre pleine largeur, h1 + sous-titre). */
export function PageHeader({
  title,
  subtitle,
  kicker,
  narrow = false,
  right,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  kicker?: string;
  narrow?: boolean;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      className="fullbleed band-deep"
      style={{ padding: "var(--s7) 0", borderBottom: "1px solid var(--ln)" }}
    >
      <div className={narrow ? "wrap-n" : "wrap"}>
        {right ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Heading title={title} subtitle={subtitle} kicker={kicker} />
            </div>
            <div>{right}</div>
          </div>
        ) : (
          <Heading title={title} subtitle={subtitle} kicker={kicker} />
        )}
        {children}
      </div>
    </section>
  );
}

function Heading({
  title,
  subtitle,
  kicker,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  kicker?: string;
}) {
  return (
    <>
      {kicker && (
        <span
          className="mb-5 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ac)]"
          style={{ border: "1px solid var(--ac)", padding: "3px 10px" }}
        >
          {kicker}
        </span>
      )}
      <h1 className="mb-2 text-[clamp(28px,4vw,42px)] font-bold leading-[1.1] tracking-[-0.025em]">
        {title}
      </h1>
      {subtitle && <p className="font-serif text-[16px] text-[var(--ink-d)]">{subtitle}</p>}
    </>
  );
}

/** Bande de contenu pleine largeur (padding 96px). */
export function PageBand({
  narrow = false,
  children,
}: {
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="fullbleed band">
      <div className={narrow ? "wrap-n" : "wrap"}>{children}</div>
    </section>
  );
}
