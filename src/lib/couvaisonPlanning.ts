import { addDays, parseISO } from 'date-fns';
import type { TypeOeuf } from '../types';

/**
 * Interprète la date de réception comme jour calendaire local (midi) pour éviter
 * un décalage d’un jour (ex. `new Date('yyyy-MM-dd')` en UTC vs fuseau local).
 */
function parseReceptionCalendarBase(dateReceptionIso: string): Date {
  const ymd = dateReceptionIso.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d, 12, 0, 0, 0);
  }
  return parseISO(dateReceptionIso);
}

/** Jour de réception + 14 jours → date prévue du mirage */
export const MIRAGE_DAYS_FROM_RECEPTION = 14;

/**
 * Jours après le jour de réception → date prévue d’éclosion (règle métier) :
 * - Caille : +17
 * - Poule : +20
 * - Pintade : +25
 * - Oie, Dinde, Canard, Paon (type « Autre ») : +26
 */
export function getEclosionDaysFromReception(typeOeuf: TypeOeuf): number {
  switch (typeOeuf) {
    case 'Caille':
      return 17;
    case 'Poule':
      return 20;
    case 'Pintade':
      return 25;
    case 'Canard':
    case 'Dinde':
    case 'Oie':
      return 26;
    case 'Autre':
    default:
      // Paon / autres : même délai que Oie-Dinde-Canard
      return 26;
  }
}

export function computeMirageDateFromReception(dateReceptionIso: string): string {
  const base = parseReceptionCalendarBase(dateReceptionIso);
  return addDays(base, MIRAGE_DAYS_FROM_RECEPTION).toISOString();
}

export function computeEclosionDateFromReception(dateReceptionIso: string, typeOeuf: TypeOeuf): string {
  const base = parseReceptionCalendarBase(dateReceptionIso);
  return addDays(base, getEclosionDaysFromReception(typeOeuf)).toISOString();
}

/** Enregistre une date de réception saisie (yyyy-MM-dd) sans décalage UTC. */
export function receptionDateInputToIso(ymd: string): string {
  const ymdTrim = ymd.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymdTrim);
  if (!m) return new Date(ymd).toISOString();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d, 12, 0, 0, 0).toISOString();
}
