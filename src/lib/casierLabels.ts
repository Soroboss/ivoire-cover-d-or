import type { Couvaison, Machine } from '../types';

/** Libellé lisible des tiroirs/casiers pour un lot. */
export function formatEmplacementsLigne(
  emplacements: Couvaison['emplacements'] | undefined,
  machines: Machine[],
): string {
  if (!emplacements?.length) return '—';
  return emplacements
    .map((e) => {
      const m = machines.find((x) => x.id === e.machineId);
      const casier = m?.casiers?.find((c) => c.id === e.casierId);
      const nomMachine = m?.nom ?? 'Machine';
      const nomCasier = casier?.nom ?? 'Casier';
      return `${nomMachine} — ${nomCasier} (${e.quantite} œufs)`;
    })
    .join(' · ');
}
