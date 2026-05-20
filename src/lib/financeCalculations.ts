import type { Transaction, Couvaison } from '../types';

export interface ClientDetailedFinance {
  totalDu: number;
  avoir: number;
  remise: number;
  netEncaisse: number;
  resteAPayer: number;
  avoirClient: number;
  verseJour: number;
}

export function getClientDetailedFinance(
  transactions: Transaction[],
  couvaisons: Couvaison[],
  clientId: string
): ClientDetailedFinance {
  const clientCouvaisons = couvaisons.filter((c) => c.clientId === clientId && c.statut !== 'Annulé');
  const clientTransactions = transactions.filter((t) => t.clientId === clientId);

  const totalDu = clientCouvaisons.reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);

  const avoir = clientTransactions
    .filter((t) => t.typeTransaction === 'Avoir')
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const remise = clientTransactions
    .filter((t) => t.typeTransaction === 'Remise')
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const paiements = clientTransactions
    .filter((t) => t.typeTransaction === 'Paiement')
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const deductions = clientTransactions
    .filter((t) => t.typeTransaction === 'Deduction')
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const dette = clientTransactions
    .filter((t) => t.typeTransaction === 'Dette')
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const netEncaisse = Math.max(0, paiements - deductions);

  // Reste = Total Dû + Dette - Net Encaissé - Avoirs - Remises
  const balanceValue = totalDu + dette - netEncaisse - avoir - remise;
  const resteAPayer = Math.max(0, balanceValue);
  const avoirClient = Math.max(0, -balanceValue);

  // Versé ce jour (basé sur la date locale de la transaction)
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const verseJour = clientTransactions
    .filter((t) => t.typeTransaction === 'Paiement' && t.dateTransaction.startsWith(today))
    .reduce((acc, t) => acc + t.montantTotal, 0);

  return {
    totalDu,
    avoir,
    remise,
    netEncaisse,
    resteAPayer,
    avoirClient,
    verseJour,
  };
}

export function getClientGlobalBalance(transactions: Transaction[], couvaisons: Couvaison[], clientId: string): number {
  const clientCouvaisons = couvaisons.filter((c) => c.clientId === clientId && c.statut !== 'Annulé');
  const totalDues = clientCouvaisons.reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);
  const t = transactions.filter((x) => x.clientId === clientId);
  const p = t.filter((x) => x.typeTransaction === 'Paiement').reduce((a, x) => a + x.montantTotal, 0);
  const d = t.filter((x) => x.typeTransaction === 'Deduction').reduce((a, x) => a + x.montantTotal, 0);
  const c = t.filter((x) => x.typeTransaction === 'Avoir' || x.typeTransaction === 'Remise').reduce((a, x) => a + x.montantTotal, 0);
  const dette = t.filter((x) => x.typeTransaction === 'Dette').reduce((a, x) => a + x.montantTotal, 0);
  return totalDues + dette - (p - d) - c;
}

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

export function totalDetteGlobal(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.typeTransaction === 'Dette')
    .reduce((a, t) => a + t.montantTotal, 0);
}

/** Libellé affichage */
export const TYPE_TX_LABEL: Record<TypeTransaction, string> = {
  Paiement: 'Paiement',
  Avoir: 'Avoir',
  Remise: 'Remise',
  Deduction: 'Déduction sur encaisse',
  Dette: 'Dette antérieure',
};
