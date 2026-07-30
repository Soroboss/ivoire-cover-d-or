import React, { useEffect, useMemo, useState } from 'react';
import { Phone, User, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import type { TypeTransaction } from '../../types';
import { normalizeTelephone } from '../../lib/phoneNormalize';
import {
  netPayeLot,
  resteLot,
} from '../../lib/financeCalculations';
import { format, parseISO } from 'date-fns';
import { ClientStatsSummary } from './ClientStatsSummary';
import { ClientEditModal } from '../clients/ClientEditModal';
import { openWhatsApp } from '../../lib/whatsappTemplates';

interface LotInfo {
  id: string;
  clientId: string;
  nombreOeufs: number;
  prixUnitaire: number;
  dateReception: string;
  statut: string;
  totalDue: number;
  netEncashed: number;
  avoirs: number;
  remises: number;
  balance: number;
  typeOeuf: string;
}

export const TransactionForm = ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => {
  const { couvaisons, clients, addTransaction, transactions } = useAppContext();

  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [montant, setMontant] = useState<number | ''>('');
  const [type, setType] = useState<TypeTransaction>('Paiement');
  const [notes, setNotes] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  /** Détails financiers de tous les lots du client sélectionné. */
  const clientLotsWithInfo: LotInfo[] = useMemo(() => {
    if (!selectedClientId) return [];
    const lots = couvaisons
      .filter((c) => c.clientId === selectedClientId)
      .map((c) => {
        const totalDue = c.nombreOeufs * c.prixUnitaire;
        const netEncashed = netPayeLot(transactions, c.id);
        const avoirs = transactions.filter(t => t.couvaisonId === c.id && t.typeTransaction === 'Avoir').reduce((s,t) => s + t.montantTotal, 0);
        const remises = transactions.filter(t => t.couvaisonId === c.id && t.typeTransaction === 'Remise').reduce((s,t) => s + t.montantTotal, 0);
        const balance = resteLot(transactions, c.id, totalDue);
        return { 
          id: c.id,
          clientId: c.clientId,
          nombreOeufs: c.nombreOeufs,
          prixUnitaire: c.prixUnitaire,
          dateReception: c.dateReception,
          statut: c.statut,
          typeOeuf: c.typeOeuf,
          totalDue, 
          netEncashed, 
          avoirs,
          remises,
          balance 
        };
      });

    // Pseudo-lot for Dettes antérieures
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const clientDummyTxs = transactions.filter(t => t.clientId === selectedClientId && t.couvaisonId === dummyId);
    const detteTotale = clientDummyTxs.filter(t => t.typeTransaction === 'Dette').reduce((s, t) => s + t.montantTotal, 0);
    
    if (detteTotale > 0) {
      const paimentsDette = clientDummyTxs.filter(t => t.typeTransaction === 'Paiement').reduce((s, t) => s + t.montantTotal, 0);
      const deductionsDette = clientDummyTxs.filter(t => t.typeTransaction === 'Deduction').reduce((s, t) => s + t.montantTotal, 0);
      const avoirsDette = clientDummyTxs.filter(t => t.typeTransaction === 'Avoir').reduce((s, t) => s + t.montantTotal, 0);
      const remisesDette = clientDummyTxs.filter(t => t.typeTransaction === 'Remise').reduce((s, t) => s + t.montantTotal, 0);
      
      const netEncashedDette = Math.max(0, paimentsDette - deductionsDette);
      const balanceDette = Math.max(0, detteTotale - netEncashedDette - avoirsDette - remisesDette);
      
      lots.push({
        id: dummyId,
        clientId: selectedClientId,
        nombreOeufs: 0,
        prixUnitaire: 0,
        // Using an old date so it can be sorted properly. 
        // Typically, we want debts to be paid first, so treating them as very old is good.
        dateReception: '2000-01-01T00:00:00.000Z', 
        statut: 'Terminé',
        typeOeuf: 'Dette' as any,
        totalDue: detteTotale,
        netEncashed: netEncashedDette,
        avoirs: avoirsDette,
        remises: remisesDette,
        balance: balanceDette
      });
    }

    return lots.sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime());
  }, [couvaisons, transactions, selectedClientId]);

  /** Gérer la sélection automatique des lots quand le client change. */
  useEffect(() => {
    if (!selectedClientId) {
      setSelectedLotIds([]);
      return;
    }
    // Sélectionne par défaut les lots terminés non soldés et le lot le plus récent.
    const mustSettle = clientLotsWithInfo.filter((l) => l.statut === 'Terminé' && l.balance > 0).map((l) => l.id);
    if (mustSettle.length > 0) {
      setSelectedLotIds(mustSettle);
    } else if (clientLotsWithInfo.length > 0) {
      const unresolved = clientLotsWithInfo.find((l) => l.balance > 0);
      if (unresolved) setSelectedLotIds([unresolved.id]);
    }
  }, [selectedClientId]); // On ne dépend QUE de l'ID du client pour changer la sélection par défaut

  const selectClient = (id: string, telephoneDisplay: string) => {
    setSelectedClientId(id);
    setPhoneSearch(telephoneDisplay);
  };

  const clearClientFilter = () => {
    setSelectedClientId(null);
    setPhoneSearch('');
    setSelectedLotIds([]);
  };

  const toggleLot = (id: string) => {
    setSelectedLotIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const totalBalanceSelected = useMemo(() => {
    const selectedLots = clientLotsWithInfo.filter((l) => selectedLotIds.includes(l.id));
    const totalDue = selectedLots.reduce((sum, l) => sum + l.totalDue, 0);
    const totalPaid = selectedLots.reduce((sum, l) => sum + l.netEncashed, 0);
    const totalCredits = selectedLots.reduce((sum, l) => sum + l.avoirs + l.remises, 0);
    return Math.max(0, totalDue - totalPaid - totalCredits);
  }, [clientLotsWithInfo, selectedLotIds]);

  const totalNetEncashedSelected = useMemo(() => {
    return clientLotsWithInfo.filter((l) => selectedLotIds.includes(l.id)).reduce((sum, l) => sum + l.netEncashed, 0);
  }, [clientLotsWithInfo, selectedLotIds]);

  const totalAvoirsSelected = useMemo(() => {
    return clientLotsWithInfo.filter((l) => selectedLotIds.includes(l.id)).reduce((sum, l) => sum + l.avoirs, 0);
  }, [clientLotsWithInfo, selectedLotIds]);

  const totalRemisesSelected = useMemo(() => {
    return clientLotsWithInfo.filter((l) => selectedLotIds.includes(l.id)).reduce((sum, l) => sum + l.remises, 0);
  }, [clientLotsWithInfo, selectedLotIds]);

  const valMontant = typeof montant === 'number' ? montant : 0;

  /** Règle : tous les lots "Terminé" avec un reste à payer doivent être sélectionnés. */
  const mandatoryLotsUnselected = useMemo(() => {
    return clientLotsWithInfo.filter((l) => l.statut === 'Terminé' && l.balance > 0 && !selectedLotIds.includes(l.id));
  }, [clientLotsWithInfo, selectedLotIds]);

  const canSubmit = useMemo(() => {
    if (selectedLotIds.length === 0 || montant === '' || valMontant <= 0) return false;
    if (mandatoryLotsUnselected.length > 0) return false;

    if (type === 'Paiement') return true; // On autorise les acomptes/avoirs (paiement supérieur au dû)
    if (type === 'Deduction') return valMontant <= totalNetEncashedSelected;
    if (type === 'Avoir' || type === 'Remise') return true; // Allow Avoir/Remise to exceed balance to create/record credit
    return false;
  }, [selectedLotIds, montant, valMontant, type, totalBalanceSelected, totalNetEncashedSelected, mandatoryLotsUnselected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let remainingAmount = valMontant;
    const selectedLotsData = clientLotsWithInfo.filter((l) => selectedLotIds.includes(l.id));
    
    // Trier : Terminés d'abord, puis par date (les plus anciens d'abord pour solder le passif).
    const sortedLots = [...selectedLotsData].sort((a: LotInfo, b: LotInfo) => {
      if (a.statut === 'Terminé' && b.statut !== 'Terminé') return -1;
      if (a.statut !== 'Terminé' && b.statut === 'Terminé') return 1;
      return new Date(a.dateReception).getTime() - new Date(b.dateReception).getTime();
    });

    try {
      for (const lot of sortedLots) {
        if (remainingAmount <= 0) break;

        let amountToApply = 0;
        const isLastLot = (sortedLots.indexOf(lot) === sortedLots.length - 1);
        if (type === 'Paiement' || type === 'Avoir' || type === 'Remise') {
          amountToApply = isLastLot ? remainingAmount : Math.min(remainingAmount, lot.balance);
        } else if (type === 'Deduction') {
          amountToApply = isLastLot ? remainingAmount : Math.min(remainingAmount, lot.netEncashed);
        }

        if (amountToApply > 0) {
          const np = lot.netEncashed + (type === 'Paiement' ? amountToApply : type === 'Deduction' ? -amountToApply : 0);
          const nr = (lot.avoirs + lot.remises) + (type === 'Avoir' || type === 'Remise' ? amountToApply : 0);
          const newReste = Math.max(0, lot.totalDue - np - nr);

          await addTransaction({
            couvaisonId: lot.id,
            clientId: lot.clientId,
            montantTotal: amountToApply,
            acomptesVerses: np,
            resteAPayer: newReste,
            dateTransaction: new Date().toISOString(),
            typeTransaction: type,
            notes: notes || (selectedLotIds.length > 1 ? `Paiement groupé (${selectedLotIds.length} lots)` : undefined),
          });
          remainingAmount -= amountToApply;
        }
      }
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de l’enregistrement');
    }
  };

  const maxMontant = type === 'Deduction' ? totalNetEncashedSelected : totalBalanceSelected;

  const showSuggestions = phoneSearch.trim().length >= 2 && matchingClients.length > 0 && !selectedClient;

  return (
    <div className="app-card mx-auto mt-4 max-w-lg p-6">
      <h2 className="mb-2 font-display text-xl font-bold text-brand-dark">Nouvelle opération</h2>
      <p className="mb-6 text-xs text-brand-muted">
        <strong>Paiement</strong> encaisse, <strong>Déduction</strong> retire de l&apos;argent déjà payé, 
        <strong>Avoir/Remise</strong> réduisent le montant dû.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recherche client */}
        <div className="relative">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-brand-muted">
            <Phone className="h-4 w-4 text-brand-orange" aria-hidden />
            Client (téléphone)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="tel"
              value={phoneSearch}
              onChange={(e) => {
                const val = e.target.value;
                setPhoneSearch(val);
                
                // Si on efface ou change radicalement, on débranche le client sélectionné
                if (selectedClientId) {
                  const still = clients.find((c) => c.id === selectedClientId);
                  if (still && normalizeTelephone(val) !== normalizeTelephone(still.telephone)) {
                    setSelectedClientId(null);
                  }
                }

                // Détection auto du client exact (remplace le useEffect supprimé)
                const q = normalizeTelephone(val);
                if (q.length >= 8) {
                  const exact = clients.find((c) => normalizeTelephone(c.telephone) === q);
                  if (exact && selectedClientId !== exact.id) {
                    setSelectedClientId(exact.id);
                    setPhoneSearch(exact.telephone);
                  }
                }
              }}
              placeholder="Chercher par téléphone..."
              className="input-modern"
            />
            {selectedClient && (
              <button
                type="button"
                onClick={clearClientFilter}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showSuggestions && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {matchingClients.map((c: any) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-brand-cream"
                    onClick={() => selectClient(c.id, c.telephone)}
                  >
                    <User className="h-4 text-brand-orange" />
                    <div>
                      <div className="font-semibold text-brand-dark">{c.nom}</div>
                      <div className="text-xs text-brand-muted">{c.telephone}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedClient && (
          <div className="flex items-center justify-between rounded-xl border border-brand-orange/25 bg-brand-orange/5 px-3 py-2">
            <div className="text-sm font-medium text-brand-dark">
              {selectedClient.nom} · {selectedClient.telephone}
            </div>
            <button
               type="button"
               title="Modifier les infos"
               onClick={() => setIsEditModalOpen(true)}
               className="text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 px-2 py-1 rounded border border-brand-orange/30"
            >
              Modifier n°
            </button>

            {selectedClient && (
              <ClientEditModal
                client={selectedClient}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={(updated) => {
                  setPhoneSearch(updated.telephone);
                }}
              />
            )}
          </div>
        )}

        {selectedClientId && (
          <div className="-mx-2 sm:mx-0">
             <ClientStatsSummary clientId={selectedClientId} />
          </div>
        )}

        {/* Liste des lots */}
        {selectedClientId && (
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-muted">Sélection des lots à solder</label>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {clientLotsWithInfo.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Aucun lot trouvé pour ce client.</p>
              ) : (
                clientLotsWithInfo.map((l: LotInfo) => {
                  const isMandatory = l.statut === 'Terminé' && l.balance > 0;
                  const isSelected = selectedLotIds.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      onClick={() => toggleLot(l.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-brand-orange bg-brand-orange/5 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${isMandatory && !isSelected ? 'border-red-300 bg-red-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Géré par le parent div
                            className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                          />
                          <span className="text-sm font-bold text-brand-dark">
                            {l.id === '00000000-0000-0000-0000-000000000000' 
                              ? 'Dettes Antérieures' 
                              : `${l.nombreOeufs} ${l.typeOeuf}s`}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          l.statut === 'Terminé' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {l.statut}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">
                          {l.id === '00000000-0000-0000-0000-000000000000' 
                            ? 'Historique' 
                            : `Reçu le ${format(parseISO(l.dateReception), 'dd/MM/yy')}`}
                        </span>
                        <span className={`font-bold ${l.balance > 0 ? 'text-brand-orange' : 'text-emerald-600'}`}>
                          {l.balance > 0 ? `Reste: ${l.balance.toLocaleString()} F` : 'SOLDÉ'}
                        </span>
                      </div>
                      {isMandatory && !isSelected && (
                        <p className="mt-1 text-[10px] font-bold text-red-600 uppercase">⚠️ Règlement obligatoire</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {mandatoryLotsUnselected.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-[10px] text-red-700 border border-red-200">
                <AlertTriangle size={14} className="shrink-0" />
                <p>
                  <strong>Attention :</strong> Les lots marqués &quot;Terminé&quot; doivent impérativement être sélectionnés pour être soldés.
                </p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
               <button
                 type="button"
                 onClick={() => setSelectedLotIds(clientLotsWithInfo.filter(l => l.balance > 0).map(l => l.id))}
                 className="text-[11px] font-semibold text-brand-orange hover:underline"
               >
                 Tout sélectionner (non soldés)
               </button>
            </div>
          </div>
        )}

        {/* Détails Financiers Groupés */}
        {selectedLotIds.length > 0 && (
          <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] relative group">
            <div className="flex justify-between font-bold text-brand-dark mb-2 border-b border-slate-200 pb-1">
              <span>PRÉ-RÉGLEMENT ({selectedLotIds.length} lot{selectedLotIds.length > 1 ? 's' : ''})</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (!selectedClient) return;
                    const totalDue = clientLotsWithInfo.filter(l => selectedLotIds.includes(l.id)).reduce((s,l) => s + l.totalDue, 0);
                    const msg = `🧾 *SITUATION FINANCIÈRE ATTACHÉE*\n\n` +
                      `👤 Client: *${selectedClient.nom}*\n` +
                      `📦 Lots: ${selectedLotIds.length}\n\n` +
                      `💰 *Montant Total dû:* ${totalDue.toLocaleString()} F\n` +
                      `🎁 *Remise:* ${totalRemisesSelected > 0 ? (totalRemisesSelected + totalAvoirsSelected).toLocaleString() + ' F' : '-'}\n` +
                      `✅ *Net déjà encaissé:* ${totalNetEncashedSelected.toLocaleString()} F\n\n` +
                      `🚩 *RESTE TOTAL À PAYER:* *${totalBalanceSelected.toLocaleString()} F*\n\n` +
                      `_Merci de votre confiance !_ \nIvoire Couvée d'Or.`;
                    
                    openWhatsApp(selectedClient.telephone, msg);
                  }}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold text-[9px]"
                  title="Partager le bilan actuel"
                >
                  <Phone size={12} /> Bilan
                </button>
                {valMontant > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (!selectedClient) return;
                      const msg = `🧾 *QUITTANCE DE PAIEMENT - IVOIRE COUVÉE D'OR*\n\n` +
                        `👤 Client: *${selectedClient.nom}*\n` +
                        `💰 *Montant Versé ce jour:* *${valMontant.toLocaleString()} F*\n` +
                        `📅 Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n` +
                        `◈ *SITUATION MISE À JOUR*\n` +
                        `🚩 Reste total à régler: *${Math.max(0, totalBalanceSelected - valMontant).toLocaleString()} F*\n\n` +
                        `_Ce message vaut preuve de paiement. Merci !_`;
                      
                      openWhatsApp(selectedClient.telephone, msg);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold text-[9px]"
                    title="Envoyer la quittance après saisie"
                  >
                    <CheckCircle size={12} className="text-emerald-500" /> Quittance
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Montant total dû :</span>
              <span className="font-semibold">{clientLotsWithInfo.filter(l => selectedLotIds.includes(l.id)).reduce((s,l) => s + l.totalDue, 0).toLocaleString()} F</span>
            </div>
            
            {(totalAvoirsSelected > 0 || totalRemisesSelected > 0) && (
              <div className="space-y-1">
                {totalAvoirsSelected > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Avoir cumulé :</span>
                    <span className="font-semibold">-{totalAvoirsSelected.toLocaleString()} F</span>
                  </div>
                )}
                {totalRemisesSelected > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Remise cumulée :</span>
                    <span className="font-semibold">-{totalRemisesSelected.toLocaleString()} F</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-emerald-600">
              <span>Net déjà encaissé :</span>
              <span className="font-semibold">{totalNetEncashedSelected.toLocaleString()} F</span>
            </div>
            
            <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 font-black text-brand-orange text-sm">
              <span>Reste total à payer :</span>
              <span>{totalBalanceSelected.toLocaleString()} F</span>
            </div>
          </div>
        )}

        {/* Type et Montant */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Type Opération</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeTransaction)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"
            >
              <option value="Paiement">Paiement</option>
              <option value="Deduction">Déduction</option>
              <option value="Avoir">Avoir (réduction dû)</option>
              <option value="Remise">Remise</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Montant (F)</label>
            <div className="relative">
              <input
                required
                type="number"
                min={1}
                value={montant}
                onChange={(e) => setMontant(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="input-modern pr-10"
              />
              <button
                type="button"
                onClick={() => setMontant(maxMontant)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 px-1.5 py-0.5 rounded"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">Notes / Motif</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. Espèces, Solder le passif..."
            className="input-modern"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-hover hover:scale-[1.02] disabled:opacity-50 disabled:grayscale"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
