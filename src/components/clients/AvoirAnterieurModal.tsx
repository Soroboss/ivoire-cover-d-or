import React, { useState } from 'react';
import { X, User, Phone, DollarSign, PlusCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import { callBackendFunction } from '../../lib/insforgeApi';
import type { Client } from '../../types';

export const AvoirAnterieurModal = ({
  isOpen,
  onClose,
  preselectedClientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  preselectedClientId?: string | null;
}) => {
  const { clients, addTransaction } = useAppContext();
  
  const [isNewClient, setIsNewClient] = useState(!preselectedClientId);
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId || '');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [notes, setNotes] = useState('Avoir / Solde créditeur initial');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || montant <= 0) return;
    
    setIsLoading(true);
    try {
      let finalClientId = selectedClientId;
      
      // 1. Créer le client s'il est nouveau
      if (isNewClient) {
        if (!nom || !telephone) {
          throw new Error("Nom et téléphone requis pour un nouveau client.");
        }
        
        // Check if phone already exists locally
        const existing = clients.find(c => c.telephone.replace(/\s+/g, '') === telephone.replace(/\s+/g, ''));
        if (existing) {
          throw new Error("Ce numéro de téléphone existe déjà dans la base de données.");
        }

        const res = await callBackendFunction<{ client: Client }>('client_create', {
          nom,
          telephone,
        });
        
        if (!res.client) {
          throw new Error("Erreur lors de la création du client.");
        }
        
        finalClientId = res.client.id;
      } else {
        if (!finalClientId) throw new Error("Veuillez sélectionner un client.");
      }

      // 2. Ajouter la transaction de type Avoir
      await addTransaction({
        clientId: finalClientId,
        montantTotal: Number(montant),
        dateTransaction: new Date().toISOString(),
        typeTransaction: 'Avoir',
        notes: notes,
      });

      if (isNewClient) {
        window.location.reload();
      } else {
        onClose();
        setMontant('');
        setNotes('Avoir / Solde créditeur initial');
      }
    } catch (error: any) {
      alert(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-brand-dark">Saisie Avoir / Crédit</h3>
              <p className="text-xs text-brand-muted">Ajouter un avoir pour le client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setIsNewClient(false)}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-all ${
                !isNewClient ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'
              }`}
            >
              Client Existant
            </button>
            <button
              type="button"
              onClick={() => setIsNewClient(true)}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-all ${
                isNewClient ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'
              }`}
            >
              Nouveau Client
            </button>
          </div>

          {!isNewClient ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-muted">Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="input-modern w-full"
                required
              >
                <option value="" disabled>Sélectionner un client...</option>
                {clients.sort((a,b) => a.nom.localeCompare(b.nom)).map(c => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-muted">Nom Complet</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="input-modern w-full pl-10"
                    placeholder="Ex: Jean Dupont"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-muted">Téléphone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="input-modern w-full pl-10"
                    placeholder="Ex: 0102030405"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Montant de l&apos;avoir (FCFA)</label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
              <input
                type="number"
                min="1"
                value={montant}
                onChange={(e) => setMontant(e.target.value === '' ? '' : Number(e.target.value))}
                className="input-modern w-full pl-10 font-bold text-brand-dark border-green-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Ex: 50000"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Ce montant viendra en déduction des prochaines factures (Crédit client).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">Notes (Optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-modern w-full"
            />
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !montant}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
