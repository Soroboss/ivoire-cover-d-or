import {
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Couvaison, Transaction, TypeOeuf } from '../types';

export type Granularity = 'week' | 'month' | 'year';

function startOfBucket(date: Date, g: Granularity): Date {
  if (g === 'week') return startOfWeek(date, { weekStartsOn: 1 });
  if (g === 'month') return startOfMonth(date);
  return startOfYear(date);
}

/** Clé stable pour tri chronologique */
export function bucketKey(date: Date, g: Granularity): string {
  const s = startOfBucket(date, g);
  if (g === 'week') {
    const y = getISOWeekYear(s);
    const w = getISOWeek(s);
    return `${y}-W${String(w).padStart(2, '0')}`;
  }
  if (g === 'month') return format(s, 'yyyy-MM');
  return format(s, 'yyyy');
}

export function bucketLabel(date: Date, g: Granularity): string {
  if (g === 'week') {
    const y = getISOWeekYear(date);
    const w = getISOWeek(date);
    return `S${w} ${y}`;
  }
  if (g === 'month') return format(date, 'MMM yyyy', { locale: fr });
  return format(date, 'yyyy');
}

export interface EclosionRatePoint {
  key: string;
  label: string;
  rate: number;
  oeufs: number;
  poussins: number;
}

/**
 * Taux d'éclosion pondéré par période (lots terminés), basé sur la date d'éclosion prévue.
 */
export function buildEclosionRateSeries(
  couvaisons: Couvaison[],
  g: Granularity,
): EclosionRatePoint[] {
  const completed = couvaisons.filter((c) => c.statut === 'Terminé' && c.nombreOeufs > 0);
  const map = new Map<string, { oeufs: number; poussins: number; label: string }>();

  for (const c of completed) {
    const raw = c.dateEclosionPrevue || c.dateReception;
    if (!raw) continue;
    const d = parseISO(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = bucketKey(d, g);
    const label = bucketLabel(d, g);
    const cur = map.get(key) || { oeufs: 0, poussins: 0, label };
    cur.oeufs += c.nombreOeufs;
    cur.poussins += c.poussinsNes ?? 0;
    cur.label = label;
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: v.label,
      oeufs: v.oeufs,
      poussins: v.poussins,
      rate: v.oeufs > 0 ? Math.round((v.poussins / v.oeufs) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Une ligne pour graphique empilé % : chaque type = part des œufs (lots) sur la période */
export type EggTypeShareRow = {
  key: string;
  label: string;
  name: string;
} & Partial<Record<TypeOeuf, number>>;

const ALL_TYPES: TypeOeuf[] = ['Poule', 'Canard', 'Dinde', 'Caille', 'Pintade', 'Oie', 'Autre'];

export function buildEggTypePercentByPeriod(
  couvaisons: Couvaison[],
  g: Granularity,
): { rows: EggTypeShareRow[]; types: TypeOeuf[] } {
  const map = new Map<string, { label: string; byType: Record<string, number> }>();

  for (const c of couvaisons) {
    if (!c.dateReception) continue;
    const d = parseISO(c.dateReception);
    if (Number.isNaN(d.getTime())) continue;
    const key = bucketKey(d, g);
    const label = bucketLabel(d, g);
    const cur = map.get(key) || { label, byType: {} };
    cur.label = label;
    cur.byType[c.typeOeuf] = (cur.byType[c.typeOeuf] || 0) + c.nombreOeufs;
    map.set(key, cur);
  }

  const typesSet = new Set<TypeOeuf>();
  couvaisons.forEach((c) => typesSet.add(c.typeOeuf));
  let types = ALL_TYPES.filter((t) => typesSet.has(t));
  if (types.length === 0 && typesSet.size > 0) {
    types = Array.from(typesSet);
  }

  const rows: EggTypeShareRow[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const total = Object.values(v.byType).reduce((s, n) => s + n, 0);
      const row: EggTypeShareRow = {
        key,
        label: v.label,
        name: v.label,
      };
      for (const t of types) {
        const n = v.byType[t] || 0;
        row[t] = total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
      }
      return row;
    });

  return { rows, types };
}

/** Net encaissé par mois (paiements − déductions sur encaisse) */
export function buildMonthlyPaymentSeries(transactions: Transaction[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.typeTransaction !== 'Paiement' && t.typeTransaction !== 'Deduction') continue;
    const d = parseISO(t.dateTransaction);
    if (Number.isNaN(d.getTime())) continue;
    const m = format(d, 'yyyy-MM');
    const delta = t.typeTransaction === 'Paiement' ? t.montantTotal : -t.montantTotal;
    map.set(m, (map.get(m) || 0) + delta);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      name: format(parseISO(`${k}-01`), 'MMM yyyy', { locale: fr }),
      value: v,
    }));
}

/** Dépenses cumulées par mois */
export function buildMonthlyExpenseSeries(depenses: any[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const d of depenses) {
    const date = parseISO(d.dateDepense);
    if (Number.isNaN(date.getTime())) continue;
    const m = format(date, 'yyyy-MM');
    map.set(m, (map.get(m) || 0) + d.montant);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      name: format(parseISO(`${k}-01`), 'MMM yyyy', { locale: fr }),
      value: v,
    }));
}

/** Comparaison Recettes vs Dépenses par mois */
export function buildComparisonSeries(transactions: Transaction[], depenses: any[]): { name: string; recettes: number; depenses: number; net: number }[] {
  const revenueMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.typeTransaction !== 'Paiement' && t.typeTransaction !== 'Deduction') continue;
    const d = parseISO(t.dateTransaction);
    if (Number.isNaN(d.getTime())) continue;
    const m = format(d, 'yyyy-MM');
    const delta = t.typeTransaction === 'Paiement' ? t.montantTotal : -t.montantTotal;
    revenueMap.set(m, (revenueMap.get(m) || 0) + delta);
  }

  const expenseMap = new Map<string, number>();
  for (const de of depenses) {
    const date = parseISO(de.dateDepense);
    if (Number.isNaN(date.getTime())) continue;
    const m = format(date, 'yyyy-MM');
    expenseMap.set(m, (expenseMap.get(m) || 0) + de.montant);
  }

  const allMonths = new Set([...revenueMap.keys(), ...expenseMap.keys()]);
  return Array.from(allMonths)
    .sort()
    .map((m) => {
      const rec = revenueMap.get(m) || 0;
      const dep = expenseMap.get(m) || 0;
      return {
        name: format(parseISO(`${m}-01`), 'MMM yyyy', { locale: fr }),
        recettes: rec,
        depenses: dep,
        net: rec - dep,
      };
    });
}

/** Stats client : lots terminés, taux global */
export function clientEclosionSummary(couvaisons: Couvaison[]) {
  const done = couvaisons.filter((c) => c.statut === 'Terminé' && c.nombreOeufs > 0);
  const oeufs = done.reduce((s, c) => s + c.nombreOeufs, 0);
  const poussins = done.reduce((s, c) => s + (c.poussinsNes ?? 0), 0);
  return {
    lotsTermines: done.length,
    oeufs,
    poussins,
    taux: oeufs > 0 ? Math.round((poussins / oeufs) * 1000) / 10 : 0,
  };
}
