import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Landmark,
  Download,
  FileSpreadsheet,
  FileJson,
  Building2,
  TrendingUp,
  TrendingDown,
  Scale,
  CalendarRange,
  ShieldCheck,
} from 'lucide-react';
import { useAppContext } from '../context/AppProvider';
import {
  buildTreasuryMovements,
  soldeCaisseAvantDate,
  addRunningCashBalance,
  buildMonthlyAggregates,
  toCsvSemicolon,
  downloadBlob,
  type TreasuryLineWithBalance,
} from '../lib/treasury';
import { totalAvoirsRemisesGlobal, netEncaisseGlobal } from '../lib/financeCalculations';

function startOfDayIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function endOfDayIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

const Tresorerie = () => {
  const { transactions, clients, couvaisons } = useAppContext();

  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  const movementsAll = useMemo(
    () => buildTreasuryMovements(transactions, clients, couvaisons),
    [transactions, clients, couvaisons],
  );

  const movementsFiltered = useMemo(() => {
    const t0 = new Date(startOfDayIso(dateFrom)).getTime();
    const t1 = new Date(endOfDayIso(dateTo)).getTime();
    return movementsAll.filter((m) => {
      const t = new Date(m.dateIso).getTime();
      return t >= t0 && t <= t1;
    });
  }, [movementsAll, dateFrom, dateTo]);

  const soldeInitial = useMemo(
    () => soldeCaisseAvantDate(transactions, startOfDayIso(dateFrom)),
    [transactions, dateFrom],
  );

  const linesWithBalance = useMemo(
    () => addRunningCashBalance(movementsFiltered, soldeInitial),
    [movementsFiltered, soldeInitial],
  );

  const kpis = useMemo(() => {
    const entrees = movementsFiltered.reduce((s, m) => s + m.entreeCaisse, 0);
    const sorties = movementsFiltered.reduce((s, m) => s + m.sortieCaisse, 0);
    const net = entrees - sorties;
    const ajust = movementsFiltered.reduce((s, m) => s + m.ajustementCreance, 0);
    return { entrees, sorties, net, ajust, n: movementsFiltered.length };
  }, [movementsFiltered]);

  const globalNet = useMemo(() => netEncaisseGlobal(transactions), [transactions]);
  const globalAvoirs = useMemo(() => totalAvoirsRemisesGlobal(transactions), [transactions]);

  const monthlyAll = useMemo(() => buildMonthlyAggregates(movementsAll), [movementsAll]);

  const exportJournalComplet = () => {
    const header = [
      'Date',
      'Heure',
      'Référence pièce',
      'Client',
      'Type opération',
      'Lot',
      'Entrée caisse (FCFA)',
      'Sortie caisse (FCFA)',
      'Ajustement créance Avoir/Remise (FCFA)',
      'Impact net caisse (FCFA)',
      'Solde caisse cumulé (FCFA)',
      'Notes',
    ];
    const rows: string[][] = [header];
    for (const m of linesWithBalance) {
      const dt = parseISO(m.dateIso);
      rows.push([
        format(dt, 'dd/MM/yyyy', { locale: fr }),
        format(dt, 'HH:mm:ss'),
        m.reference,
        m.clientName,
        m.typeLabel,
        m.lotLabel,
        m.entreeCaisse ? String(m.entreeCaisse) : '',
        m.sortieCaisse ? String(m.sortieCaisse) : '',
        m.ajustementCreance ? String(m.ajustementCreance) : '',
        String(m.impactCaisseNet),
        String(m.soldeCaisseCumule),
        m.notes ?? '',
      ]);
    }
    downloadBlob(
      `tresorerie_journal_${dateFrom}_${dateTo}.csv`,
      toCsvSemicolon(rows),
      'text/csv;charset=utf-8',
    );
  };

  /** Format orienté banque : mouvements avec débit / crédit / solde */
  const exportFormatBanque = () => {
    const header = [
      'Date',
      'Référence',
      'Libellé',
      'Contrepartie (client)',
      'Débit (FCFA)',
      'Crédit (FCFA)',
      'Solde après opération (FCFA)',
    ];
    const rows: string[][] = [header];
    for (const m of linesWithBalance) {
      const dt = parseISO(m.dateIso);
      const libelle = `${m.typeLabel} — ${m.lotLabel}`;
      const debit = m.sortieCaisse ? String(m.sortieCaisse) : '';
      const credit = m.entreeCaisse ? String(m.entreeCaisse) : '';
      if (!m.entreeCaisse && !m.sortieCaisse && m.ajustementCreance) {
        // Avoir/Remise : pas de flux caisse — ligne informative
        rows.push([
          format(dt, 'dd/MM/yyyy', { locale: fr }),
          m.reference,
          `${libelle} (ajustement créance, hors caisse)`,
          m.clientName,
          '',
          '',
          String(m.soldeCaisseCumule),
        ]);
      } else {
        rows.push([
          format(dt, 'dd/MM/yyyy', { locale: fr }),
          m.reference,
          libelle,
          m.clientName,
          debit,
          credit,
          String(m.soldeCaisseCumule),
        ]);
      }
    }
    downloadBlob(
      `tresorerie_releve_bancaire_${dateFrom}_${dateTo}.csv`,
      toCsvSemicolon(rows),
      'text/csv;charset=utf-8',
    );
  };

  const exportSyntheseMensuelle = () => {
    const filteredMonthly = buildMonthlyAggregates(movementsFiltered);
    const header = [
      'Mois',
      'Encaissements (FCFA)',
      'Décaissements / déductions (FCFA)',
      'Net trésorerie (FCFA)',
      'Avoirs + remises (créance) (FCFA)',
      'Nombre d’opérations',
    ];
    const rows: string[][] = [header];
    for (const m of filteredMonthly) {
      rows.push([
        m.moisLabel,
        String(m.entrees),
        String(m.sorties),
        String(m.netCaisse),
        String(m.avoirsRemises),
        String(m.nombreOperations),
      ]);
    }
    downloadBlob(
      `tresorerie_synthese_mensuelle_${dateFrom}_${dateTo}.csv`,
      toCsvSemicolon(rows),
      'text/csv;charset=utf-8',
    );
  };

  const exportSyntheseGlobaleMensuelle = () => {
    const header = [
      'Mois',
      'Encaissements (FCFA)',
      'Décaissements (FCFA)',
      'Net trésorerie (FCFA)',
      'Avoirs + remises (FCFA)',
      'Nombre d’opérations',
    ];
    const rows: string[][] = [header];
    for (const m of monthlyAll) {
      rows.push([
        m.moisLabel,
        String(m.entrees),
        String(m.sorties),
        String(m.netCaisse),
        String(m.avoirsRemises),
        String(m.nombreOperations),
      ]);
    }
    downloadBlob(`tresorerie_evolution_mensuelle_complete.csv`, toCsvSemicolon(rows), 'text/csv;charset=utf-8');
  };

  const exportJsonAudit = () => {
    const payload = {
      genereLe: new Date().toISOString(),
      periode: { du: dateFrom, au: dateTo },
      soldeCaisseDebutPeriode: soldeInitial,
      soldeCaisseFinPeriode: linesWithBalance.length ? linesWithBalance[linesWithBalance.length - 1].soldeCaisseCumule : soldeInitial,
      totauxPeriode: kpis,
      totauxDepuisOrigine: { netEncaisseGlobal: globalNet, avoirsRemisesGlobal: globalAvoirs },
      mouvements: linesWithBalance,
    };
    downloadBlob(
      `tresorerie_audit_${dateFrom}_${dateTo}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
  };

  const exportExcelFlat = () => {
    const header = ['Date complète ISO', 'Référence', 'Client', 'Type', 'Entrée', 'Sortie', 'Ajustement créance', 'Solde'];
    const rows: string[][] = [header];
    for (const m of linesWithBalance) {
      rows.push([
        m.dateIso,
        m.reference,
        m.clientName,
        m.typeLabel,
        String(m.entreeCaisse),
        String(m.sortieCaisse),
        String(m.ajustementCreance),
        String(m.soldeCaisseCumule),
      ]);
    }
    downloadBlob(`tresorerie_export_plat_${dateFrom}_${dateTo}.csv`, toCsvSemicolon(rows), 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-brand-orange/[0.06] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-brand-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-hover text-white shadow-md">
              <Landmark size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pilotage & partenaires</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
                Trésorerie & banque
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Journal des flux de caisse, soldes cumulés et exports conformes pour transmission à votre banque ou
                comptable. Les <strong>entrées</strong> correspondent aux <strong>encaissements</strong>, les{' '}
                <strong>sorties</strong> aux <strong>déductions sur encaisse</strong> ; les avoirs et remises sont
                suivis comme <strong>ajustements de créance</strong> (hors flux caisse).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>Données issues des opérations enregistrées dans l&apos;application</span>
          </div>
        </div>
      </div>

      {/* Filtres période */}
      <div className="app-card flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarRange className="h-4 w-4 text-brand-orange" />
          Période d&apos;analyse
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 sm:ml-auto sm:max-w-sm">
          Solde caisse au début de période (cumul des flux avant le {format(parseISO(startOfDayIso(dateFrom)), 'dd/MM/yyyy', { locale: fr })}) :{' '}
          <strong className="text-brand-dark">{soldeInitial.toLocaleString()} FCFA</strong>
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Encaissements</p>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-brand-dark">{kpis.entrees.toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-500">Paiements sur la période</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Décaissements</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-brand-dark">{kpis.sorties.toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-500">Déductions sur encaisse</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net trésorerie</p>
            <Scale className="h-5 w-5 text-brand-orange" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-brand-dark">{kpis.net.toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-500">{kpis.n} opération(s)</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ajustements créance</p>
            <Building2 className="h-5 w-5 text-violet-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-brand-dark">{kpis.ajust.toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-500">Avoirs + remises (hors caisse)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-700">
        <strong>Rappel</strong> — Depuis l&apos;origine : net encaissé global <strong>{globalNet.toLocaleString()} FCFA</strong>
        {' · '}
        avoirs/remises cumulés <strong>{globalAvoirs.toLocaleString()} FCFA</strong> (sur créances clients).
      </div>

      {/* Exports */}
      <div className="app-card p-6">
        <h2 className="font-display flex items-center gap-2 text-lg font-bold text-brand-dark">
          <Download className="h-5 w-5 text-brand-orange" />
          Exports pour la banque / comptabilité
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Fichiers CSV avec séparateur point-virgule, encodage UTF-8 avec BOM (ouverture directe dans Excel). Format JSON
          pour audit ou intégration outil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportJournalComplet}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={18} className="text-brand-orange" />
            Journal complet + solde
          </button>
          <button
            type="button"
            onClick={exportFormatBanque}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <Landmark size={18} className="text-brand-orange" />
            Relevé type banque (Débit / Crédit / Solde)
          </button>
          <button
            type="button"
            onClick={exportSyntheseMensuelle}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Synthèse mensuelle (période)
          </button>
          <button
            type="button"
            onClick={exportSyntheseGlobaleMensuelle}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={18} className="text-violet-600" />
            Évolution mensuelle (tout historique)
          </button>
          <button
            type="button"
            onClick={exportExcelFlat}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={18} className="text-slate-600" />
            Tableau plat (période)
          </button>
          <button
            type="button"
            onClick={exportJsonAudit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
          >
            <FileJson size={18} className="text-amber-600" />
            Audit JSON (période)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="app-card overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-brand-dark">Mouvements de trésorerie</h2>
          <p className="text-xs text-slate-500">Tri chronologique — solde caisse après chaque ligne (flux réels uniquement)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-0 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Date</th>
                <th className="whitespace-nowrap px-4 py-3">Réf.</th>
                <th className="min-w-[140px] px-4 py-3">Client</th>
                <th className="px-4 py-3">Type</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">Entrée</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-red-700">Sortie</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-violet-700">Ajust. créance</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Solde caisse</th>
              </tr>
            </thead>
            <tbody>
              {linesWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Aucun mouvement sur cette période.
                  </td>
                </tr>
              ) : (
                linesWithBalance.map((m: TreasuryLineWithBalance) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-brand-cream/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {format(parseISO(m.dateIso), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{m.reference}</td>
                    <td className="px-4 py-3 font-medium text-brand-dark">{m.clientName}</td>
                    <td className="px-4 py-3 text-slate-600">{m.typeLabel}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-800">
                      {m.entreeCaisse ? m.entreeCaisse.toLocaleString() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-red-800">
                      {m.sortieCaisse ? m.sortieCaisse.toLocaleString() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-violet-800">
                      {m.ajustementCreance ? m.ajustementCreance.toLocaleString() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-brand-dark">
                      {m.soldeCaisseCumule.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tresorerie;
