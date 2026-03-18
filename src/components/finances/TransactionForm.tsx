import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';

export const TransactionForm = ({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, clients, addTransaction, transactions } = useAppContext();
  
  const [couvaisonId, setCouvaisonId] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [type, setType] = useState<'Paiement' | 'Avoir'>('Paiement');
  const [notes, setNotes] = useState('');

  const selectedCouv = couvaisons.find(c => c.id === couvaisonId);
  const totalDue = selectedCouv ? selectedCouv.nombreOeufs * selectedCouv.prixUnitaire : 0;
  
  const selectedTransactions = transactions.filter(t => t.couvaisonId === couvaisonId);
  const totalPaye = selectedTransactions.filter(t => t.typeTransaction === 'Paiement').reduce((acc, t) => acc + t.montantTotal, 0);
  const totalAvoir = selectedTransactions.filter(t => t.typeTransaction === 'Avoir').reduce((acc, t) => acc + t.montantTotal, 0);
  
  const resteAPayer = totalDue - totalPaye - totalAvoir;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouv || montant === '') return;

    const valMontant = typeof montant === 'number' ? montant : 0;
    const newAcomptes = totalPaye + (type === 'Paiement' ? valMontant : 0);
    const newReste = totalDue - newAcomptes - (type === 'Avoir' ? totalAvoir + valMontant : totalAvoir);

    addTransaction({
      couvaisonId,
      clientId: selectedCouv.clientId,
      montantTotal: valMontant,
      acomptesVerses: newAcomptes,
      resteAPayer: Math.max(0, newReste),
      dateTransaction: new Date().toISOString(),
      typeTransaction: type,
      notes
    });
    
    onSuccess();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4">
      <h2 className="text-xl font-bold text-brand-dark mb-6">Nouvelle Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label className="block text-sm font-medium text-brand-muted mb-1">Lot de Couvaison</label>
           <select required value={couvaisonId} onChange={e => setCouvaisonId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none">
             <option value="">-- Sélectionnez un lot --</option>
             {couvaisons.map(c => {
               const client = clients.find(cl => cl.id === c.clientId);
               return (
                 <option key={c.id} value={c.id}>
                   {client?.nom} - {c.nombreOeufs} {c.typeOeuf}s ({c.statut})
                 </option>
               );
             })}
           </select>
         </div>

         {selectedCouv && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm">
               <div className="flex justify-between mb-1">
                 <span className="text-brand-gray">Total de la prestation :</span>
                 <span className="font-semibold">{totalDue.toLocaleString()} FCFA</span>
               </div>
               <div className="flex justify-between mb-1 text-green-700">
                 <span>Déjà payé :</span>
                 <span>{totalPaye.toLocaleString()} FCFA</span>
               </div>
               {totalAvoir > 0 && (
                 <div className="flex justify-between mb-1 text-purple-700">
                   <span>Avoirs accordés :</span>
                   <span>{totalAvoir.toLocaleString()} FCFA</span>
                 </div>
               )}
               <div className="flex justify-between mt-2 pt-2 border-t font-bold text-brand-dark">
                 <span>Reste à Payer :</span>
                 <span>{Math.max(0, resteAPayer).toLocaleString()} FCFA</span>
               </div>
            </div>
         )}

         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-brand-muted mb-1">Type de transaction</label>
             <select value={type} onChange={e => setType(e.target.value as any)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none">
               <option value="Paiement">Paiement (Acompte / Solde)</option>
               <option value="Avoir">Avoir (Déduction)</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-brand-muted mb-1">Montant (FCFA)</label>
             <input required type="number" min="1" max={resteAPayer > 0 ? resteAPayer : undefined} value={montant} onChange={e => setMontant(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
           </div>
         </div>
         
         <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Notes / Motif (Optionnel)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mode de paiement, etc." className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
         </div>

         <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={!selectedCouv || resteAPayer <= 0 || montant === ''} className="px-4 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50">
              Enregistrer
            </button>
         </div>
      </form>
    </div>
  );
};
