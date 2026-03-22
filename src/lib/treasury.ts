import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Client, Couvaison, Transaction } from '../types';
import { TYPE_TX_LABEL } from './financeCalculations';

export type TreasuryMovement = {
  id: string;
  dateIso: string;
  reference: string;
  clientId: string;
  clientName: string;
  couvaisonId: string;
  lotLabel: string;
  typeTransaction: Transaction['typeTransaction'];
  typeLabel: string;
  /** Entrée de trésorerie effective (espèces / encaissement) */
  entreeCaisse: number;
  /** Sortie de trésorerie (déduction sur encaisse) */
  sortieCaisse: number;
  /** Avoir / remise : impact créance, pas flux caisse */
  ajustementCreance: number;
  /** Impact net sur la caisse (entrée − sortie) */
  impactCaisseNet: number;
  notes?: string;
};

function lotLabel(couvaisons: Couvaison[], couvaisonId: string): string {
  const c = couvaisons.find((x) => x.id === couvaisonId);
  if (!c) return 'Lot';
  return `${c.nombreOeufs} ${c.typeOeuf}s · ${c.statut}`;
}

export function buildTreasuryMovements(
  transactions: Transaction[],
  clients: Client[],
  couvaisons: Couvaison[],
): TreasuryMovement[] {
  const clientName = (id: string) => clients.find((c) => c.id === id)?.nom ?? '—';

  return transactions
    .map((t) => {
      const entree = t.typeTransaction === 'Paiement' ? t.montantTotal : 0;
      const sortie = t.typeTransaction === 'Deduction' ? t.montantTotal : 0;
      const ajust =
        t.typeTransaction === 'Avoir' || t.typeTransaction === 'Remise' ? t.montantTotal : 0;
      const impact = entree - sortie;

      return {
        id: t.id,
        dateIso: t.dateTransaction,
        reference: `TX-${t.id.slice(0, 8).toUpperCase()}`,
        clientId: t.clientId,
        clientName: clientName(t.clientId),
        couvaisonId: t.couvaisonId,
        lotLabel: lotLabel(couvaisons, t.couvaisonId),
        typeTransaction: t.typeTransaction,
        typeLabel: TYPE_TX_LABEL[t.typeTransaction],
        entreeCaisse: entree,
        sortieCaisse: sortie,
        ajustementCreance: ajust,
        impactCaisseNet: impact,
        notes: t.notes,
      } satisfies TreasuryMovement;
    })
    .sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());
}

/** Solde caisse cumulé avant une date (flux réels uniquement : paiements − déductions). */
export function soldeCaisseAvantDate(transactions: Transaction[], beforeIso: string): number {
  const t0 = new Date(beforeIso).getTime();
  let s = 0;
  for (const t of transactions) {
    if (new Date(t.dateTransaction).getTime() >= t0) continue;
    if (t.typeTransaction === 'Paiement') s += t.montantTotal;
    else if (t.typeTransaction === 'Deduction') s -= t.montantTotal;
  }
  return Math.max(0, s);
}

export type TreasuryLineWithBalance = TreasuryMovement & { soldeCaisseCumule: number };

export function addRunningCashBalance(
  movements: TreasuryMovement[],
  soldeInitial: number,
): TreasuryLineWithBalance[] {
  let run = soldeInitial;
  return movements.map((m) => {
    run += m.impactCaisseNet;
    return { ...m, soldeCaisseCumule: run };
  });
}

export type MonthlyAggregate = {
  moisCle: string;
  moisLabel: string;
  entrees: number;
  sorties: number;
  netCaisse: number;
  avoirsRemises: number;
  nombreOperations: number;
};

export function buildMonthlyAggregates(movements: TreasuryMovement[]): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();

  for (const m of movements) {
    const d = parseISO(m.dateIso);
    if (Number.isNaN(d.getTime())) continue;
    const moisCle = format(d, 'yyyy-MM');
    const moisLabel = format(d, 'MMMM yyyy', { locale: fr });
    const cur =
      map.get(moisCle) ??
      ({
        moisCle,
        moisLabel,
        entrees: 0,
        sorties: 0,
        netCaisse: 0,
        avoirsRemises: 0,
        nombreOperations: 0,
      } as MonthlyAggregate);

    cur.entrees += m.entreeCaisse;
    cur.sorties += m.sortieCaisse;
    cur.netCaisse += m.impactCaisseNet;
    cur.avoirsRemises += m.ajustementCreance;
    cur.nombreOperations += 1;
    map.set(moisCle, cur);
  }

  return Array.from(map.values()).sort((a, b) => a.moisCle.localeCompare(b.moisCle));
}

/** CSV avec séparateur ; et BOM UTF-8 (Excel France). */
export function toCsvSemicolon(rows: string[][]): string {
  const esc = (cell: string) => {
    const s = String(cell ?? '');
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = rows.map((r) => r.map(esc).join(';')).join('\r\n');
  return '\ufeff' + lines;
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
