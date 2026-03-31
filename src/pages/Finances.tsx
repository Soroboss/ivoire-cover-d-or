import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { TransactionForm } from '../components/finances/TransactionForm';
import { ClientFinanceCardModal } from '../components/clients/ClientFinanceCardModal';
import { format, parseISO } from 'date-fns';
import type { Client } from '../types';
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  MessageCircle,
  MinusCircle,
  Percent,
  Landmark,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { isIsoDateInRange } from '../lib/dateRangeFilter';
import {
  netEncaisseGlobal,
  netPayeLot,
  resteLot,
  sumAvoirsRemisesLot,
  totalAvoirsRemisesGlobal,
} from '../lib/financeCalculations';
import { Target, AlertTriangle } from 'lucide-react';

const Finances = () => {
  const { transactions, couvaisons, clients, addClientMessage } = useAppContext();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [receptionFrom, setReceptionFrom] = useState('');
  const [receptionTo, setReceptionTo] = useState('');
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  /** Lots dont la date de réception est dans l’intervalle (ou tout si pas de filtre). */
  const couvaisonsScoped = useMemo(() => {
    if (!receptionFrom && !receptionTo) return couvaisons;
    return couvaisons.filter((c) => isIsoDateInRange(c.dateReception, receptionFrom, receptionTo));
  }, [couvaisons, receptionFrom, receptionTo]);

  /** Transactions dont le lot a une réception dans l’intervalle. */
  const transactionsScoped = useMemo(() => {
    if (!receptionFrom && !receptionTo) return transactions;
    return transactions.filter((t) => {
      const lot = couvaisons.find((c) => c.id === t.couvaisonId);
      if (!lot) return false;
      return isIsoDateInRange(lot.dateReception, receptionFrom, receptionTo);
    });
  }, [transactions, couvaisons, receptionFrom, receptionTo]);

  const totalEncaisse = netEncaisseGlobal(transactionsScoped);
  const totalAvoirsRemises = totalAvoirsRemisesGlobal(transactionsScoped);

  const expectedTotal = couvaisonsScoped
    .filter((c) => c.statut !== 'Annulé')
    .reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);
  const enAttente = expectedTotal - totalEncaisse - totalAvoirsRemises;

  const sortedTransactions = [...transactionsScoped].sort(
    (a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime(),
  );

  const unpaidLots = useMemo(() => {
    return couvaisonsScoped
      .filter((c) => c.statut !== 'Annulé')
      .map((c) => {
        const client = clients.find((cl) => cl.id === c.clientId);
        const totalDue = c.nombreOeufs * c.prixUnitaire;
        const totalPaid = netPayeLot(transactions, c.id);
        const totalCredit = sumAvoirsRemisesLot(transactions, c.id);
        const remain = resteLot(transactions, c.id, totalDue);
        return {
          couvaison: c,
          client,
          totalDue,
          totalPaid,
          totalCredit,
          remain,
        };
      })
      .filter((x) => x.remain > 0)
      .sort((a, b) => b.remain - a.remain);
  }, [couvaisonsScoped, clients, transactions]);

  const normalizeWhatsappNumber = (phone?: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) return '225' + cleaned;
    return cleaned;
  };

  const sendPaymentReminder = async (clientId: string | undefined, couvaisonId: string, clientName: string | undefined, phone: string | undefined, remain: number) => {
    if (!clientId || !phone) return;
    const text = `Bonjour ${clientName || ''},\n\nPetit rappel concernant le solde de votre couvaison: ${remain.toLocaleString()} FCFA restant a regler.\nMerci de passer au couvoir pour regulariser.\n\nL'equipe Ivoire Couvee d'Or.`;
    const url = `https://wa.me/${normalizeWhatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
    try {
      await addClientMessage({
        clientId,
        couvaisonId,
        canal: 'WhatsApp',
        statut: 'Envoye',
        template: 'relance_impaye',
        message: text,
        sentByUserId: currentUser?.id,
        sentByName: currentUser?.nom,
      });
    } catch {
      // No-op: ne pas bloquer l'action utilisateur.
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const exportAccountingCsv = () => {
    const headers = [
      'DateOperation',
      'DateReceptionLot',
      'Client',
      'Lot',
      'TypeTransaction',
      'Montant',
      'AcomptesVerses',
      'ResteAPayer',
      'Notes',
    ];
    const rows = sortedTransactions.map((t) => {
      const client = clients.find(c => c.id === t.clientId);
      const lot = couvaisons.find(c => c.id === t.couvaisonId);
      return [
        format(parseISO(t.dateTransaction), 'yyyy-MM-dd HH:mm:ss'),
        lot ? format(parseISO(lot.dateReception), 'yyyy-MM-dd') : '',
        client?.nom || 'Inconnu',
        lot ? `${lot.nombreOeufs} ${lot.typeOeuf}s` : 'Lot inconnu',
        t.typeTransaction,
        String(t.montantTotal),
        String(t.acomptesVerses),
        String(t.resteAPayer),
        (t.notes || '').replace(/[\r\n,;]/g, ' '),
      ];
    });

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const period =
      receptionFrom && receptionTo
        ? `${receptionFrom}_${receptionTo}`
        : receptionFrom
          ? `depuis_${receptionFrom}`
          : receptionTo
            ? `jusque_${receptionTo}`
            : format(new Date(), 'yyyy-MM');
    a.href = url;
    a.download = `comptabilite_transactions_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportAccountingCsv}
            className="bg-gray-100 text-brand-dark px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200"
          >
            <Download size={18} /> Export comptable CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-orange text-white px-4 py-2 rounded-md font-medium hover:bg-brand-hover shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Nouvelle opération
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-brand-orange/20 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
          <Target className="text-brand-orange" size={20} />
          Réconciliation Globale (Croisement Œufs / Argent)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potentialité Œufs</p>
            <p className="text-xl font-black text-brand-dark">{couvaisonsScoped.filter(c => c.statut !== 'Annulé').reduce((acc, c) => acc + c.nombreOeufs, 0).toLocaleString()} œufs</p>
            <p className="text-[10px] text-slate-500 italic">Lots non annulés sur la période</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">C.A. Théorique</p>
            <p className="text-xl font-black text-brand-dark">{expectedTotal.toLocaleString()} F</p>
            <p className="text-[10px] text-slate-500 italic">Total Œufs × Prix Unitaires</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit des Paiements</p>
            <p className="text-xl font-black text-green-600">{totalEncaisse.toLocaleString()} F</p>
            <p className="text-[10px] text-slate-500 italic">Encaisse nette (Paiements - Déductions)</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reste à Recouvrer</p>
            <p className="text-xl font-black text-red-600">{(expectedTotal - totalEncaisse - totalAvoirsRemises).toLocaleString()} F</p>
            <p className="text-[10px] text-slate-500 italic">Post-Avoirs & Remises (-{totalAvoirsRemises.toLocaleString()} F)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-brand-muted">
           <AlertTriangle size={14} className="text-brand-orange" />
           <span>Tout écart entre le C.A. Théorique et la somme (Paiements + Reste + Avoirs) doit être nul pour que la compatibilité soit parfaite.</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-dark">
          <Calendar className="h-4 w-4 text-brand-orange" />
          Filtrer par date de réception du lot
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only">Réception du</label>
          <input
            type="date"
            value={receptionFrom}
            onChange={(e) => setReceptionFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none"
          />
          <span className="text-xs text-brand-muted">au</span>
          <label className="sr-only">Réception au</label>
          <input
            type="date"
            value={receptionTo}
            onChange={(e) => setReceptionTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none"
          />
          {(receptionFrom || receptionTo) && (
            <button
              type="button"
              onClick={() => {
                setReceptionFrom('');
                setReceptionTo('');
              }}
              className="text-sm font-semibold text-brand-orange hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-brand-muted">
          Les totaux, impayés et historique ci-dessous suivent ce filtre (lots reçus dans la période). Un seul jour : même
          date en « du » et « au ».
        </p>
      </div>

      <Link
        to="/tresorerie"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-brand-orange/[0.08] px-4 py-3 text-sm shadow-sm transition-colors hover:border-brand-orange/40"
      >
        <span className="flex items-center gap-2 font-semibold text-brand-dark">
          <Landmark className="h-5 w-5 text-brand-orange" />
          Trésorerie &amp; banque — journal des flux, soldes et exports pour votre partenaire bancaire
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-brand-orange">
          Ouvrir <ArrowRight size={16} />
        </span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Net encaissé (paiements − déductions)</p>
          <h3 className="text-3xl font-bold text-green-600">{totalEncaisse.toLocaleString()} FCFA</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Reste à Recouvrer (Estimé)</p>
          <h3 className="text-3xl font-bold text-amber-600">{Math.max(0, enAttente).toLocaleString()} FCFA</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
          <p className="text-sm font-medium text-brand-muted mb-1">Avoirs + remises</p>
          <h3 className="text-3xl font-bold text-purple-600">{totalAvoirsRemises.toLocaleString()} FCFA</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden">
        <div className="p-4 border-b border-brand-lightgray bg-red-50/40">
          <h2 className="font-semibold text-brand-dark">Impayés clients (action de relance)</h2>
        </div>
        <div className="overflow-x-auto border-b border-brand-lightgray">
          <table className="w-full text-left text-sm">
            <thead className="text-brand-gray font-semibold border-b border-brand-lightgray">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Réception</th>
                <th className="px-6 py-3">Lot</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Payé</th>
                <th className="px-6 py-3 text-right">Avoir / remise</th>
                <th className="px-6 py-3 text-right">Reste</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightgray">
              {unpaidLots.length > 0 ? unpaidLots.map((u) => (
                <tr key={u.couvaison.id}>
                  <td className="px-6 py-3">
                     <button 
                       onClick={() => u.client && setViewingClient(u.client)}
                       className="font-medium text-brand-dark hover:text-brand-orange underline decoration-brand-orange/20 underline-offset-2 transition-all"
                     >
                       {u.client?.nom || 'Inconnu'}
                     </button>
                   </td>
                  <td className="px-6 py-3 text-sm text-brand-dark">
                    {format(parseISO(u.couvaison.dateReception), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-3 text-brand-muted">{u.couvaison.nombreOeufs} {u.couvaison.typeOeuf}s</td>
                  <td className="px-6 py-3 text-right">{u.totalDue.toLocaleString()} FCFA</td>
                  <td className="px-6 py-3 text-right text-green-700">{u.totalPaid.toLocaleString()} FCFA</td>
                  <td className="px-6 py-3 text-right text-purple-700">{u.totalCredit.toLocaleString()} FCFA</td>
                  <td className="px-6 py-3 text-right font-semibold text-red-700">{u.remain.toLocaleString()} FCFA</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => sendPaymentReminder(u.client?.id, u.couvaison.id, u.client?.nom, u.client?.telephone, u.remain)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      title="Envoyer une relance WhatsApp"
                    >
                      <MessageCircle size={14} /> Relancer
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-brand-muted">Aucun impayé en cours.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-b border-brand-lightgray bg-gray-50">
           <h2 className="font-semibold text-brand-dark">Historique des Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-brand-gray font-semibold border-b border-brand-lightgray">
               <tr>
                 <th className="px-6 py-4">Date opération</th>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Réception lot</th>
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
                 const tt = t.typeTransaction;
                 const badge =
                   tt === 'Paiement'
                     ? { cls: 'bg-green-100 text-green-800', icon: <ArrowDownRight size={14} /> }
                     : tt === 'Deduction'
                       ? { cls: 'bg-red-100 text-red-800', icon: <MinusCircle size={14} /> }
                       : tt === 'Remise'
                         ? { cls: 'bg-orange-100 text-orange-800', icon: <Percent size={14} /> }
                         : { cls: 'bg-purple-100 text-purple-800', icon: <ArrowUpRight size={14} /> };
                 const amountCls =
                   tt === 'Paiement'
                     ? 'text-green-600'
                     : tt === 'Deduction'
                       ? 'text-red-600'
                       : tt === 'Remise'
                         ? 'text-orange-600'
                         : 'text-purple-600';
                 const amountPrefix = tt === 'Paiement' ? '+' : '−';

                 return (
                   <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 text-brand-muted">{format(parseISO(t.dateTransaction), 'dd/MM/yyyy HH:mm')}</td>
                     <td className="px-6 py-4">
                       <button 
                         onClick={() => client && setViewingClient(client)}
                        className="font-medium text-brand-dark hover:text-brand-orange underline decoration-brand-orange/20 underline-offset-2 transition-all"
                       >
                         {client?.nom || 'Inconnu'}
                       </button>
                     </td>
                     <td className="px-6 py-4 text-sm text-brand-muted">
                       {couv ? format(parseISO(couv.dateReception), 'dd/MM/yyyy') : '—'}
                     </td>
                     <td className="px-6 py-4 text-brand-muted">{couv ? `${couv.nombreOeufs} ${couv.typeOeuf}s` : 'Lot inconnu'}</td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${badge.cls}`}>
                          {badge.icon} {t.typeTransaction}
                        </span>
                        {t.notes && <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={t.notes}>{t.notes}</p>}
                     </td>
                     <td className={`px-6 py-4 text-right font-bold ${amountCls}`}>
                        {amountPrefix} {t.montantTotal.toLocaleString()} FCFA
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-brand-dark">
                        {t.resteAPayer.toLocaleString()} FCFA
                     </td>
                   </tr>
                 );
               }               ) : (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-brand-muted">
                     Aucune transaction enregistrée.
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingClient && (
        <ClientFinanceCardModal 
          client={viewingClient} 
          isOpen={!!viewingClient} 
          onClose={() => setViewingClient(null)} 
        />
      )}
    </div>
  );
};

export default Finances;
