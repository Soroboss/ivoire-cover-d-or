import { useState } from 'react';
import { useAppContext } from '../context/AppProvider';
import { TransactionForm } from '../components/finances/TransactionForm';
import { format, parseISO } from 'date-fns';
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const Finances = () => {
  const { transactions, couvaisons, clients } = useAppContext();
  const [showForm, setShowForm] = useState(false);

  const totalEncaisse = transactions.filter(t => t.typeTransaction === 'Paiement').reduce((acc, t) => acc + t.montantTotal, 0);
  const totalAvoirs = transactions.filter(t => t.typeTransaction === 'Avoir').reduce((acc, t) => acc + t.montantTotal, 0);
  
  // Total expected revenue from complete process (excluding cancelled)
  const expectedTotal = couvaisons.filter(c => c.statut !== 'Annulé').reduce((acc, c) => acc + (c.nombreOeufs * c.prixUnitaire), 0);
  const enAttente = expectedTotal - totalEncaisse - totalAvoirs;

  // Sorting transactions descending by date
  const sortedTransactions = [...transactions].sort((a,b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime());

  if (showForm) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
         <TransactionForm onCancel={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-dark">Suivi Financier</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-brand-orange text-white px-4 py-2 rounded-md font-medium hover:bg-brand-hover shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Encaisser / Avoir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Chiffre d'Affaires Encaissé</p>
          <h3 className="text-3xl font-bold text-green-600">{totalEncaisse.toLocaleString()} FCFA</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Reste à Recouvrer (Estimé)</p>
          <h3 className="text-3xl font-bold text-amber-600">{Math.max(0, enAttente).toLocaleString()} FCFA</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Total Avoirs Accordés</p>
          <h3 className="text-3xl font-bold text-purple-600">{totalAvoirs.toLocaleString()} FCFA</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden">
        <div className="p-4 border-b border-brand-lightgray bg-gray-50">
           <h2 className="font-semibold text-brand-dark">Historique des Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-brand-gray font-semibold border-b border-brand-lightgray">
               <tr>
                 <th className="px-6 py-4">Date</th>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Lot Concerné</th>
                 <th className="px-6 py-4">Type</th>
                 <th className="px-6 py-4 text-right">Montant</th>
                 <th className="px-6 py-4 text-right">Reste à Payer (Lot)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightgray">
               {sortedTransactions.length > 0 ? sortedTransactions.map(t => {
                 const client = clients.find(cl => cl.id === t.clientId);
                 const couv = couvaisons.find(c => c.id === t.couvaisonId);
                 const isPaiement = t.typeTransaction === 'Paiement';

                 return (
                   <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 text-brand-muted">{format(parseISO(t.dateTransaction), 'dd/MM/yyyy HH:mm')}</td>
                     <td className="px-6 py-4 font-medium text-brand-dark">{client?.nom || 'Inconnu'}</td>
                     <td className="px-6 py-4 text-brand-muted">{couv ? `${couv.nombreOeufs} ${couv.typeOeuf}s` : 'Lot inconnu'}</td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          isPaiement ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isPaiement ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {t.typeTransaction}
                        </span>
                        {t.notes && <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={t.notes}>{t.notes}</p>}
                     </td>
                     <td className={`px-6 py-4 text-right font-bold ${isPaiement ? 'text-green-600' : 'text-purple-600'}`}>
                        {isPaiement ? '+' : '-'} {t.montantTotal.toLocaleString()} FCFA
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-brand-dark">
                        {t.resteAPayer.toLocaleString()} FCFA
                     </td>
                   </tr>
                 );
               }) : (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-brand-muted">
                     Aucune transaction enregistrée.
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Finances;
