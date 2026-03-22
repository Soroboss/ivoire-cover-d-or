import { forwardRef } from 'react';
import type { Couvaison, Client, Transaction } from '../../types';
import { netEncaisseByClient, totalAvoirRemiseByClient } from '../../lib/financeCalculations';
import { format, parseISO } from 'date-fns';
import { Egg } from 'lucide-react';

interface InvoiceProps {
  client: Client;
  couvaisons: Couvaison[];
  transactions: Transaction[];
  invoiceNumber: string;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceProps>(({ client, couvaisons, transactions, invoiceNumber }, ref) => {
  const totalAmount = couvaisons.reduce((acc, c) => acc + (c.nombreOeufs * c.prixUnitaire), 0);
  const totalPaid = netEncaisseByClient(transactions, client.id);
  const totalCredits = totalAvoirRemiseByClient(transactions, client.id);
  const due = totalAmount - totalPaid - totalCredits;

  return (
    <div 
       ref={ref} 
       className="bg-white p-12 w-[800px] shadow-sm font-sans text-brand-dark pointer-events-none"
       style={{ position: 'absolute', top: -9999, left: -9999 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-brand-orange pb-6 mb-8">
        <div className="flex items-center gap-3 text-brand-orange">
          <Egg size={40} />
          <div>
             <h1 className="text-3xl font-bold uppercase tracking-wide m-0 leading-none">Ivoire Couvée</h1>
             <p className="text-sm font-semibold tracking-widest uppercase m-0 mt-1">D'Or</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-light text-brand-gray mb-2 uppercase tracking-wide">Facture</h2>
          <p className="text-sm"><strong>N°:</strong> {invoiceNumber}</p>
          <p className="text-sm"><strong>Date:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex justify-between mb-12">
        <div>
          <h3 className="text-sm font-bold text-brand-gray mb-2 uppercase bg-gray-100 inline-block px-2 py-1 rounded">Émetteur</h3>
          <p className="font-semibold text-lg">IVOIRE COUVÉE D'OR</p>
          <p className="text-sm mt-1">123 Rue de l'Incubation</p>
          <p className="text-sm">Abidjan, Côte d'Ivoire</p>
          <p className="text-sm mt-2"><strong>Tél:</strong> 0103036462</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-brand-gray mb-2 uppercase bg-gray-100 inline-block px-2 py-1 rounded">Destinataire</h3>
          <p className="font-semibold text-lg">{client.nom}</p>
          <p className="text-sm mt-2"><strong>Tél:</strong> {client.telephone}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-brand-dark">
             <th className="py-3 px-4 text-sm font-semibold border-b border-gray-200">Prestation (Couvaison)</th>
             <th className="py-3 px-4 text-sm font-semibold border-b border-gray-200 text-center">Qté d'œufs</th>
             <th className="py-3 px-4 text-sm font-semibold border-b border-gray-200 text-right">Prix Unitaire</th>
             <th className="py-3 px-4 text-sm font-semibold border-b border-gray-200 text-right">Sous-total</th>
          </tr>
        </thead>
        <tbody>
          {couvaisons.map(c => (
            <tr key={c.id} className="border-b border-gray-100">
              <td className="py-4 px-4 text-sm">
                 <div>Incubation de {c.typeOeuf}s</div>
                 <div className="text-xs text-brand-muted mt-0.5">Machine: {c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : 'En attente'}</div>
              </td>
              <td className="py-4 px-4 text-sm text-center">{c.nombreOeufs}</td>
              <td className="py-4 px-4 text-sm text-right">{c.prixUnitaire.toLocaleString()} FCFA</td>
              <td className="py-4 px-4 text-sm text-right font-medium">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} FCFA</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Box */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2 bg-gray-50 border border-gray-200 rounded p-4">
           <div className="flex justify-between mb-2">
             <span className="text-sm text-brand-gray">Total Prestations :</span>
             <span className="font-semibold">{totalAmount.toLocaleString()} FCFA</span>
           </div>
           <div className="flex justify-between mb-2 border-t pt-2 border-gray-300">
             <span className="text-sm text-brand-gray">Net encaissé (paiements − déductions) :</span>
             <span className="font-medium text-green-700">-{totalPaid.toLocaleString()} FCFA</span>
           </div>
           {totalCredits > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-brand-gray">Avoirs + remises :</span>
                <span className="font-medium text-purple-700">-{totalCredits.toLocaleString()} FCFA</span>
              </div>
           )}
           <div className="flex justify-between mt-4 border-t-2 border-brand-dark pt-3">
             <span className="font-bold text-brand-dark">RESTE À PAYER :</span>
             <span className="font-bold text-brand-orange text-lg text-right">{Math.max(0, due).toLocaleString()} FCFA</span>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 border-t border-gray-200 pt-6 text-center text-xs text-brand-muted">
         <p>Merci pour votre confiance. En cas de réclamation, veuillez nous contacter dans les 48h suivant la livraison.</p>
         <p className="mt-1 font-semibold text-brand-gray">IVOIRE COUVÉE D'OR - Les spécialistes de l'incubation</p>
      </div>
    </div>
  );
});
