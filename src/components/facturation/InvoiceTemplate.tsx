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
        style={{ minHeight: '1050px', background: 'white' }}
      >
        <div className="px-12 pt-12">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between border-b-2 border-brand-orange pb-6">
            <div className="flex items-center gap-4">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
                crossOrigin="anonymous"
              />
              <div>
                <h1 className="m-0 text-3xl font-black uppercase leading-none tracking-tight text-brand-orange">
                  Ivoire Couvée <span className="text-slate-800">D&apos;Or</span>
                </h1>
                <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">L&apos;excellence avicole</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-2xl font-light uppercase tracking-widest text-slate-400 mb-1">Facture</h2>
              <div className="text-[11px] font-bold space-y-0.5">
                <p>N°: <span className="text-slate-900">{invoiceNumber}</span></p>
                <p>Date: <span className="text-slate-900">{format(new Date(), 'dd/MM/yyyy')}</span></p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="mb-12 flex justify-between">
            <div className="space-y-1">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-500 tracking-wider">Émetteur</span>
              <p className="text-lg font-black text-slate-900">IVOIRE COUVÉE D&apos;OR</p>
              <p className="text-sm text-slate-500 max-w-[250px] italic leading-tight">{ADRESSE_ETABLISSEMENT}</p>
              <p className="text-sm font-bold">Tél: 01 03 03 64 62</p>
            </div>
            
            <div className="text-right space-y-1">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-500 tracking-wider">Destinataire</span>
              <p className="text-lg font-black text-slate-900">{client.nom}</p>
              <div className="text-sm font-bold text-slate-800">
                <p>ID Client: <span className="text-slate-400 font-medium">{client.clientIdExt || '—'}</span></p>
                <p>Tél: <span className="text-slate-400 font-medium">{client.telephone}</span></p>
              </div>
            </div>
          </div>

          {/* Details Title */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 underline decoration-brand-orange/20 decoration-4 underline-offset-4">Détail des prestations</h3>
            {couvaisons.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400">Période : {format(parseISO(couvaisons[couvaisons.length-1].dateReception), 'dd/MM/yyyy')} au {format(parseISO(couvaisons[0].dateReception), 'dd/MM/yyyy')}</span>
            )}
          </div>

          {/* Table */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-y border-slate-100">
                <th className="py-3 px-4 text-left text-[11px] font-black uppercase tracking-widest leading-none">Prestation (Couvaison)</th>
                <th className="py-3 px-4 text-center text-[11px] font-black uppercase tracking-widest leading-none">Qté d&apos;œufs</th>
                <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-widest leading-none">Prix Unitaire</th>
                <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-widest leading-none">Sous-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couvaisons.map((c) => (
                <tr key={c.id} className="break-inside-avoid">
                  <td className="py-4 px-4">
                    <p className="font-black text-slate-900 text-sm">Incubation de {c.typeOeuf}s</p>
                    <p className="text-[10px] text-slate-400">Reçu le: {format(parseISO(c.dateReception), 'dd/MM/yyyy')}</p>
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-bold text-slate-600">{c.nombreOeufs}</td>
                  <td className="py-4 px-4 text-right text-sm text-slate-500 italic">{c.prixUnitaire.toLocaleString()} F</td>
                  <td className="py-4 px-4 text-right text-sm font-black text-slate-900">{ (c.nombreOeufs * c.prixUnitaire).toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex gap-8 mb-12 items-start break-inside-avoid">
            <div className="w-5/12 pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-1 italic">Notes & Paiements Période</h4>
              <div className="space-y-1.5">
                {transactions.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Aucun paiement enregistré pour cette période.</p>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>{format(parseISO(t.dateTransaction), 'dd/MM/yy')} - Versement</span>
                      <span className="font-bold text-slate-800">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 p-6 rounded-2xl border border-brand-orange/20 bg-white shadow-sm space-y-4">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-800">
                <span>Somme des Prestations :</span>
                <span className="text-base">{totalAmount.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span className="italic font-medium">Total Encaissé (Période) :</span>
                <span className="text-emerald-500 font-black">-{totalPaid.toLocaleString()} FCFA</span>
              </div>

              {totalCredits > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="italic font-medium">Avoirs & Remises :</span>
                  <span className="text-slate-900 font-black">-{totalCredits.toLocaleString()} FCFA</span>
                </div>
              )}

              <div className="pt-4 border-t-2 border-brand-orange mt-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 uppercase">Solde de la période</span>
                  <span className="text-[9px] text-slate-400 italic font-medium tracking-tight">À régulariser sur cette sélection</span>
                </div>
                <span className="text-3xl font-black text-brand-orange">
                  {Math.max(0, due).toLocaleString()} <span className="text-xs ml-1">FCFA</span>
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t-2 border-dashed border-slate-100 mb-8" />

          {/* Global Reminder Box */}
          {totalGlobalRemaining !== undefined && (
            <div className="max-w-[400px] ml-auto p-4 rounded-xl bg-gray-50/80 border border-slate-100 flex flex-col gap-2 break-inside-avoid shadow-inner">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Bilan Global du Compte</h4>
                  <span className="text-[9px] text-slate-400 italic">Incluant tout l'historique</span>
               </div>
               <div className="flex justify-between items-end border-t border-slate-200 mt-1 pt-2">
                 <span className="text-[11px] font-bold text-slate-600">Reste à payer total :</span>
                 <span className="text-2xl font-black text-slate-900 underline decoration-brand-orange decoration-4">{totalGlobalRemaining.toLocaleString()} <span className="text-[10px] no-underline">FCFA</span></span>
               </div>
            </div>
          )}

          {/* Official Closure */}
          <div className="text-center mt-20 pt-8 border-t border-gray-100 text-[11px] text-slate-400">
            <p>Merci pour votre confiance. En cas de réclamation, veuillez nous contacter sous 48h.</p>
            <p className="mt-1 font-black uppercase text-slate-700">Ivoire Couvée D&apos;Or - Les spécialistes de l&apos;incubation</p>
            <p className="text-[10px]">{ADRESSE_ETABLISSEMENT}</p>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
