import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import type { TypeTransaction } from '../../types';
import {
  netPayeLot,
  resteLot,
  sumAvoirsRemisesLot,
  sumDeductionsLot,
  sumPaiementsLot,
  TYPE_TX_LABEL,
} from '../../lib/financeCalculations';

export const TransactionForm = ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => {
  const { couvaisons, clients, addTransaction, transactions } = useAppContext();

  const [couvaisonId, setCouvaisonId] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [type, setType] = useState<TypeTransaction>('Paiement');
  const [notes, setNotes] = useState('');

  const selectedCouv = couvaisons.find((c) => c.id === couvaisonId);
  const totalDue = selectedCouv ? selectedCouv.nombreOeufs * selectedCouv.prixUnitaire : 0;

  const brutPaye = useMemo(
    () => (couvaisonId ? sumPaiementsLot(transactions, couvaisonId) : 0),
    [transactions, couvaisonId],
  );
  const totalDeduction = useMemo(
    () => (couvaisonId ? sumDeductionsLot(transactions, couvaisonId) : 0),
    [transactions, couvaisonId],
  );
  const netPaye = useMemo(
    () => (couvaisonId ? netPayeLot(transactions, couvaisonId) : 0),
    [transactions, couvaisonId],
  );
  const avoirRemise = useMemo(
    () => (couvaisonId ? sumAvoirsRemisesLot(transactions, couvaisonId) : 0),
    [transactions, couvaisonId],
  );
  const resteAPayer = useMemo(
    () => (couvaisonId && selectedCouv ? resteLot(transactions, couvaisonId, totalDue) : 0),
    [transactions, couvaisonId, totalDue, selectedCouv],
  );

  const valMontant = typeof montant === 'number' ? montant : 0;

  const canSubmit = useMemo(() => {
    if (!selectedCouv || montant === '' || valMontant <= 0) return false;
    if (type === 'Paiement') return resteAPayer > 0 && valMontant <= resteAPayer;
    if (type === 'Deduction') return netPaye > 0 && valMontant <= netPaye;
    if (type === 'Avoir' || type === 'Remise') return resteAPayer > 0 && valMontant <= resteAPayer;
    return false;
  }, [selectedCouv, montant, valMontant, type, resteAPayer, netPaye]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouv || !canSubmit) return;

    let np = netPaye;
    let nc = avoirRemise;
    if (type === 'Paiement') np += valMontant;
    else if (type === 'Deduction') np -= valMontant;
    else if (type === 'Avoir' || type === 'Remise') nc += valMontant;

    const newReste = Math.max(0, totalDue - np - nc);

    try {
      await addTransaction({
        couvaisonId,
        clientId: selectedCouv.clientId,
        montantTotal: valMontant,
        acomptesVerses: np,
        resteAPayer: newReste,
        dateTransaction: new Date().toISOString(),
        typeTransaction: type,
        notes,
      });
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de l’enregistrement');
    }
  };

  const maxMontant =
    type === 'Deduction'
      ? netPaye
      : type === 'Paiement' || type === 'Avoir' || type === 'Remise'
        ? resteAPayer
        : undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4">
      <h2 className="text-xl font-bold text-brand-dark mb-2">Nouvelle opération</h2>
      <p className="text-xs text-brand-muted mb-6">
        <strong>Paiement</strong> encaisse, <strong>Déduction</strong> retire de l&apos;argent déjà payé (ex. carton à
        crédit), <strong>Avoir</strong> et <strong>Remise</strong> réduisent le montant dû.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">Lot de couvaison</label>
          <select
            required
            value={couvaisonId}
            onChange={(e) => setCouvaisonId(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
          >
            <option value="">-- Sélectionnez un lot --</option>
            {couvaisons.map((c) => {
              const client = clients.find((cl) => cl.id === c.clientId);
              return (
                <option key={c.id} value={c.id}>
                  {client?.nom} - {c.nombreOeufs} {c.typeOeuf}s ({c.statut})
                </option>
              );
            })}
          </select>
        </div>

        {selectedCouv && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-gray">Total prestation :</span>
              <span className="font-semibold">{totalDue.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Paiements (brut) :</span>
              <span>{brutPaye.toLocaleString()} FCFA</span>
            </div>
            {totalDeduction > 0 && (
              <div className="flex justify-between text-red-700">
                <span>Déductions sur encaisse :</span>
                <span>− {totalDeduction.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between text-green-800 font-medium">
              <span>Net encaissé :</span>
              <span>{netPaye.toLocaleString()} FCFA</span>
            </div>
            {avoirRemise > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>Avoirs + remises :</span>
                <span>{avoirRemise.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between mt-2 pt-2 border-t font-bold text-brand-dark">
              <span>Reste à payer :</span>
              <span>{resteAPayer.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeTransaction)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none bg-white"
            >
              <option value="Paiement">{TYPE_TX_LABEL.Paiement} (acompte / solde)</option>
              <option value="Deduction">{TYPE_TX_LABEL.Deduction}</option>
              <option value="Avoir">{TYPE_TX_LABEL.Avoir}</option>
              <option value="Remise">{TYPE_TX_LABEL.Remise}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Montant (FCFA)</label>
            <input
              required
              type="number"
              min={1}
              max={maxMontant !== undefined && maxMontant > 0 ? maxMontant : undefined}
              value={montant}
              onChange={(e) => setMontant(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
            />
            {maxMontant !== undefined && maxMontant > 0 && (
              <p className="text-[10px] text-brand-muted mt-1">Max : {maxMontant.toLocaleString()} FCFA</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">Notes / motif (optionnel)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. espèces, Mobile Money, carton crédit…"
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
