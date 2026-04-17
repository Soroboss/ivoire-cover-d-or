import { forwardRef } from 'react';
import type { Couvaison, Client, Transaction, Machine } from '../../types';
import { netEncaisseByClient, totalAvoirRemiseByClient } from '../../lib/financeCalculations';
import { formatEmplacementsLigne } from '../../lib/casierLabels';
import { format, parseISO } from 'date-fns';

const ADRESSE_ETABLISSEMENT =
  "Korhogo-Natio près de l'usine de coton SICO SA";

interface InvoiceProps {
  client: Client;
  couvaisons: Couvaison[];
  transactions: Transaction[];
  invoiceNumber: string;
  machines?: Machine[];
  preview?: boolean;
  totalGlobalRemaining?: number;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ client, couvaisons, transactions, invoiceNumber, machines = [], preview = false, totalGlobalRemaining }, ref) => {
    const totalAmount = couvaisons.reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);
    const totalPaid = netEncaisseByClient(transactions, client.id);
    const totalCredits = totalAvoirRemiseByClient(transactions, client.id);
    const due = totalAmount - totalPaid - totalCredits;
    const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

    return (
      <div
        ref={ref}
        className={`bg-white p-12 font-sans text-brand-dark ${preview ? 'w-full max-w-[800px] shadow-lg rounded-lg border border-gray-200 mx-auto' : 'pointer-events-none w-[800px]'}`}
        style={preview ? {} : { position: 'absolute', top: -9999, left: -9999 }}
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b-2 border-brand-orange pb-6">
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt="Ivoire Couvée d'Or"
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm ring-2 ring-brand-orange/20"
              crossOrigin="anonymous"
            />
            <div>
              <h1 className="m-0 text-3xl font-bold uppercase leading-none tracking-wide text-brand-orange">
                Ivoire Couvée
              </h1>
              <p className="m-0 mt-1 text-sm font-semibold uppercase tracking-widest">D&apos;Or</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="mb-2 text-2xl font-light uppercase tracking-wide text-brand-gray">Facture</h2>
            <p className="text-sm">
              <strong>N°:</strong> {invoiceNumber}
            </p>
            <p className="text-sm">
              <strong>Date:</strong> {format(new Date(), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="mb-12 flex justify-between">
          <div>
            <h3 className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-brand-gray">
              Émetteur
            </h3>
            <p className="text-lg font-semibold">IVOIRE COUVÉE D&apos;OR</p>
            <p className="mt-1 max-w-[20rem] text-sm leading-relaxed">{ADRESSE_ETABLISSEMENT}</p>
            <p className="mt-2 text-sm">
              <strong>Tél:</strong> 01 03 03 64 62
            </p>
          </div>
          <div className="text-right">
            <h3 className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-brand-gray">
              Destinataire
            </h3>
            <p className="text-lg font-semibold">{client.nom}</p>
            <p className="mt-2 text-sm">
              <strong>ID Client:</strong> {client.clientIdExt || '—'}<br/>
              <strong>Tél:</strong> {client.telephone}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-tight text-brand-dark">Détail des prestations</h3>
          {couvaisons.length > 0 && (
            <span className="text-xs font-semibold text-brand-muted">
              Période : {format(parseISO(couvaisons[couvaisons.length-1].dateReception), 'dd/MM/yyyy')} au {format(parseISO(couvaisons[0].dateReception), 'dd/MM/yyyy')}
            </span>
          )}
        </div>
        <table className="mb-8 w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-100 text-brand-dark">
              <th className="border-b border-gray-200 px-4 py-3 text-sm font-semibold">Prestation (Couvaison)</th>
              <th className="border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold">Qté d&apos;œufs</th>
              <th className="border-b border-gray-200 px-4 py-3 text-right text-sm font-semibold">Prix Unitaire</th>
              <th className="border-b border-gray-200 px-4 py-3 text-right text-sm font-semibold">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {couvaisons.map((c) => {
              const mirageFait = c.oeufsClairs != null || c.oeufsPourris != null;
              const avant = formatEmplacementsLigne(
                mirageFait ? c.emplacementsAvantMirage ?? c.emplacements : c.emplacements,
                machines,
              );
              const apres = formatEmplacementsLigne(
                mirageFait ? c.emplacementsApresMirage ?? c.emplacements : undefined,
                machines,
              );
              return (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium underline decoration-brand-orange/20 decoration-2 underline-offset-2">Incubation de {c.typeOeuf}s</div>
                    <div className="mt-1 text-xs text-brand-muted flex items-center gap-2">
                       <span>Reçu le: {format(parseISO(c.dateReception), 'dd/MM/yy')}</span>
                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                       <span>Machine: {c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yy') : 'En attente'}</span>
                    </div>
                    {mirageFait ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1 rounded">
                          <span className="font-semibold text-slate-700 block mb-0.5">Tiroirs avant mirage :</span> {avant}
                        </div>
                        <div className="text-[10px] text-slate-500 bg-orange-50 p-1 rounded border border-orange-100/50">
                          <span className="font-semibold text-orange-700 block mb-0.5">Tiroirs après mirage :</span> {apres}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[10px] text-slate-500 italic">
                        <span className="font-semibold text-slate-700 not-italic">Tiroirs assignés :</span>{' '}
                        {formatEmplacementsLigne(c.emplacements, machines)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium">{c.nombreOeufs}</td>
                  <td className="px-4 py-4 text-right text-sm">{c.prixUnitaire.toLocaleString()} F</td>
                  <td className="px-4 py-4 text-right text-sm font-bold">
                    {(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Box and Account Summary */}
        <div className="mb-12 flex justify-between gap-8">
          <div className="w-5/12">
            <h4 className="text-xs font-bold uppercase text-brand-gray mb-3 border-b border-gray-200 pb-1">Notes & Paiements Période</h4>
            <div className="space-y-2">
               {transactions.length === 0 ? (
                 <p className="text-xs text-brand-muted italic">Aucun paiement enregistré pour cette période.</p>
               ) : (
                 transactions.map(t => (
                   <div key={t.id} className="flex justify-between text-[11px] border-b border-gray-50 pb-1">
                     <span className="text-brand-muted">{format(parseISO(t.dateTransaction), 'dd/MM/yy')} - {t.typeTransaction}</span>
                     <span className="font-medium">{(t.montantTotal - t.resteAPayer).toLocaleString()} F</span>
                   </div>
                 ))
               )}
            </div>
          </div>
          
          <div className="w-6/12 rounded-xl border-2 border-brand-orange/20 bg-brand-orange/[0.02] p-6">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-brand-gray">Somme des Prestations :</span>
              <span className="font-bold text-lg">{totalAmount.toLocaleString()} FCFA</span>
            </div>
            
            <div className="mb-3 flex justify-between items-center border-t border-brand-orange/10 pt-2">
              <span className="text-xs font-medium text-brand-muted">Total Encaissé (Période) :</span>
              <span className="font-semibold text-green-700">-{totalPaid.toLocaleString()} FCFA</span>
            </div>
            
            {totalCredits > 0 && (
              <div className="mb-3 flex justify-between items-center">
                <span className="text-xs font-medium text-brand-muted">Avoirs/Remises (Période) :</span>
                <span className="font-semibold text-purple-700">-{totalCredits.toLocaleString()} FCFA</span>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center border-t-2 border-brand-orange pt-4">
              <div className="flex flex-col">
                <span className="font-black text-brand-dark text-sm uppercase">Solde de la période</span>
                <span className="text-[10px] text-brand-muted font-medium">À régulariser sur cette sélection</span>
              </div>
              <span className="text-right text-2xl font-black text-brand-orange">
                {Math.max(0, due).toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {totalGlobalRemaining !== undefined && (
          <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-6">
            <div className="flex flex-col items-end">
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg inline-block min-w-[300px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-red-800 uppercase">BILAN GLOBAL DU COMPTE</span>
                  <span className="text-[10px] text-red-600 font-medium italic pl-4">Incluant tout l'historique</span>
                </div>
                <div className="flex justify-between items-end border-t border-red-200/50 pt-2">
                  <span className="text-xs font-semibold text-brand-dark">Reste à payer total :</span>
                  <span className="text-xl font-black text-red-600">{totalGlobalRemaining.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 border-t border-gray-200 pt-6 text-center text-xs text-brand-muted">
          <p>Merci pour votre confiance. En cas de réclamation, veuillez nous contacter dans les 48h suivant la livraison.</p>
          <p className="mt-1 font-semibold text-brand-gray">IVOIRE COUVÉE D&apos;OR - Les spécialistes de l&apos;incubation</p>
          <p className="mt-1 text-[10px] text-slate-500">{ADRESSE_ETABLISSEMENT}</p>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
