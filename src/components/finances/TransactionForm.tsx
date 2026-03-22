import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Phone, User, X } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import type { TypeTransaction } from '../../types';
import { normalizeTelephone } from '../../lib/phoneNormalize';
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

  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [couvaisonId, setCouvaisonId] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [type, setType] = useState<TypeTransaction>('Paiement');
  const [notes, setNotes] = useState('');

  const prevClientIdRef = useRef<string | null | undefined>(undefined);

  const selectedClient = useMemo(
    () => (selectedClientId ? clients.find((c) => c.id === selectedClientId) : undefined),
    [clients, selectedClientId],
  );

  /** Clients dont le numéro correspond à la saisie (recherche progressive). */
  const matchingClients = useMemo(() => {
    const q = normalizeTelephone(phoneSearch);
    if (!q || q.length < 2) return [];
    return clients
      .filter((c) => {
        const t = normalizeTelephone(c.telephone);
        if (!t) return false;
        if (t === q) return true;
        if (t.includes(q) || q.includes(t)) return true;
        if (q.length >= 6 && (t.endsWith(q) || q.endsWith(t.slice(-Math.min(12, q.length))))) return true;
        return false;
      })
      .slice(0, 8);
  }, [phoneSearch, clients]);

  /** Correspondance exacte sur numéro normalisé → sélection auto du client. */
  useEffect(() => {
    const q = normalizeTelephone(phoneSearch);
    if (q.length < 8) return;
    const exact = clients.find((c) => normalizeTelephone(c.telephone) === q);
    if (exact && selectedClientId !== exact.id) {
      setSelectedClientId(exact.id);
      setPhoneSearch(exact.telephone);
    }
  }, [phoneSearch, clients, selectedClientId]);

  const lotsForClient = useMemo(() => {
    if (!selectedClientId) return couvaisons;
    return couvaisons.filter((c) => c.clientId === selectedClientId);
  }, [couvaisons, selectedClientId]);

  /** Quand le client choisi change : préremplir le lot le plus récent (réception). */
  useEffect(() => {
    if (prevClientIdRef.current === selectedClientId) return;
    prevClientIdRef.current = selectedClientId;

    if (!selectedClientId) {
      setCouvaisonId('');
      return;
    }
    const lots = couvaisons
      .filter((c) => c.clientId === selectedClientId)
      .sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime());
    if (lots.length > 0) {
      setCouvaisonId(lots[0].id);
    } else {
      setCouvaisonId('');
    }
  }, [selectedClientId, couvaisons]);

  const selectClient = (id: string, telephoneDisplay: string) => {
    setSelectedClientId(id);
    setPhoneSearch(telephoneDisplay);
  };

  const clearClientFilter = () => {
    setSelectedClientId(null);
    setPhoneSearch('');
    setCouvaisonId('');
    prevClientIdRef.current = undefined;
  };

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

  const showSuggestions = phoneSearch.trim().length >= 2 && matchingClients.length > 0 && !selectedClient;

  return (
    <div className="app-card mx-auto mt-4 max-w-lg p-6">
      <h2 className="mb-2 font-display text-xl font-bold text-brand-dark">Nouvelle opération</h2>
      <p className="mb-6 text-xs text-brand-muted">
        <strong>Paiement</strong> encaisse, <strong>Déduction</strong> retire de l&apos;argent déjà payé (ex. carton à
        crédit), <strong>Avoir</strong> et <strong>Remise</strong> réduisent le montant dû.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recherche client par téléphone */}
        <div className="relative">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-brand-muted">
            <Phone className="h-4 w-4 text-brand-orange" aria-hidden />
            Rechercher le client (téléphone)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="tel"
              autoComplete="tel"
              value={phoneSearch}
              onChange={(e) => {
                setPhoneSearch(e.target.value);
                if (selectedClientId) {
                  const still = clients.find((c) => c.id === selectedClientId);
                  if (still && normalizeTelephone(e.target.value) !== normalizeTelephone(still.telephone)) {
                    setSelectedClientId(null);
                  }
                }
              }}
              placeholder="Ex. 07 XX XX XX XX ou +225…"
              className="input-modern"
            />
            {selectedClient && (
              <button
                type="button"
                onClick={clearClientFilter}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-dark"
                title="Effacer le client"
                aria-label="Effacer le client"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showSuggestions && (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {matchingClients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-brand-cream"
                    onClick={() => selectClient(c.id, c.telephone)}
                  >
                    <User className="h-4 shrink-0 text-brand-orange opacity-80" />
                    <span>
                      <span className="font-semibold text-brand-dark">{c.nom}</span>
                      <span className="block text-xs text-brand-muted">{c.telephone}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedClient && (
          <div className="flex items-center gap-2 rounded-xl border border-brand-orange/25 bg-brand-cream/80 px-3 py-2.5 text-sm">
            <span className="font-medium text-brand-dark">{selectedClient.nom}</span>
            <span className="text-brand-muted">·</span>
            <span className="text-brand-gray">{selectedClient.telephone}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">Lot de couvaison</label>
          <select
            required
            value={couvaisonId}
            onChange={(e) => setCouvaisonId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/15"
          >
            <option value="">{selectedClientId ? '-- Choisir un lot --' : '-- Sélectionnez un lot (ou cherchez un client) --'}</option>
            {lotsForClient.map((c) => {
              const client = clients.find((cl) => cl.id === c.clientId);
              return (
                <option key={c.id} value={c.id}>
                  {client?.nom} — {c.nombreOeufs} {c.typeOeuf}s ({c.statut})
                </option>
              );
            })}
          </select>
          {selectedClientId && lotsForClient.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">Aucun lot pour ce client.</p>
          )}
        </div>

        {selectedCouv && (
          <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
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
            <div className="flex justify-between font-medium text-green-800">
              <span>Net encaissé :</span>
              <span>{netPaye.toLocaleString()} FCFA</span>
            </div>
            {avoirRemise > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>Avoirs + remises :</span>
                <span>{avoirRemise.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-brand-dark">
              <span>Reste à payer :</span>
              <span>{resteAPayer.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeTransaction)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:outline-none focus:ring-4 focus:ring-brand-orange/15"
            >
              <option value="Paiement">{TYPE_TX_LABEL.Paiement} (acompte / solde)</option>
              <option value="Deduction">{TYPE_TX_LABEL.Deduction}</option>
              <option value="Avoir">{TYPE_TX_LABEL.Avoir}</option>
              <option value="Remise">{TYPE_TX_LABEL.Remise}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Montant (FCFA)</label>
            <input
              required
              type="number"
              min={1}
              max={maxMontant !== undefined && maxMontant > 0 ? maxMontant : undefined}
              value={montant}
              onChange={(e) => setMontant(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="input-modern"
            />
            {maxMontant !== undefined && maxMontant > 0 && (
              <p className="mt-1 text-[10px] text-brand-muted">Max : {maxMontant.toLocaleString()} FCFA</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">Notes / motif (optionnel)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. espèces, Mobile Money, carton crédit…"
            className="input-modern"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-brand-gray hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-brand-orange px-4 py-2 font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
