/**
 * Filtre une date ISO (réception, etc.) sur un intervalle [du, au] en jour calendaire local.
 * - Les deux vides : tout passe.
 * - Seulement « du » : date >= du
 * - Seulement « au » : date <= au
 * - Les deux : du <= date <= au
 */
export function isIsoDateInRange(dateIso: string | undefined, fromYmd: string, toYmd: string): boolean {
  if (!fromYmd?.trim() && !toYmd?.trim()) return true;
  if (!dateIso) return false;
  const ymd = dateIso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const t = new Date(ymd + 'T12:00:00').getTime();
  if (Number.isNaN(t)) return false;
  if (fromYmd?.trim()) {
    const t0 = new Date(fromYmd.trim() + 'T00:00:00').getTime();
    if (t < t0) return false;
  }
  if (toYmd?.trim()) {
    const t1 = new Date(toYmd.trim() + 'T23:59:59.999').getTime();
    if (t > t1) return false;
  }
  return true;
}
