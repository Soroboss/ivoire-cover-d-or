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
        className={`bg-white font-sans text-slate-800 ${preview ? 'w-full max-w-[850px] shadow-2xl rounded-xl border border-gray-100 mx-auto' : 'w-[800px]'} overflow-hidden pb-12`}
        style={preview ? { minHeight: '1100px' } : { position: 'absolute', top: -9999, left: -9999, minHeight: '1100px' }}
      >
        {/* Decorative Top Bar */}
        <div className="h-2 bg-brand-orange w-full" />

        <div className="px-12 pt-10">
          {/* Header */}
          <div className="mb-12 flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute -inset-1 bg-brand-orange/20 rounded-2xl blur-sm" />
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="relative h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-brand-orange/30 shadow-sm"
                  crossOrigin="anonymous"
                />
              </div>
              <div>
                <h1 className="m-0 text-3xl font-black uppercase tracking-tighter text-slate-900">
                  Ivoire Couvée <span className="text-brand-orange">D&apos;Or</span>
                </h1>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">L&apos;excellence avicole</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-lg mb-4">
                <h2 className="text-lg font-bold uppercase tracking-widest m-0">Facture</h2>
              </div>
              <div className="space-y-1 text-sm font-medium">
                <p><span className="text-slate-400 uppercase text-[10px] mr-2">Numéro</span> {invoiceNumber}</p>
                <p><span className="text-slate-400 uppercase text-[10px] mr-2">Date émission</span> {format(new Date(), 'dd MMMM yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Business Info Grid */}
          <div className="grid grid-cols-2 gap-12 mb-16 px-2">
            <div className="relative pl-6 border-l-2 border-brand-orange/20">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-orange mb-3">Émetteur</h3>
              <p className="text-lg font-bold text-slate-900">IVOIRE COUVÉE D&apos;OR</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed italic">{ADRESSE_ETABLISSEMENT}</p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">📞</span>
                01 03 03 64 62
              </div>
            </div>
            
            <div className="relative pl-6 border-l-2 border-slate-200">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Destinataire</h3>
              <p className="text-lg font-bold text-slate-900 underline decoration-brand-orange/30 decoration-2 underline-offset-4">{client.nom}</p>
              <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                <p className="flex justify-between border-b border-slate-50 pb-1"><span>ID CLIENT</span> <span className="text-slate-900">{client.clientIdExt || '—'}</span></p>
                <p className="flex justify-between border-b border-slate-50 pb-1"><span>TÉLÉPHONE</span> <span className="text-slate-900">{client.telephone}</span></p>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6 flex items-end justify-between px-2">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Prestations de couvaison</h3>
              <div className="h-1 w-12 bg-brand-orange mt-1 rounded-full" />
            </div>
            {couvaisons.length > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-100">
                Période du {format(parseISO(couvaisons[couvaisons.length-1].dateReception), 'dd/MM/yy')} au {format(parseISO(couvaisons[0].dateReception), 'dd/MM/yy')}
              </span>
            )}
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-500 pl-4">Description de la prestation</th>
                <th className="py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Quantité</th>
                <th className="py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Prix Unit.</th>
                <th className="py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-500 pr-4">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couvaisons.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors break-inside-avoid">
                  <td className="py-6 pl-4">
                    <p className="font-black text-slate-800 text-sm">Incubation de {c.typeOeuf}s</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                      <span className="w-1 h-1 rounded-full bg-brand-orange" />
                      Réception le {format(parseISO(c.dateReception), 'dd/MM/yyyy')}
                    </p>
                  </td>
                  <td className="py-6 text-center text-sm font-black text-slate-700">{c.nombreOeufs}</td>
                  <td className="py-6 text-right text-sm text-slate-500 font-medium">{c.prixUnitaire.toLocaleString()} F</td>
                  <td className="py-6 text-right text-sm font-black text-slate-900 pr-4">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Summary Box */}
          <div className="flex gap-12 mb-16 items-start break-inside-avoid">
            <div className="w-5/12 pt-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                Historique des paiements <span className="h-px flex-1 bg-slate-100" />
              </h4>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium">Aucun versement enregistré</p>
                  </div>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-lg border border-slate-100/50">
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase">{t.typeTransaction}</p>
                        <p className="text-[9px] font-bold text-slate-400">{format(parseISO(t.dateTransaction), 'dd/MM/yy')}</p>
                      </div>
                      <span className="text-xs font-black text-slate-900 italic">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-slate-900 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-4 relative">
                  <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <span>Sous-total Prestations</span>
                    <span className="text-white">{totalAmount.toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <span>Total Déjà Réglé</span>
                    <span>-{(totalPaid + totalCredits).toLocaleString()} F</span>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Reste à payer</p>
                      <p className="text-[9px] text-brand-orange font-bold uppercase italic">Sur cette sélection</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white leading-none">
                        {Math.max(0, due).toLocaleString()} <span className="text-[10px] text-brand-orange uppercase ml-1">FCFA</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Balance Footer - Only show if has balance */}
          {totalGlobalRemaining !== undefined && (
            <div className="px-6 py-8 rounded-2xl bg-brand-orange/5 border-2 border-dashed border-brand-orange/20 mb-12 flex justify-between items-center break-inside-avoid">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-xl">📁</div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-orange">Bilan Global du Compte</h4>
                  <p className="text-[10px] font-medium text-slate-500 italic">Prend en compte l&apos;intégralité de l&apos;historique client</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solde Total restant</p>
                <p className="text-2xl font-black text-slate-900">{totalGlobalRemaining.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
              </div>
            </div>
          )}

          {/* Company Slogan & Closing */}
          <div className="text-center py-10 opacity-70">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Ivoire Couvée D&apos;Or</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 italic italic">Les Spécialistes de l&apos;Incubation Professionnelle</p>
            <div className="w-12 h-1 bg-slate-200 mx-auto mt-4 rounded-full" />
          </div>
        </div>

        {/* Note Footer */}
        <div className="mt-auto px-12 py-6 bg-slate-50 text-slate-400 text-[9px] font-medium text-center space-y-1">
          <p>Facture générée numériquement le {format(new Date(), 'dd/MM/yyyy HH:mm')}. Valable sans signature.</p>
          <p>Veuillez nous contacter en cas de litige sous 48h. Aucun remboursement après livraison.</p>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
