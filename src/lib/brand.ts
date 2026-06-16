/** Découpe un nom de marque sur le premier "·" pour le wordmark stylisé. */
export function splitBrand(name: string): { before: string; after: string } {
  const i = name.indexOf("·");
  if (i === -1) return { before: name, after: "" };
  return { before: name.slice(0, i), after: name.slice(i + 1) };
}
