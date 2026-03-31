import React, { useState } from 'react';
import { X, User, Phone, Edit2, History, MessageCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import { ClientStatsSummary } from '../finances/ClientStatsSummary';
import { ClientEditModal } from './ClientEditModal';
import { format, parseISO } from 'date-fns';
import type { Client } from '../../types';

interface ClientFinanceCardModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientFinanceCardModal: React.FC<ClientFinanceCardModalProps> = ({ client, isOpen, onClose }) => {
  const { transactions, couvaisons } = useAppContext();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!isOpen) return null;

  const clientTransactions = transactions
    .filter(t => t.clientId === client.id)
    .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
    .slice(0, 5);

  const clientLots = couvaisons
    .filter(c => c.clientId === client.id)
    .sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime())
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-hover px-6 py-6 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
              <User size={28} />
            </div>
            <div>
              <h3 className="font-display font-black text-2xl tracking-tight leading-none mb-1">
                {client.nom}
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80 bg-black/10 px-2 py-0.5 rounded-lg border border-white/10">
                  <Phone size={12} />
                  {client.telephone}
                </span>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white text-brand-orange hover:bg-brand-orange hover:text-white px-2 py-1 rounded-md transition-all shadow-sm"
                >
                  <Edit2 size={10} /> Modifier
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center hover:bg-white/20 rounded-xl transition-all border border-transparent hover:border-white/30"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Summary Stats */}
          <section>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
              <div className="h-1 w-8 bg-brand-orange rounded-full" />
              Synthèse Financière Globale
            </h4>
            <ClientStatsSummary clientId={client.id} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Lots */}
            <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <History size={14} className="text-brand-orange" />
                Dernières Couvaisons
              </h4>
              <div className="space-y-3">
                {clientLots.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">Aucune couvaison trouvée.</p>
                ) : (
                  clientLots.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-brand-dark">{format(parseISO(c.dateReception), 'dd MMM yyyy')}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{c.nombreOeufs} {c.typeOeuf}s</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        c.statut === 'En attente' ? 'bg-yellow-100 text-yellow-700' :
                        c.statut === 'En cours' ? 'bg-blue-100 text-blue-700' :
                        c.statut === 'Terminé' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.statut}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Transactions */}
            <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <MessageCircle size={14} className="text-brand-orange" />
                Derniers Paiements
              </h4>
              <div className="space-y-3">
                {clientTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">Aucune transaction trouvée.</p>
                ) : (
                  clientTransactions.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-brand-dark">{format(parseISO(t.dateTransaction), 'dd/MM/yyyy')}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{t.typeTransaction}</p>
                      </div>
                      <p className={`text-sm font-black ${
                        t.typeTransaction === 'Paiement' ? 'text-green-600' : 
                        t.typeTransaction === 'Deduction' ? 'text-red-500' : 
                        'text-brand-orange'
                      }`}>
                        {t.typeTransaction === 'Paiement' ? '+' : '-'} {t.montantTotal.toLocaleString()} F
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-medium">
            Toutes les données sont issues du grand livre client synchronisé.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>

      <ClientEditModal 
        client={client}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};
