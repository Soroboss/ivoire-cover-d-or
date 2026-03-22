import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Printer, ScrollText, Wallet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BulletinSalaireTemplate } from '../components/paie/BulletinSalaireTemplate';
import { SalarieAgentsPanel } from '../components/paie/SalarieAgentsPanel';
import type { BulletinSalaireInput } from '../lib/paieIvoirienne';
import { bulletinInputFromSalarieAgent, calculerBulletinSalaire, MENTION_LEGALE_PAIE_CI } from '../lib/paieIvoirienne';
import type { SalarieAgent } from '../types';

const defaultInput = (): BulletinSalaireInput => {
  const now = new Date();
  return {
    employeurNom: 'Ivoire Couvée d’Or',
    employeurAdresse: '',
    employeurNcc: '',
    salarieNom: '',
    salarieMatricule: '',
    salarieFonction: '',
    salarieNumeroCnps: '',
    periodeMois: now.getMonth() + 1,
    periodeAnnee: now.getFullYear(),
    salaireBase: 0,
    primesEtIndemnites: 0,
    autresGains: 0,
    retenuesDiverses: 0,
    reductionChargesFamille: 0,
  };
};

const BulletinSalaire = () => {
  const [input, setInput] = useState<BulletinSalaireInput>(defaultInput);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [ficheChargee, setFicheChargee] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const resultat = useMemo(() => calculerBulletinSalaire(input), [input]);

  const update = <K extends keyof BulletinSalaireInput>(key: K, value: BulletinSalaireInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const appliquerFicheSalarie = (agent: SalarieAgent) => {
    setInput((prev) => bulletinInputFromSalarieAgent(agent, prev));
    setFicheChargee(agent.nom);
  };

  const num = (v: string) => {
    const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const generatePDF = async () => {
    if (!printRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeName = (input.salarieNom || 'salarie').replace(/\s+/g, '_');
      pdf.save(`Bulletin_salaire_${safeName}_${input.periodeAnnee}-${String(input.periodeMois).padStart(2, '0')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-brand-orange/[0.06] p-6 shadow-soft sm:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-brand-dark text-white shadow-md">
              <ScrollText size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Paie — Côte d&apos;Ivoire</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
                Bulletin de salaire
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Définissez d&apos;abord ce que vous payez chaque salarié dans <strong>Mes salariés</strong>, puis chargez sa
                fiche dans le bulletin. Calcul indicatif : <strong>CNPS</strong>, <strong>CMU</strong>, <strong>ITS</strong>.
                Suivi des charges :{' '}
                <Link to="/depenses" className="font-semibold text-brand-orange hover:underline">
                  dépenses
                </Link>
                .
              </p>
            </div>
          </div>
          <Link
            to="/depenses"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <Wallet size={18} className="text-brand-orange" />
            Module Dépenses
          </Link>
        </div>
      </div>

      <SalarieAgentsPanel onApplyToBulletin={appliquerFicheSalarie} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="app-card space-y-4 p-6">
          <h2 className="font-display text-lg font-bold text-brand-dark">Données du bulletin</h2>

          {ficheChargee && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">
              Fiche salarié chargée : <strong>{ficheChargee}</strong> — vous pouvez encore modifier la période, les montants
              ou les retenues pour ce mois-ci.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Employeur</label>
            <input
              className="input-modern w-full"
              value={input.employeurNom}
              onChange={(e) => update('employeurNom', e.target.value)}
              placeholder="Raison sociale"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Adresse employeur (optionnel)</label>
            <textarea
              className="input-modern w-full resize-none"
              rows={2}
              value={input.employeurAdresse ?? ''}
              onChange={(e) => update('employeurAdresse', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">NCC (optionnel)</label>
            <input
              className="input-modern w-full"
              value={input.employeurNcc ?? ''}
              onChange={(e) => update('employeurNcc', e.target.value)}
            />
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nom & prénom du salarié</label>
            <input
              className="input-modern w-full"
              value={input.salarieNom}
              onChange={(e) => update('salarieNom', e.target.value)}
              placeholder="Ex. Kouassi Jean"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Matricule</label>
              <input
                className="input-modern w-full"
                value={input.salarieMatricule ?? ''}
                onChange={(e) => update('salarieMatricule', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">N° CNPS</label>
              <input
                className="input-modern w-full"
                value={input.salarieNumeroCnps ?? ''}
                onChange={(e) => update('salarieNumeroCnps', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Fonction</label>
            <input
              className="input-modern w-full"
              value={input.salarieFonction ?? ''}
              onChange={(e) => update('salarieFonction', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mois</label>
              <select
                className="input-modern w-full"
                value={input.periodeMois}
                onChange={(e) => update('periodeMois', Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Année</label>
              <input
                type="number"
                className="input-modern w-full"
                min={2020}
                max={2100}
                value={input.periodeAnnee}
                onChange={(e) => update('periodeAnnee', Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Salaire de base (FCFA)</label>
            <input
              className="input-modern w-full"
              inputMode="numeric"
              value={input.salaireBase || ''}
              onChange={(e) => update('salaireBase', num(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Primes & indemnités (FCFA)</label>
            <input
              className="input-modern w-full"
              inputMode="numeric"
              value={input.primesEtIndemnites || ''}
              onChange={(e) => update('primesEtIndemnites', num(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Autres gains (FCFA)</label>
            <input
              className="input-modern w-full"
              inputMode="numeric"
              value={input.autresGains || ''}
              onChange={(e) => update('autresGains', num(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Réduction charges famille RICF (FCFA)</label>
            <input
              className="input-modern w-full"
              inputMode="numeric"
              placeholder="0"
              value={input.reductionChargesFamille || ''}
              onChange={(e) => update('reductionChargesFamille', num(e.target.value))}
            />
            <p className="mt-1 text-[11px] text-slate-500">Saisie selon votre situation (DGI / bulletin officiel).</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Retenues diverses — avances, etc. (FCFA)</label>
            <input
              className="input-modern w-full"
              inputMode="numeric"
              value={input.retenuesDiverses || ''}
              onChange={(e) => update('retenuesDiverses', num(e.target.value))}
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-[11px] text-amber-950">
            {MENTION_LEGALE_PAIE_CI}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => void generatePDF()} disabled={pdfLoading} className="btn-primary inline-flex items-center gap-2">
              <FileDown size={18} />
              {pdfLoading ? 'PDF…' : 'Télécharger PDF'}
            </button>
            <button type="button" onClick={handlePrint} className="btn-secondary inline-flex items-center gap-2">
              <Printer size={18} />
              Imprimer
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-4 print:border-0 print:bg-white print:p-0">
            <div className="mx-auto flex justify-center print:w-full">
              <BulletinSalaireTemplate ref={printRef} input={input} resultat={resultat} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #bulletin-print-root,
          #bulletin-print-root * { visibility: visible; }
          #bulletin-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BulletinSalaire;
