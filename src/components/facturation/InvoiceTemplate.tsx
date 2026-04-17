import { forwardRef } from 'react';
import type { Couvaison, Client, Transaction } from '../../types';
import { netEncaisseByClient, totalAvoirRemiseByClient } from '../../lib/financeCalculations';
import { format, parseISO } from 'date-fns';

const ADRESSE_ETABLISSEMENT =
  "Korhogo-Natio près de l'usine de coton SICO SA";

interface InvoiceProps {
  client: Client;
  couvaisons: Couvaison[];
  transactions: Transaction[];
  invoiceNumber: string;
  preview?: boolean;
  totalGlobalRemaining?: number;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ client, couvaisons, transactions, invoiceNumber, preview = false, totalGlobalRemaining }, ref) => {
    const totalAmount = couvaisons.reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);
    const totalPaid = netEncaisseByClient(transactions, client.id);
    const totalCredits = totalAvoirRemiseByClient(transactions, client.id);
    const due = totalAmount - totalPaid - totalCredits;
    const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

    return (
      <div
        ref={ref}
        id="printable-facture"
        className={`bg-white text-slate-900 ${preview ? 'w-full max-w-[850px] shadow-2xl rounded-xl border border-gray-100 mx-auto' : 'w-[800px]'} overflow-hidden pb-12`}
        style={{ 
          minHeight: '1100px', 
          fontFamily: "'Montserrat', sans-serif",
          ...(preview ? {} : { position: 'absolute', top: -9999, left: -9999 })
        }}
      >
        {/* Load Montserrat if not available */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        <div className="px-12 pt-10">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-5 items-center">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-20 w-20 object-contain"
                crossOrigin="anonymous"
              />
              <div className="border-l-2 border-brand-orange/20 pl-5">
                <h1 className="text-3xl font-black tracking-tight text-brand-orange uppercase leading-none mb-1">
                  IVOIRE COUVÉE
                </h1>
                <p className="text-lg font-bold text-slate-700 tracking-[0.1em] uppercase">D&apos;OR</p>
              </div>
            </div>
            
            <div className="text-right pt-2">
              <h2 className="text-3xl font-medium text-slate-400 uppercase mb-3 tracking-tighter">FACTURE</h2>
              <div className="space-y-1 text-sm font-semibold text-slate-600">
                <p className="flex justify-end gap-2 text-[10px] uppercase text-slate-400">Réf. <span className="text-slate-900 font-bold text-sm tracking-tight">{invoiceNumber}</span></p>
                <p className="flex justify-end gap-2 text-[10px] uppercase text-slate-400">Date <span className="text-slate-900 font-bold text-sm tracking-tight">{format(new Date(), 'dd/MM/yyyy')}</span></p>
              </div>
            </div>
          </div>

          <div className="h-0.5 bg-brand-orange/80 w-full mb-12" />

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-20 mb-20 px-4">
            <div className="space-y-4">
              <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded tracking-[0.15em] uppercase">Émetteur</span>
              <div className="space-y-2">
                <p className="font-black text-slate-900 text-xl tracking-tight uppercase">IVOIRE COUVÉE D&apos;OR</p>
                <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-[280px]">{ADRESSE_ETABLISSEMENT}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="h-1 w-4 bg-brand-orange rounded-full" />
                  <p className="text-xs font-bold text-slate-900">Tél: 01 03 03 64 62</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-right">
              <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded tracking-[0.15em] uppercase">Destinataire</span>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{client.nom}</p>
                <div className="text-sm font-semibold text-slate-600 space-y-1">
                  <p className="text-[10px] uppercase text-slate-400">ID Client : <span className="text-slate-900 font-bold">{client.clientIdExt || '—'}</span></p>
                  <p className="text-[10px] uppercase text-slate-400">Téléphone : <span className="text-slate-900 font-bold">{client.telephone}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Détail des prestations */}
          <div className="mb-8 flex items-end justify-between border-b-2 border-slate-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Détail des prestations</h3>
            {couvaisons.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Période du {format(parseISO(couvaisons[couvaisons.length-1].dateReception), 'dd/MM/yyyy')} au {format(parseISO(couvaisons[0].dateReception), 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          <table className="w-full mb-16 border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 pl-6">Prestation (Couvaison)</th>
                <th className="py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Qté d&apos;œufs</th>
                <th className="py-3 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Prix Unitaire</th>
                <th className="py-3 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 pr-6">Sous-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couvaisons.map((c) => (
                <tr key={c.id} className="break-inside-avoid hover:bg-slate-50/30 transition-colors">
                  <td className="py-5 pl-6">
                    <p className="font-bold text-slate-900 text-sm">Incubation de {c.typeOeuf}s</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Date de réception : {format(parseISO(c.dateReception), 'dd/MM/yyyy')}</p>
                  </td>
                  <td className="py-5 text-center text-sm font-bold text-slate-700">{c.nombreOeufs}</td>
                  <td className="py-5 text-right text-sm text-slate-500 font-medium">{c.prixUnitaire.toLocaleString()} F</td>
                  <td className="py-5 text-right text-sm font-black text-slate-900 pr-6">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-between items-start gap-12 mt-12 mb-24 break-inside-avoid">
            {/* Payment History */}
            <div className="flex-1 max-w-md">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b border-slate-100 pb-2">Notes & Paiements Période</h4>
              <div className="space-y-4 ml-2">
                {transactions.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">Aucun versement enregistré</p>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-[11px] group">
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange/40 group-hover:bg-brand-orange" />
                        <span className="font-bold text-slate-500 uppercase tracking-tighter">{format(parseISO(t.dateTransaction), 'dd/MM/yy')} &mdash; {t.typeTransaction}</span>
                      </div>
                      <span className="font-black text-slate-900 tracking-tighter">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Calculation Box */}
            <div className="w-full max-w-[380px] border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm bg-slate-50/50">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <span>Somme des prestations :</span>
                <span className="text-slate-900">{totalAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-emerald-600 border-b border-slate-200 pb-5">
                <span>Total Encaissé (Période) :</span>
                <span>− {(totalPaid + totalCredits).toLocaleString()} FCFA</span>
              </div>
              
              <div className="pt-2 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 leading-none">Net à régulariser</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Sur cette sélection</p>
                </div>
                <p className="text-3xl font-black text-brand-orange tabular-nums tracking-tighter">
                  {Math.max(0, due).toLocaleString()} <span className="text-xs">FCFA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Global Balance Note */}
          {totalGlobalRemaining !== undefined && (
            <div className="flex justify-end mb-24 break-inside-avoid">
              <div className="bg-red-50/40 border-2 border-red-50 rounded-[2.5rem] px-12 py-8 text-right shadow-sm">
                <div className="flex items-center justify-end gap-3 mb-5">
                  <div className="h-1.5 w-8 bg-red-600/20 rounded-full" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">État du Compte Client</h4>
                </div>
                <div className="flex items-baseline justify-end gap-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Solde Total dû :</span>
                  <p className="text-4xl font-black text-red-700 tabular-nums tracking-tighter">{totalGlobalRemaining.toLocaleString()} <span className="text-sm font-black tracking-widest ml-1 text-red-600/60 uppercase">FCFA</span></p>
                </div>
                <p className="text-[9px] font-bold text-red-400/80 uppercase tracking-widest mt-2 italic">Ce montant inclut l&apos;intégralité de l&apos;historique des lots & paiements</p>
              </div>
            </div>
          )}

          {/* Legal/Footer */}
          <div className="mt-32 text-center space-y-6 pt-12 border-t border-slate-50">
            <p className="text-[11px] font-semibold text-slate-400 max-w-xl mx-auto leading-relaxed">
              Nous vous remercions pour votre précieuse collaboration. Pour toute réclamation relative à la facturation,
              veuillez nous contacter dans un délai de 48h.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-900">IVOIRE COUVÉE D&apos;OR</p>
              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                <span>Les spécialistes de l&apos;incubation</span>
                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                <span>Korhogo-Natio</span>
                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                <span>Côte d&apos;Ivoire</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
