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
        className={`bg-white font-sans text-slate-900 ${preview ? 'w-full max-w-[850px] shadow-sm rounded-lg border border-slate-200 mx-auto' : 'w-[800px]'} overflow-hidden pb-12`}
        style={preview ? { minHeight: '1100px' } : { position: 'absolute', top: -9999, left: -9999, minHeight: '1100px' }}
      >
        <div className="px-12 pt-12">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-16 border-b border-slate-200 pb-10">
            <div className="flex gap-6 items-center">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 grayscale opacity-90 object-contain"
                crossOrigin="anonymous"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  Ivoire Couvée D&apos;Or
                </h1>
                <p className="text-xs text-slate-500 font-medium">L&apos;excellence avicole au service de votre réussite</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-light text-slate-400 uppercase tracking-[0.2em] mb-4">Facture</h2>
              <div className="space-y-1 text-sm">
                <p><span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mr-2">Référence</span> <span className="font-mono">{invoiceNumber}</span></p>
                <p><span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mr-2">Émise le</span> {format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-20 mb-16">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">De la part de</h3>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">IVOIRE COUVÉE D&apos;OR</p>
                <p className="text-xs text-slate-600 leading-relaxed max-w-[250px]">{ADRESSE_ETABLISSEMENT}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">Tél: 01 03 03 64 62</p>
              </div>
            </div>
            
            <div className="space-y-4 text-right">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Facturé à</h3>
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900">{client.nom}</p>
                <p className="text-xs text-slate-500">ID: {client.clientIdExt || '—'}</p>
                <p className="text-sm font-semibold text-slate-700">{client.telephone}</p>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="mb-12">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-slate-900/10 bg-slate-50/50">
                  <th className="py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4">Description</th>
                  <th className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantité</th>
                  <th className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Prix Unitaire</th>
                  <th className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {couvaisons.map((c) => (
                  <tr key={c.id} className="break-inside-avoid">
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-800">Incubation de {c.typeOeuf}s</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Réception: {format(parseISO(c.dateReception), 'dd/MM/yyyy')}</p>
                    </td>
                    <td className="py-6 text-center text-sm font-medium text-slate-700">{c.nombreOeufs}</td>
                    <td className="py-6 text-right text-sm text-slate-500">{c.prixUnitaire.toLocaleString()} F</td>
                    <td className="py-6 text-right text-sm font-bold text-slate-900 px-4">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Payments section */}
          <div className="flex flex-col items-end gap-10 break-inside-avoid">
            <div className="w-full max-w-[400px] border-t-2 border-slate-900 pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Sous-total Prestations</span>
                <span className="font-bold">{totalAmount.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Déjà Réglé</span>
                <span className="text-slate-900 font-bold">-{(totalPaid + totalCredits).toLocaleString()} F</span>
              </div>
              
              <div className="pt-6 mt-4 border-t border-slate-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Net à payer</span>
                  <span className="text-3xl font-bold text-slate-900 tabular-nums">
                    {Math.max(0, due).toLocaleString()} <span className="text-xs font-medium ml-1">FCFA</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History - Compact and side-aligned */}
            <div className="w-full max-w-[400px]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                Détail des versements <span className="h-px flex-1 bg-slate-100" />
              </h4>
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Aucun versement enregistré</p>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="font-bold text-slate-700">{t.typeTransaction}</span>
                        <span className="text-slate-400">({format(parseISO(t.dateTransaction), 'dd/MM/yy')})</span>
                      </div>
                      <span className="font-mono font-bold">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Global Balance Note - Minimalist */}
          {totalGlobalRemaining !== undefined && (
            <div className="mt-16 p-6 rounded-lg border border-slate-200 bg-slate-50/20 flex justify-between items-center break-inside-avoid">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ÉTAT RÉCAPITULATIF DU COMPTE CLIENT</h4>
                <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">Solde prenant en compte l&apos;intégralité de l&apos;historique des transactions</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Solde Total restant dû</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{totalGlobalRemaining.toLocaleString()} <span className="text-xs">FCFA</span></p>
              </div>
            </div>
          )}

          {/* Legal/Footer */}
          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-900 mb-1">Ivoire Couvée D&apos;Or</p>
            <p className="text-[9px] text-slate-400">Korhogo-Natio près de l&apos;usine de coton SICO SA • Tél: 01 03 03 64 62</p>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-auto px-12 py-8 text-slate-400 text-[8px] flex justify-between items-center opacity-60">
          <p>Document généré le {format(new Date(), 'dd/MM/yyyy HH:mm')} • ID: {invoiceNumber}</p>
          <p>Ivoire Couvée D&apos;Or &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
