import type { Transaction } from '../types';

export type TypeTransaction = Transaction['typeTransaction'];

export function netEncaisseByClient(transactions: Transaction[], clientId: string): number {
  const t = transactions.filter((x) => x.clientId === clientId);
  const p = t.filter((x) => x.typeTransaction === 'Paiement').reduce((a, x) => a + x.montantTotal, 0);
  const d = t.filter((x) => x.typeTransaction === 'Deduction').reduce((a, x) => a + x.montantTotal, 0);
  return Math.max(0, p - d);
}

export function totalAvoirRemiseByClient(transactions: Transaction[], clientId: string): number {
  return transactions
    .filter((x) => x.clientId === clientId && (x.typeTransaction === 'Avoir' || x.typeTransaction === 'Remise'))
    .reduce((a, x) => a + x.montantTotal, 0);
}

/** Somme des paiements (brut) pour un lot */
export function sumPaiementsLot(transactions: Transaction[], couvaisonId: string): number {
  return transactions
    .filter((t) => t.couvaisonId === couvaisonId && t.typeTransaction === 'Paiement')
    .reduce((a, t) => a + t.montantTotal, 0);
}

/** Somme des déductions sur l’argent déjà encaissé (récupération crédit carton, etc.) */
export function sumDeductionsLot(transactions: Transaction[], couvaisonId: string): number {
  return transactions
    .filter((t) => t.couvaisonId === couvaisonId && t.typeTransaction === 'Deduction')
    .reduce((a, t) => a + t.montantTotal, 0);
}

/** Net encaissé = paiements − déductions */
export function netPayeLot(transactions: Transaction[], couvaisonId: string): number {
  return Math.max(0, sumPaiementsLot(transactions, couvaisonId) - sumDeductionsLot(transactions, couvaisonId));
}

/** Avoirs + remises commerciales (réduction du montant dû) */
export function sumAvoirsRemisesLot(transactions: Transaction[], couvaisonId: string): number {
  return transactions
    .filter(
      (t) =>
        t.couvaisonId === couvaisonId &&
        (t.typeTransaction === 'Avoir' || t.typeTransaction === 'Remise'),
    )
    .reduce((a, t) => a + t.montantTotal, 0);
}

/** Reste à payer pour un lot */
export function resteLot(
  transactions: Transaction[],
  couvaisonId: string,
  totalDuePrestation: number,
): number {
  const np = netPayeLot(transactions, couvaisonId);
  const cr = sumAvoirsRemisesLot(transactions, couvaisonId);
  return Math.max(0, totalDuePrestation - np - cr);
}

/** Totaux globaux (page Finances) */
export function netEncaisseGlobal(transactions: Transaction[]): number {
  const p = transactions.filter((t) => t.typeTransaction === 'Paiement').reduce((a, t) => a + t.montantTotal, 0);
  const d = transactions.filter((t) => t.typeTransaction === 'Deduction').reduce((a, t) => a + t.montantTotal, 0);
  return Math.max(0, p - d);
}

export function totalAvoirsRemisesGlobal(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.typeTransaction === 'Avoir' || t.typeTransaction === 'Remise')
    .reduce((a, t) => a + t.montantTotal, 0);
}

/** Libellé affichage */
export const TYPE_TX_LABEL: Record<TypeTransaction, string> = {
  Paiement: 'Paiement',
  Avoir: 'Avoir',
  Remise: 'Remise',
  Deduction: 'Déduction sur encaisse',
};
