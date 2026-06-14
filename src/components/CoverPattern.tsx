// Couverture SVG déterministe (motif géométrique + teinte par catégorie),
// dérivée d'une graine (slug). Sert de fallback quand un article n'a pas d'image.
// Pas d'image IA : tout est généré, cohérent avec la direction « terminal éditorial ».

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Palette restreinte, accordée au thème sombre (et lisible en clair)
const HUES = [
  "oklch(0.82 0.17 130)", // chartreuse (accent maison)
  "oklch(0.78 0.13 200)", // teal
  "oklch(0.80 0.14 60)", // ambre
  "oklch(0.75 0.15 25)", // corail
  "oklch(0.74 0.13 300)", // violet
  "oklch(0.80 0.12 240)", // bleu ciel
];

type Props = {
  seed: string;
  label?: string;
  className?: string;
};

export function CoverPattern({ seed, label, className }: Props) {
  const h = hash(seed);
  const hue = HUES[h % HUES.length];
  const variant = Math.floor(h / 7) % 4;
  const text = (label ?? seed).slice(0, 14).toUpperCase();

  return (
    <svg
      viewBox="0 0 320 180"
      role="img"
      aria-label={label ?? "Illustration"}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <rect width="320" height="180" fill="var(--bg-deep)" />

      {variant === 0 &&
        // Diagonales
        Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={-40 + i * 44}
            y={-40}
            width="14"
            height="260"
            fill={hue}
            opacity={0.16 + (i % 3) * 0.06}
            transform="rotate(20 160 90)"
          />
        ))}

      {variant === 1 &&
        // Grille de points
        Array.from({ length: 6 }).flatMap((_, r) =>
          Array.from({ length: 11 }).map((__, c) => (
            <circle
              key={`${r}-${c}`}
              cx={16 + c * 29}
              cy={18 + r * 29}
              r={(hash(seed + r + c) % 7) + 2}
              fill={hue}
              opacity={0.1 + ((r + c) % 4) * 0.05}
            />
          ))
        )}

      {variant === 2 &&
        // Cercles concentriques
        Array.from({ length: 6 }).map((_, i) => (
          <circle
            key={i}
            cx={232}
            cy={92}
            r={20 + i * 26}
            fill="none"
            stroke={hue}
            strokeWidth="6"
            opacity={0.22 - i * 0.025}
          />
        ))}

      {variant === 3 &&
        // Blocs imbriqués
        Array.from({ length: 5 }).map((_, i) => (
          <rect
            key={i}
            x={20 + i * 18}
            y={20 + i * 12}
            width={120 - i * 8}
            height={120 - i * 8}
            fill="none"
            stroke={hue}
            strokeWidth="5"
            opacity={0.3 - i * 0.04}
          />
        ))}

      <text
        x="20"
        y="158"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="26"
        fontWeight="600"
        letterSpacing="-0.5"
        fill={hue}
        opacity="0.9"
      >
        {text}
      </text>
    </svg>
  );
}
