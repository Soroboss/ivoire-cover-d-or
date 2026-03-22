import { forwardRef } from 'react';
import type { BulletinSalaireInput, BulletinSalaireResultat } from '../../lib/paieIvoirienne';
import { MENTION_LEGALE_PAIE_CI } from '../../lib/paieIvoirienne';

const MOIS_FR = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

type Props = {
  input: BulletinSalaireInput;
  resultat: BulletinSalaireResultat;
};

export const BulletinSalaireTemplate = forwardRef<HTMLDivElement, Props>(function BulletinSalaireTemplate(
  { input, resultat },
  ref,
) {
  const periode = `${MOIS_FR[input.periodeMois] ?? ''} ${input.periodeAnnee}`;

  return (
    <div
      ref={ref}
      id="bulletin-print-root"
      className="box-border w-[210mm] max-w-full bg-white p-8 text-sm text-slate-900 shadow-lg print:shadow-none"
      style={{ minHeight: '297mm' }}
    >
      <header className="border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Employeur</p>
            <p className="font-display text-xl font-bold text-slate-900">{input.employeurNom}</p>
            {input.employeurAdresse && <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{input.employeurAdresse}</p>}
            {input.employeurNcc && (
              <p className="mt-1 text-xs text-slate-600">
                NCC : <span className="font-mono">{input.employeurNcc}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Bulletin de salaire</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900">Période : {periode}</p>
            <p className="mt-2 text-xs text-slate-500">République de Côte d&apos;Ivoire</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-6 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Salarié</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{input.salarieNom}</p>
          {input.salarieFonction && <p className="text-slate-700">{input.salarieFonction}</p>}
          {input.salarieMatricule && (
            <p className="mt-1 text-xs text-slate-600">
              Matricule : <span className="font-mono">{input.salarieMatricule}</span>
            </p>
          )}
          {input.salarieNumeroCnps && (
            <p className="text-xs text-slate-600">
              N° CNPS : <span className="font-mono">{input.salarieNumeroCnps}</span>
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Synthèse</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Brut</dt>
              <dd className="font-semibold">{resultat.brut.toLocaleString('fr-FR')} FCFA</dd>
            </div>
            <div className="flex justify-between text-red-800">
              <dt>Cotisations salariales</dt>
              <dd>−{resultat.totalCotisationsSalariales.toLocaleString('fr-FR')}</dd>
            </div>
            <div className="flex justify-between text-red-800">
              <dt>ITS (net)</dt>
              <dd>−{resultat.itsNet.toLocaleString('fr-FR')}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-emerald-900">
              <dt>Net à payer</dt>
              <dd>{resultat.netAPayer.toLocaleString('fr-FR')} FCFA</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 border-b border-slate-300 pb-1 font-display text-sm font-bold uppercase tracking-wide text-slate-800">
          Détail des éléments
        </h2>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100">
              <th className="py-2 pl-2 font-semibold">Libellé</th>
              <th className="py-2 text-right">Base</th>
              <th className="py-2 text-right">Taux</th>
              <th className="py-2 pr-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {resultat.lignes.map((l) => (
              <tr key={`${l.code}-${l.libelle}`} className="border-b border-slate-100">
                <td className="py-2 pl-2">
                  {l.libelle}
                  {l.code === 'CNPS-R' && (
                    <span className="ml-1 text-[10px] text-slate-500">(plafond cotisation pris en compte)</span>
                  )}
                </td>
                <td className="py-2 text-right text-slate-600">{l.base != null ? l.base.toLocaleString('fr-FR') : '—'}</td>
                <td className="py-2 text-right text-slate-600">
                  {l.taux != null ? `${(l.taux * 100).toFixed(2)} %` : '—'}
                </td>
                <td
                  className={`py-2 pr-2 text-right font-medium ${
                    l.sens === 'gain' ? 'text-emerald-800' : l.sens === 'retenue' ? 'text-red-800' : 'text-slate-800'
                  }`}
                >
                  {l.sens === 'gain' && l.montant >= 0 ? '+' : ''}
                  {l.sens === 'retenue' && l.montant > 0 ? '−' : ''}
                  {Math.abs(l.montant).toLocaleString('fr-FR')} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-[11px] leading-relaxed text-amber-950">
        <p className="font-semibold">Mentions légales & calcul</p>
        <p className="mt-1">{MENTION_LEGALE_PAIE_CI}</p>
        <p className="mt-2">
          Les prestations familiales, maternité et accidents du travail relèvent en principe de la part patronale (non
          détaillée ici). Les cotisations et l&apos;ITS sont arrondis selon les règles de paie en vigueur.
        </p>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
        Document généré par Ivoire Couvée d&apos;Or — ne vaut pas engagement de l&apos;administration fiscale ou de la CNPS.
      </footer>
    </div>
  );
});
