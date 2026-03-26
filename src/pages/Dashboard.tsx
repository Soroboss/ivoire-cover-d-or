import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import {
  Egg,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  Users,
  Shield,
  Clock,
  Factory,
  ArrowRight,
  Sparkles,
  Wallet,
  Target,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';
import { format, isToday, isThisWeek, isThisMonth, isThisYear, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Granularity } from '../lib/dashboardStats';
import {
  buildEclosionRateSeries,
  buildEggTypePercentByPeriod,
  buildComparisonSeries,
  buildPerformanceStats,
  buildEggTypeEclosionRate,
  buildClientPerformanceTable,
} from '../lib/dashboardStats';
import { hasPermission } from '../lib/permissions';

const TYPE_COLORS: Record<string, string> = {
  Poule: '#ea580c',
  Caille: '#ca8a04',
  Pintade: '#7c3aed',
  Canard: '#2563eb',
  Dinde: '#db2777',
  Oie: '#0d9488',
  Autre: '#64748b',
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#64748b'];

type KpiProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'orange' | 'emerald' | 'violet' | 'slate';
};

const variantRing: Record<NonNullable<KpiProps['variant']>, string> = {
  default: 'from-slate-400/20 to-slate-100/80',
  orange: 'from-brand-orange/25 to-amber-50/90',
  emerald: 'from-emerald-400/20 to-emerald-50/90',
  violet: 'from-violet-400/20 to-violet-50/90',
  slate: 'from-slate-500/15 to-slate-50/90',
};

const KpiCard = ({ title, value, subtitle, icon, variant = 'default' }: KpiProps) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft transition-all duration-300 hover:border-brand-orange/25 hover:shadow-soft-lg`}
  >
    <div
      className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl ${variantRing[variant]}`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-dark sm:text-[1.65rem]">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/15 to-brand-orange/5 text-brand-orange ring-1 ring-brand-orange/20">
        {icon}
      </div>
    </div>
  </div>
);

const ChartCard = ({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6 ${className}`}>
    <div className="mb-5">
      <h2 className="font-display text-lg font-bold text-brand-dark">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const EmptyChart = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50/80 text-sm text-slate-500">{children}</div>
);

const Dashboard = () => {
  const { couvaisons, transactions, clients, machines, depenses } = useAppContext();
  const { currentUser } = useAuth();
  const isCaisse = currentUser?.role === 'Réception/Caisse';

  const [clientFilter, setClientFilter] = useState<string>('all');
  const [granularity, setGranularity] = useState<Granularity>('month');

  const todayLabel = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  const filteredCouvaisons = useMemo(() => {
    if (clientFilter === 'all') return couvaisons;
    return couvaisons.filter((c) => c.clientId === clientFilter);
  }, [couvaisons, clientFilter]);

  const activeCouvaisons = filteredCouvaisons.filter((c) => c.statut === 'En cours').length;
  const pendingLots = filteredCouvaisons.filter((c) => c.statut === 'En attente').length;
  const completedLots = filteredCouvaisons.filter((c) => c.statut === 'Terminé').length;
  const totalEggs = filteredCouvaisons.filter((c) => c.statut === 'En cours').reduce((acc, c) => acc + c.nombreOeufs, 0);

  const machinesEnService = useMemo(() => machines.filter((m) => m.enService).length, [machines]);

  const completed = filteredCouvaisons.filter((c) => c.statut === 'Terminé');
  const totalCompletedEggs = completed.reduce((acc, c) => acc + c.nombreOeufs, 0);
  const totalChicks = completed.reduce((acc, c) => acc + (c.poussinsNes || 0), 0);
  const successRate = totalCompletedEggs > 0 ? Math.round((totalChicks / totalCompletedEggs) * 100) : 0;

  const eclosionRateSeries = useMemo(
    () => buildEclosionRateSeries(filteredCouvaisons, granularity),
    [filteredCouvaisons, granularity],
  );
  const { rows: eggTypePctRows, types: eggTypesForChart } = useMemo(
    () => buildEggTypePercentByPeriod(filteredCouvaisons, granularity),
    [filteredCouvaisons, granularity],
  );

  const perfStats = useMemo(() => buildPerformanceStats(filteredCouvaisons), [filteredCouvaisons]);
  const eggTypeRates = useMemo(() => buildEggTypeEclosionRate(filteredCouvaisons), [filteredCouvaisons]);
  const clientPerfTable = useMemo(() => buildClientPerformanceTable(filteredCouvaisons, clients), [filteredCouvaisons, clients]);

  const scopedTransactions = useMemo(() => {
    if (clientFilter === 'all') return transactions;
    return transactions.filter((t) => t.clientId === clientFilter);
  }, [transactions, clientFilter]);


  const totalRevenue = scopedTransactions.reduce((acc, t) => acc + t.montantTotal, 0);
  const todayRevenue = scopedTransactions
    .filter((t) => isToday(parseISO(t.dateTransaction)))
    .reduce((acc, t) => acc + t.montantTotal, 0);
  const weekRevenue = scopedTransactions
    .filter((t) => isThisWeek(parseISO(t.dateTransaction), { weekStartsOn: 1 }))
    .reduce((acc, t) => acc + t.montantTotal, 0);
  const monthRevenue = scopedTransactions
    .filter((t) => isThisMonth(parseISO(t.dateTransaction)))
    .reduce((acc, t) => acc + t.montantTotal, 0);
  const yearRevenue = scopedTransactions
    .filter((t) => isThisYear(parseISO(t.dateTransaction)))
    .reduce((acc, t) => acc + t.montantTotal, 0);

  const scopedDepenses = useMemo(() => {
    // Les dépenses ne sont pas liées aux clients, mais on peut les filtrer par période si besoin.
    // Pour l'instant on prend tout ou on pourrait filtrer par date si le dashboard avait un range.
    return depenses;
  }, [depenses]);

  const totalExpenses = scopedDepenses.reduce((acc, d) => acc + d.montant, 0);
  const todayExpenses = scopedDepenses
    .filter((d) => isToday(parseISO(d.dateDepense)))
    .reduce((acc, d) => acc + d.montant, 0);

  const monthExpenses = scopedDepenses
    .filter((d) => isThisMonth(parseISO(d.dateDepense)))
    .reduce((acc, d) => acc + d.montant, 0);


  const netCaisseToday = todayRevenue - todayExpenses;
  const netCaisseMonth = monthRevenue - monthExpenses;


  const comparisonSeries = useMemo(
    () => buildComparisonSeries(scopedTransactions, scopedDepenses),
    [scopedTransactions, scopedDepenses],
  );

  const todayAlerts = couvaisons
    .filter((c) => c.statut === 'En cours')
    .map((c) => {
      if (!c.dateMiragePrevue || !c.dateEclosionPrevue) return null;
      try {
        const isMirageDay =
          isToday(parseISO(c.dateMiragePrevue)) || (isPast(parseISO(c.dateMiragePrevue)) && c.oeufsClairs === undefined);
        const isEclosionDay =
          isToday(parseISO(c.dateEclosionPrevue)) ||
          (isPast(parseISO(c.dateEclosionPrevue)) && c.poussinsNes === undefined);

        if (isMirageDay) return { id: c.id, type: 'Mirage' as const, client: c.clientId, date: c.dateMiragePrevue, couvais: c };
        if (isEclosionDay)
          return { id: c.id, type: 'Éclosion' as const, client: c.clientId, date: c.dateEclosionPrevue, couvais: c };
      } catch {
        /* ignore */
      }
      return null;
    })
    .filter(Boolean);

  const failureCauses = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCouvaisons.forEach((c) => {
      if (c.causeEchecMajeure && c.causeEchecMajeure !== 'Aucune') {
        counts[c.causeEchecMajeure] = (counts[c.causeEchecMajeure] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredCouvaisons]);

  const expensesByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedDepenses.forEach((d) => {
      const cat = d.categorie || 'Autre';
      counts[cat] = (counts[cat] || 0) + d.montant;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scopedDepenses]);

  const canFinances = currentUser && hasPermission(currentUser, 'finances');
  const canMachines = currentUser && hasPermission(currentUser, 'machines');
  const canCouvaisons = currentUser && hasPermission(currentUser, 'couvaisons');
  const canClients = currentUser && hasPermission(currentUser, 'clients');

  const tooltipStyle = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.15)',
  };

  return (
    <div className="animate-in fade-in space-y-8 pb-8 duration-500">
      {/* Bandeau admin */}
      {currentUser && hasPermission(currentUser, 'administration') && (
        <Link
          to="/utilisateurs"
          className="group flex flex-col gap-3 rounded-2xl border border-dashed border-brand-orange/40 bg-gradient-to-r from-brand-orange/10 via-white to-amber-50/50 p-4 shadow-sm transition-all hover:border-brand-orange/60 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white shadow-md">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-brand-dark">Administration</p>
              <p className="text-sm text-slate-600">Comptes, rôles et accès à l&apos;application</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange group-hover:gap-2">
            Ouvrir le module <ArrowRight size={16} />
          </span>
        </Link>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-brand-orange/[0.07] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-6 top-0 h-40 w-40 rounded-full bg-brand-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              Couvoir · incubation &amp; suivi
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 shrink-0 text-brand-orange" />
              {todayLabel}
            </p>
          </div>

          {!isCaisse && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                <label htmlFor="dash-client" className="sr-only">
                  Filtrer par client
                </label>
                <select
                  id="dash-client"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="min-w-[200px] rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-3 pr-8 text-sm font-medium text-brand-dark shadow-sm backdrop-blur focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
                >
                  <option value="all">Tous les clients</option>
                  {clients
                    .slice()
                    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
                    .map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.nom}
                      </option>
                    ))}
                </select>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
                {(['week', 'month', 'year'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      granularity === g
                        ? 'bg-brand-orange text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g === 'week' ? 'Semaine' : g === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Raccourcis métier */}
        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-slate-200/60 pt-6">
          {canCouvaisons && (
            <Link
              to="/couvaisons"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-brand-dark-mid"
            >
              Lots &amp; couvaisons <ArrowRight size={14} />
            </Link>
          )}
          {canClients && (
            <Link
              to="/clients"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
            >
              Clients
            </Link>
          )}
          {canFinances && (
            <Link
              to="/finances"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
            >
              Finances
            </Link>
          )}
          {canFinances && (
            <Link
              to="/tresorerie"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
            >
              Trésorerie &amp; banque
            </Link>
          )}
          {canMachines && (
            <Link
              to="/machines"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
            >
              Parc machines
            </Link>
          )}
        </div>
      </div>

      {!isCaisse && clientFilter !== 'all' && (
        <div className="rounded-2xl border border-brand-orange/20 bg-gradient-to-r from-brand-orange/10 to-amber-50/90 p-5 shadow-soft">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-brand-orange/30">
              <Target className="h-6 w-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Performance (client filtré)</p>
              <p className="font-display text-xl font-bold text-brand-dark">
                Taux d&apos;éclosion : <span className="text-brand-orange">{perfStats.taux}%</span>
              </p>
              <p className="text-sm text-slate-600">
                {perfStats.lotsTermines} lot(s) terminé(s) · {perfStats.poussins.toLocaleString()} poussins /{' '}
                {perfStats.oeufs.toLocaleString()} œufs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NOUVELLE SECTION PERFORMANCES & ECLOSIONS (SCREENSHOT 1) */}
      {!isCaisse && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-dark uppercase tracking-tight">Performances & Éclosions</h2>
            <p className="text-sm text-slate-500">Analyse des taux de réussite et productivité</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
             <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft flex flex-col items-center text-center group hover:shadow-soft-lg transition-all">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <TrendingUp size={32} />
                </div>
                <div className="font-display text-4xl font-black text-brand-dark mb-2">{perfStats.taux}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Taux d'éclosion global</div>
                <div className="text-[10px] text-slate-400 font-medium">(Poussins / Œufs mis)</div>
             </div>

             <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft flex flex-col items-center text-center group hover:shadow-soft-lg transition-all">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Egg size={32} />
                </div>
                <div className="font-display text-4xl font-black text-brand-dark mb-2">{perfStats.tauxFertilite}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Taux de fertilité</div>
                <div className="text-[10px] text-slate-400 font-medium">(Œufs fertiles au mirage)</div>
             </div>

             <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft flex flex-col items-center text-center group hover:shadow-soft-lg transition-all">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <CheckCircle size={32} />
                </div>
                <div className="font-display text-4xl font-black text-brand-dark mb-2">{perfStats.tauxReussite}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Taux de réussite</div>
                <div className="text-[10px] text-slate-400 font-medium">(Poussins / Œufs fertiles)</div>
             </div>
          </div>
        </section>
      )}

      {isCaisse ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Caisse aujourd'hui"
            value={`${todayRevenue.toLocaleString()} FCFA`}
            icon={<Wallet size={22} />}
            variant="emerald"
          />
          <KpiCard
            title="Caisse semaine"
            value={`${weekRevenue.toLocaleString()} FCFA`}
            icon={<TrendingUp size={22} />}
            variant="emerald"
          />
          <KpiCard
            title="Caisse mois"
            value={`${monthRevenue.toLocaleString()} FCFA`}
            icon={<TrendingUp size={22} />}
            variant="violet"
          />
          <KpiCard
            title="Caisse année"
            value={`${yearRevenue.toLocaleString()} FCFA`}
            icon={<TrendingUp size={22} />}
            variant="orange"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Lots en cours"
              value={activeCouvaisons}
              subtitle={`${pendingLots} en attente · ${completedLots} terminés`}
              icon={<CalendarDays size={22} />}
              variant="orange"
            />
            <KpiCard
              title="Œufs en machine"
              value={totalEggs.toLocaleString()}
              subtitle="Lots actifs (incubation)"
              icon={<Egg size={22} />}
              variant="orange"
            />
            <KpiCard
              title="Taux de réussite"
              value={`${successRate}%`}
              subtitle="Poussins / œufs (lots terminés)"
              icon={<CheckCircle size={22} />}
              variant="emerald"
            />
            <KpiCard
              title="Volume d'affaires"
              value={`${totalRevenue.toLocaleString()} FCFA`}
              subtitle="Transactions enregistrées"
              icon={<TrendingUp size={22} />}
              variant="violet"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              title="Machines en service"
              value={machinesEnService}
              subtitle={`${machines.length} au total`}
              icon={<Factory size={22} />}
              variant="slate"
            />
            <KpiCard
              title="Clients référencés"
              value={clients.length}
              subtitle="Base clients"
              icon={<Users size={22} />}
              variant="slate"
            />
            <KpiCard
              title="Lots suivis"
              value={filteredCouvaisons.length}
              subtitle={clientFilter === 'all' ? 'Tous clients' : 'Client filtré'}
              icon={<Clock size={22} />}
              variant="slate"
            />
          </div>

          {canFinances && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard
                title="Caisse Nette Jour"
                value={`${netCaisseToday.toLocaleString()} F`}
                subtitle={`Reçus: ${todayRevenue.toLocaleString()} / Dép: ${todayExpenses.toLocaleString()}`}
                icon={<Wallet size={20} />}
                variant={netCaisseToday >= 0 ? 'emerald' : 'orange'}
              />
              <KpiCard
                title="Caisse Nette Mois"
                value={`${netCaisseMonth.toLocaleString()} F`}
                subtitle={`Reçus: ${monthRevenue.toLocaleString()} / Dép: ${monthExpenses.toLocaleString()}`}
                icon={<TrendingUp size={20} />}
                variant={netCaisseMonth >= 0 ? 'violet' : 'orange'}
              />
              <KpiCard
                title="Total Dépenses"
                value={`${totalExpenses.toLocaleString()} F`}
                subtitle="Hors flux clients"
                icon={<ArrowDownCircle size={20} />}
                variant="orange"
              />
              <KpiCard
                title="Chiffre d'affaires"
                value={`${totalRevenue.toLocaleString()} F`}
                subtitle="Ventes brutes"
                icon={<ArrowUpCircle size={20} />}
                variant="emerald"
              />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!isCaisse && (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ChartCard
                  className="lg:col-span-3"
                  title="Types d'œufs — % par période"
                  subtitle="Répartition des lots (œufs) par date de réception"
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      {eggTypePctRows.length > 0 && eggTypesForChart.length > 0 ? (
                        <BarChart data={eggTypePctRows}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b' }}
                            unit="%"
                            domain={[0, 100]}
                          />
                          <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, '']} contentStyle={tooltipStyle} />
                          <Legend />
                          {eggTypesForChart.map((t) => (
                            <Bar key={t} dataKey={t} stackId="types" fill={TYPE_COLORS[t] || '#94a3b8'} name={t} />
                          ))}
                        </BarChart>
                      ) : (
                        <EmptyChart>Aucune donnée pour cette période</EmptyChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  className="lg:col-span-1"
                  title="Taux d'éclosion par Type d'Œuf"
                  subtitle="Moyenne des lots terminés"
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {eggTypeRates.length > 0 ? (
                        <BarChart data={eggTypeRates}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b' }} 
                            domain={[0, 100]}
                            unit="%"
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }} 
                            contentStyle={tooltipStyle}
                            formatter={(value) => [`${value}%`, 'Taux']}
                          />
                          <Bar dataKey="rate" fill="#f97316" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : (
                        <EmptyChart>Aucune donnée</EmptyChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  className="lg:col-span-2"
                  title="Évolution du Taux Global"
                  subtitle="Lots terminés, pondérés œufs / poussins"
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {eclosionRateSeries.length > 0 ? (
                        <LineChart data={eclosionRateSeries}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b' }}
                            unit="%"
                          />
                          <Tooltip
                            formatter={(value) => [`${Number(value ?? 0)}%`, 'Taux']}
                            contentStyle={tooltipStyle}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name="Taux d'éclosion"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                          />
                        </LineChart>
                      ) : (
                        <EmptyChart>Pas assez de données</EmptyChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Causes d'échec majeur" subtitle="Lots terminés avec cause renseignée">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {failureCauses.length > 0 ? (
                        <PieChart>
                          <Pie
                            data={failureCauses}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {failureCauses.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend verticalAlign="bottom" height={40} iconType="circle" />
                        </PieChart>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-xl bg-emerald-50/80 text-emerald-700">
                          <CheckCircle size={36} className="mb-2 opacity-60" />
                          <span className="text-sm font-medium">Aucun échec majeur recensé</span>
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Répartition des Dépenses" subtitle="Par catégorie (FCFA)">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {expensesByCategory.length > 0 ? (
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {expensesByCategory.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, 'Montant']}
                            contentStyle={tooltipStyle}
                          />
                          <Legend verticalAlign="bottom" height={40} iconType="circle" />
                        </PieChart>
                      ) : (
                        <EmptyChart>Aucune dépense enregistrée</EmptyChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              {canFinances && (
                <ChartCard
                  title="Performance Financière Mensuelle"
                  subtitle="Comparaison Recettes vs Dépenses vs Net (FCFA)"
                >
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {comparisonSeries.length > 0 ? (
                        <ComposedChart data={comparisonSeries}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            formatter={(value) => [`${Number(value ?? 0).toLocaleString()} FCFA`, '']}
                            contentStyle={tooltipStyle}
                          />
                          <Legend />
                          <Bar dataKey="recettes" fill="#16a34a" name="Recettes" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="net" stroke="#ea580c" strokeWidth={3} name="Solde Net" dot={{ r: 4 }} />
                        </ComposedChart>
                      ) : (
                        <EmptyChart>Aucune donnée financière disponible</EmptyChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}

              {/* TABLE PERFORMANCE PAR CLIENT (SCREENSHOT 3) */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                   <h2 className="font-display text-xl font-bold text-brand-dark">Performance par Client</h2>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                         <tr>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4 text-center">Œufs mis</th>
                            <th className="px-6 py-4 text-center">Éclosions</th>
                            <th className="px-6 py-4 text-right pr-8">Taux d'éclosion</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {clientPerfTable.map(item => (
                            <tr key={item.clientId} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-6 py-4 font-bold text-brand-dark uppercase">{item.nom}</td>
                               <td className="px-6 py-4 text-center font-medium text-slate-600 italic">*{item.oeufs.toLocaleString()}</td>
                               <td className="px-6 py-4 text-center font-medium text-slate-600 italic">{item.poussins.toLocaleString()}</td>
                               <td className="px-6 py-4 text-right pr-8">
                                  <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs ring-1 ring-emerald-100">
                                     {item.taux}%
                                  </span>
                               </td>
                            </tr>
                         ))}
                         {clientPerfTable.length === 0 && (
                            <tr>
                               <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Aucune donnée disponible</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alertes */}
        <div className="flex flex-col lg:col-span-1">
          <div className="sticky top-20 flex max-h-[min(85vh,720px)] flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white shadow-soft">
            <div className="border-b border-amber-100/80 bg-white/60 px-5 py-4 backdrop-blur-sm">
              <h2 className="font-display flex items-center gap-2 text-lg font-bold text-brand-dark">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <AlertTriangle size={20} />
                </span>
                Actions du jour
              </h2>
              <p className="mt-1 text-xs text-slate-500">Mirages et éclosions à traiter</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {todayAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle size={28} />
                  </div>
                  <p className="font-semibold text-brand-dark">Rien à traiter aujourd&apos;hui</p>
                  <p className="mt-1 max-w-[14rem] text-xs text-slate-500">
                    Les alertes mirage / éclosion apparaîtront ici selon le planning des lots.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {todayAlerts.map((alert, i) => {
                    const clientName = clients.find((cl) => cl.id === alert?.client)?.nom || 'Client';
                    const isMirage = alert?.type === 'Mirage';
                    return (
                      <li
                        key={alert?.id ?? i}
                        className={`rounded-xl border p-4 shadow-sm ${
                          isMirage ? 'border-blue-200 bg-blue-50/50' : 'border-emerald-200 bg-emerald-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              isMirage ? 'bg-blue-200 text-blue-900' : 'bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            {alert?.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {alert?.couvais.nombreOeufs} œufs
                          </span>
                        </div>
                        <p className="mt-2 font-semibold text-brand-dark">{clientName}</p>
                        <p className="text-xs text-slate-600">
                          {alert?.couvais.typeOeuf} · mirage / éclosion selon plan
                        </p>
                        <Link
                          to="/couvaisons"
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-brand-dark transition-colors hover:bg-slate-50"
                        >
                          Traiter le lot <ArrowRight size={14} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
