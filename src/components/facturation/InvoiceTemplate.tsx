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
        className={`bg-white font-sans text-slate-900 ${preview ? 'w-full max-w-[850px] shadow-2xl rounded-xl border border-gray-100 mx-auto' : 'w-[800px]'} overflow-hidden pb-12`}
        style={preview ? { minHeight: '1100px' } : { position: 'absolute', top: -9999, left: -9999, minHeight: '1100px' }}
      >
        <div className="px-12 pt-10">
          {/* Header Section - Ignored in PDF, replaced by manual repeating header */}
          <div className="flex justify-between items-start mb-4" data-html2canvas-ignore="true">
            <div className="flex gap-4 items-center">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-20 w-20 object-contain"
                crossOrigin="anonymous"
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-brand-orange uppercase leading-tight">
                  IVOIRE COUVÉE
                </h1>
                <p className="text-lg font-bold text-slate-900 uppercase">D&apos;OR</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-medium text-slate-500 uppercase mb-2">FACTURE</h2>
              <div className="space-y-0.5 text-sm font-medium text-slate-700">
                <p>N° : <span className="font-bold">{invoiceNumber}</span></p>
                <p>Date : {format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="h-0.5 bg-brand-orange w-full mb-10" />

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-20 mb-16">
            <div className="space-y-4">
              <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">Émetteur</span>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">IVOIRE COUVÉE D&apos;OR</p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{ADRESSE_ETABLISSEMENT}</p>
                <p className="text-sm font-bold text-slate-800 mt-2">Tél: 01 03 03 64 62</p>
              </div>
            </div>
            
            <div className="space-y-4 text-right">
              <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">Destinataire</span>
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900 uppercase">{client.nom}</p>
                <div className="text-sm font-medium text-slate-700 space-y-0.5">
                  <p>ID Client : {client.clientIdExt || '—'}</p>
                  <p>Tél : {client.telephone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Détail des prestations */}
          <div className="mb-6 flex items-end justify-between border-b pb-2">
            <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">Détail des prestations</h3>
            {couvaisons.length > 0 && (
              <p className="text-[10px] font-medium text-slate-400">
                Période : {format(parseISO(couvaisons[couvaisons.length-1].dateReception), 'dd/MM/yyyy')} au {format(parseISO(couvaisons[0].dateReception), 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          <table className="w-full mb-12 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-2.5 text-left text-sm font-bold text-slate-700 pl-4">Prestation (Couvaison)</th>
                <th className="py-2.5 text-center text-sm font-bold text-slate-700">Qté d&apos;œufs</th>
                <th className="py-2.5 text-right text-sm font-bold text-slate-700">Prix Unitaire</th>
                <th className="py-2.5 text-right text-sm font-bold text-slate-700 pr-4">Sous-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couvaisons.map((c) => (
                <tr key={c.id} className="break-inside-avoid">
                  <td className="py-4 pl-4">
                    <p className="font-bold text-slate-800">Incubation de {c.typeOeuf}s</p>
                    <p className="text-[10px] text-slate-400 font-medium">Reçu le : {format(parseISO(c.dateReception), 'dd/MM/yyyy')}</p>
                  </td>
                  <td className="py-4 text-center text-sm font-medium text-slate-700">{c.nombreOeufs}</td>
                  <td className="py-4 text-right text-sm text-slate-600 font-medium">{c.prixUnitaire.toLocaleString()} F</td>
                  <td className="py-4 text-right text-sm font-bold text-slate-900 pr-4">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-between items-start gap-12 mt-12 mb-20 break-inside-avoid">
            {/* Payment History */}
            <div className="flex-1 max-w-md">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-4 border-b pb-1">Notes & Paiements Période</h4>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Aucun versement enregistré sur cette période</p>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                      <div className="flex gap-2">
                        <span>{format(parseISO(t.dateTransaction), 'dd/MM/yy')} - {t.typeTransaction}</span>
                      </div>
                      <span className="font-bold text-slate-900">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Calculation Box */}
            <div className="w-full max-w-[360px] border border-brand-orange/30 rounded-2xl p-6 space-y-4 shadow-sm bg-brand-orange/[0.02]">
              <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                <span>Somme des prestations :</span>
                <span className="text-slate-900">{totalAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase text-emerald-600 border-b border-brand-orange/20 pb-4">
                <span>Total Encaissé (Période) :</span>
                <span>-{(totalPaid + totalCredits).toLocaleString()} FCFA</span>
              </div>
              
              <div className="pt-2 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold uppercase tracking-tight text-slate-900 leading-none">Solde de la période</p>
                  <p className="text-[9px] text-slate-400 font-medium tracking-tight">À régulariser sur cette sélection</p>
                </div>
                <p className="text-3xl font-black text-brand-orange tabular-nums">
                  {Math.max(0, due).toLocaleString()} <span className="text-xs">FCFA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Global Balance Note */}
          {totalGlobalRemaining !== undefined && (
            <div className="flex justify-end mb-16 break-inside-avoid">
              <div className="bg-red-50/50 border border-red-100 rounded-xl px-10 py-6 text-right shadow-sm">
                <div className="flex items-center justify-end gap-3 mb-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-700">Bilan Global du Compte</h4>
                  <span className="text-[9px] font-medium text-red-400 italic">Incluant tout l&apos;historique</span>
                </div>
                <div className="flex items-baseline justify-end gap-4">
                  <span className="text-xs font-bold text-slate-600">Reste à payer total :</span>
                  <p className="text-3xl font-black text-red-600 tabular-nums">{totalGlobalRemaining.toLocaleString()} <span className="text-xs font-bold">FCFA</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Legal/Footer */}
          <div className="mt-20 text-center space-y-4">
            <p className="text-[11px] font-medium text-slate-500 max-w-lg mx-auto leading-relaxed">
              Merci pour votre confiance. En cas de réclamation, veuillez nous contacter dans les 48h suivant la livraison.
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800">Ivoire Couvée D&apos;Or &ndash; Les spécialistes de l&apos;incubation</p>
              <p className="text-[10px] text-slate-400 font-medium">Korhogo-Natio près de l&apos;usine de coton SICO SA</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
