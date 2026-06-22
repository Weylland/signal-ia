// Calcul pur des créneaux de publication X — sans dépendance, partagé par le
// planificateur (x.ts) et le tableau de bord (status.ts). Aucune logique réseau ici.

// Créneaux du jour (minutes depuis minuit Paris), répartis entre la première et la
// dernière heure réglées. 1 post → au premier créneau ; N posts → espacés régulièrement.
export function computeSlots(postsPerDay: number, firstHour: number, lastHour: number): number[] {
  if (postsPerDay <= 0) return [];
  const first = firstHour * 60;
  const last = lastHour * 60;
  if (postsPerDay === 1 || last <= first) return [first];
  return Array.from({ length: postsPerDay }, (_, i) =>
    Math.round(first + ((last - first) * i) / (postsPerDay - 1))
  );
}
