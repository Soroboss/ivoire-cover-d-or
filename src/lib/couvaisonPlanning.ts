import { addDays, parseISO } from 'date-fns';
import type { TypeOeuf } from '../types';

/** Jours après la date de réception → date prévue du mirage */
export const MIRAGE_DAYS_FROM_RECEPTION = 14;

/**
 * Jours après la date de réception → date prévue d'éclosion (règle métier).
 * Caille 17j, Poule 20j, Pintade 25j, Oie/Dinde/Canard/Autre 26j
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
      return 26;
  }
}

export function computeMirageDateFromReception(dateReceptionIso: string): string {
  const base = parseISO(dateReceptionIso);
  return addDays(base, MIRAGE_DAYS_FROM_RECEPTION).toISOString();
}

export function computeEclosionDateFromReception(dateReceptionIso: string, typeOeuf: TypeOeuf): string {
  const base = parseISO(dateReceptionIso);
  return addDays(base, getEclosionDaysFromReception(typeOeuf)).toISOString();
}
