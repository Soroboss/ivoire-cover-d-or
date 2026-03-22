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
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ client, couvaisons, transactions, invoiceNumber, machines = [] }, ref) => {
    const totalAmount = couvaisons.reduce((acc, c) => acc + c.nombreOeufs * c.prixUnitaire, 0);
    const totalPaid = netEncaisseByClient(transactions, client.id);
    const totalCredits = totalAvoirRemiseByClient(transactions, client.id);
    const due = totalAmount - totalPaid - totalCredits;
    const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

    return (
      <div
        ref={ref}
        className="pointer-events-none w-[800px] bg-white p-12 font-sans text-brand-dark"
        style={{ position: 'absolute', top: -9999, left: -9999 }}
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
              <strong>Tél:</strong> {client.telephone}
            </p>
          </div>
        </div>

        {/* Items Table */}
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
                    <div>Incubation de {c.typeOeuf}s</div>
                    <div className="mt-0.5 text-xs text-brand-muted">
                      Machine: {c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : 'En attente'}
                    </div>
                    {mirageFait ? (
                      <>
                        <div className="mt-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Tiroirs avant mirage :</span> {avant}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Tiroirs après mirage :</span> {apres}
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">Tiroirs (casiers) :</span>{' '}
                        {formatEmplacementsLigne(c.emplacements, machines)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm">{c.nombreOeufs}</td>
                  <td className="px-4 py-4 text-right text-sm">{c.prixUnitaire.toLocaleString()} FCFA</td>
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    {(c.nombreOeufs * c.prixUnitaire).toLocaleString()} FCFA
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="mb-12 flex justify-end">
          <div className="w-1/2 rounded border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-brand-gray">Total Prestations :</span>
              <span className="font-semibold">{totalAmount.toLocaleString()} FCFA</span>
            </div>
            <div className="mb-2 flex justify-between border-t border-gray-300 pt-2">
              <span className="text-sm text-brand-gray">Net encaissé (paiements − déductions) :</span>
              <span className="font-medium text-green-700">-{totalPaid.toLocaleString()} FCFA</span>
            </div>
            {totalCredits > 0 && (
              <div className="mb-2 flex justify-between">
                <span className="text-sm text-brand-gray">Avoirs + remises :</span>
                <span className="font-medium text-purple-700">-{totalCredits.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="mt-4 flex justify-between border-t-2 border-brand-dark pt-3">
              <span className="font-bold text-brand-dark">RESTE À PAYER :</span>
              <span className="text-right text-lg font-bold text-brand-orange">{Math.max(0, due).toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

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
