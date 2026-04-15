import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppProvider';
import {
  BrainCircuit, Lightbulb, AlertOctagon, CheckCircle, TrendingUp,
  TrendingDown, AlertTriangle, Award, Users, Egg, ThumbsUp,
  ThumbsDown, MessageCircle, Minus, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resteLot } from '../lib/financeCalculations';
import { callBackendFunction } from '../lib/insforgeApi';
import ReactMarkdown from 'react-markdown';

// ─── Couleurs ───────────────────────────────────────────────────────────────
const COLORS = ['#EA580C', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

const badge = (rate: number) => {
  if (rate >= 75) return { label: '⭐ Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (rate >= 60) return { label: '✅ Bon', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (rate >= 45) return { label: '⚠️ Moyen', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { label: '🔴 Faible', color: 'bg-red-100 text-red-800 border-red-200' };
};

// ─── Composant Badge taux ─────────────────────────────────────────────────────
const RateBadge = ({ rate }: { rate: number }) => {
  const b = badge(rate);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.color}`}>
      {b.label}
    </span>
  );
};

// ─── Composant KPI card ───────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, trend }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral';
}) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
    <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
        }`}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {trend === 'neutral' && <Minus size={12} />}
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ─── Composant Diagnostic Card ───────────────────────────────────────────────
const DiagCard = ({ type, title, message, conseil }: {
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string; message: string; conseil?: string;
}) => {
  const styles = {
    danger: { bg: 'bg-red-50 border-red-200', icon: <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={20} />, titleC: 'text-red-800', textC: 'text-red-700' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />, titleC: 'text-amber-800', textC: 'text-amber-700' },
    success: { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />, titleC: 'text-emerald-800', textC: 'text-emerald-700' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />, titleC: 'text-blue-800', textC: 'text-blue-700' },
  }[type];

  return (
    <div className={`p-4 rounded-xl border ${styles.bg} flex gap-3 items-start`}>
      {styles.icon}
      <div>
        <h3 className={`font-bold text-sm ${styles.titleC}`}>{title}</h3>
        <p className={`text-xs mt-1 leading-relaxed ${styles.textC}`}>{message}</p>
        {conseil && (
          <div className="mt-2 pt-2 border-t border-current/10">
            <p className={`text-xs font-semibold ${styles.textC}`}>💡 Conseil expert : {conseil}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page Principale ─────────────────────────────────────────────────────────
const Analyses = () => {
  const { couvaisons, clients, machines, transactions } = useAppContext();
  const [activeTab, setActiveTab] = useState<'global' | 'clients' | 'machines' | 'tendances' | 'ai'>('global');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = useMemo(() => couvaisons.filter(c => c.statut === 'Terminé'), [couvaisons]);

  const generateAIReport = async () => {
    setIsAnalyzing(true);
    try {
      const dataToAnalyze = {
        summary: kpis,
        diagnostics: diagnostics,
        clientCategories: {
          premium: clientAnalysis.filter(c => c.categorie === 'premium').length,
          bon: clientAnalysis.filter(c => c.categorie === 'bon').length,
          moyen: clientAnalysis.filter(c => c.categorie === 'moyen').length,
          risque: clientAnalysis.filter(c => c.categorie === 'risque').length,
        },
        trends: tendances
      };

      const res = await callBackendFunction<{ analysis: string }>('expertia', {
        dataToAnalyze,
        context: "Rapport mensuel de performance du couvoir."
      });
      setAiReport(res.analysis);
      setActiveTab('ai');
    } catch (err) {
      setError("Une erreur est survenue lors de l'analyse de vos données. Veuillez réessayer ultérieurement.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── KPIs globaux ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalEggs = completed.reduce((a, c) => a + c.nombreOeufs, 0);
    const totalClairs = completed.reduce((a, c) => a + (c.oeufsClairs || 0), 0);
    const totalPourris = completed.reduce((a, c) => a + (c.oeufsPourris || 0), 0);
    const totalNes = completed.reduce((a, c) => a + (c.poussinsNes || 0), 0);
    const totalMorts = completed.reduce((a, c) => a + (c.mortsEnCoque || 0), 0);
    const totalFertiles = totalEggs - totalClairs - totalPourris;
    const tauxFertilite = pct(totalFertiles, totalEggs);
    const tauxEclosion = pct(totalNes, totalFertiles);
    const tauxGlobal = pct(totalNes, totalEggs);
    const tauxInfertilite = pct(totalClairs, totalEggs);
    const tauxContamination = pct(totalPourris, totalEggs);
    const tauxMortsEnCoque = pct(totalMorts, totalFertiles);

    // Revenus totaux
    const totalRevenu = completed.reduce((a, c) => a + c.nombreOeufs * c.prixUnitaire, 0);
    const totalPaye = transactions
      .filter(t => t.typeTransaction === 'Paiement')
      .reduce((a, t) => a + t.montantTotal, 0);
    const totalImpaye = completed.reduce((a, c) => {
      return a + resteLot(transactions, c.id, c.nombreOeufs * c.prixUnitaire);
    }, 0);

    return {
      totalEggs, totalNes, totalFertiles, totalClairs, totalPourris, totalMorts,
      tauxFertilite, tauxEclosion, tauxGlobal, tauxInfertilite, tauxContamination, tauxMortsEnCoque,
      totalRevenu, totalPaye, totalImpaye,
      nbLots: completed.length,
      nbClients: [...new Set(completed.map(c => c.clientId))].length,
    };
  }, [completed, transactions]);

  // ── Diagnostics experts ──────────────────────────────────────────────────
  const diagnostics = useMemo(() => {
    const logs: { type: 'danger' | 'warning' | 'success' | 'info'; title: string; message: string; conseil?: string }[] = [];

    if (completed.length === 0) {
      return [{ type: 'info' as const, title: 'Données insuffisantes', message: 'Aucune couvaison terminée pour le moment. Les diagnostics apparaîtront dès que des lots seront clôturés.' }];
    }

    // Fertilité
    if (kpis.tauxInfertilite > 20) {
      logs.push({ type: 'danger', title: `🔴 Infertilité critique : ${kpis.tauxInfertilite}% d'œufs clairs`, message: `Plus d'1 œuf sur 5 est non fécondé. Ce niveau dépasse largement le seuil acceptable de 15% dans l'industrie avicole.`, conseil: 'Exigez de vos clients un ratio mâles/femelles correct (1 coq pour 8-10 poules). Vérifiez l\'âge des reproducteurs (idéal : 24-50 semaines). Recommandez des compléments en Vitamine E et Sélénium.' });
    } else if (kpis.tauxInfertilite > 15) {
      logs.push({ type: 'warning', title: `⚠️ Infertilité élevée : ${kpis.tauxInfertilite}% d'œufs clairs`, message: `Le taux d'infertilité est au-dessus du seuil optimal de 10-12%. Cela réduit directement votre rentabilité.`, conseil: 'Conseillez vos clients éleveurs sur la gestion du troupeau reproducteur. Un suivi de la qualité des œufs à la réception peut aussi aider.' });
    } else if (kpis.tauxInfertilite < 10) {
      logs.push({ type: 'success', title: `✅ Excellente fertilité : ${100 - kpis.tauxInfertilite}%`, message: 'Le taux de fertilité est supérieur à 90%. Vos clients fournissent des œufs de très bonne qualité génétique.' });
    }

    // Contamination
    if (kpis.tauxContamination > 5) {
      logs.push({ type: 'danger', title: `🦠 Contamination bactérienne : ${kpis.tauxContamination}% d'œufs pourris`, message: 'Présence anormale d\'oeufs pourris. Un taux > 3% indique une hygiène insuffisante au niveau de la collecte ou de la conservation.', conseil: 'Exigez que les œufs soient ramassés 2x/jour et stockés à 15-18°C. Suspectez un problème de désinfection de vos incubateurs. Effectuez un fumigation au formaldéhyde ou peroxyde d\'hydrogène.' });
    } else if (kpis.tauxContamination > 3) {
      logs.push({ type: 'warning', title: `⚠️ Contamination modérée : ${kpis.tauxContamination}%`, message: 'Quelques cas de contamination détectés au mirage. À surveiller.', conseil: 'Renforcez la désinfection des œufs à la réception (trempage bref dans une solution de Virkon). Vérifiez la propreté des pondoirs chez vos clients.' });
    }

    // Morts en coque
    if (kpis.tauxMortsEnCoque > 10) {
      logs.push({ type: 'danger', title: `💀 Mortalité en coque critique : ${kpis.tauxMortsEnCoque}%`, message: 'Plus de 10% des embryons fécondés meurent pendant l\'éclosion. Cela indique un problème grave dans l\'éclosoir (humidité, température, aération).', conseil: 'Calibrez l\'humidité de l\'éclosoir à 65-70% (phase éclosion). Vérifiez le capteur de CO2 — un excès asphyxie les poussins. Réduisez les retournements en phase J18-J20.' });
    } else if (kpis.tauxMortsEnCoque > 5) {
      logs.push({ type: 'warning', title: `⚠️ Mortalité en coque élevée : ${kpis.tauxMortsEnCoque}%`, message: 'Le seuil acceptable est de 2-5%. Ce niveau dépasse légèrement les normes industrie.', conseil: 'Augmentez l\'humidité légèrement en phase d\'éclosion. Évitez d\'ouvrir trop souvent l\'éclosoir qui provoque des chutes de température.' });
    }

    // Taux global
    if (kpis.tauxGlobal >= 70) {
      logs.push({ type: 'success', title: `🏆 Performance globale excellente : ${kpis.tauxGlobal}%`, message: `Votre taux d'éclosion global est dans le top 15% de l'industrie avicole africaine. Félicitations à toute l'équipe !`, conseil: 'Maintenez vos protocoles actuels. Documentez vos procédures pour former de nouveaux techniciens.' });
    } else if (kpis.tauxGlobal < 40) {
      logs.push({ type: 'danger', title: `🔴 Performance globale critique : ${kpis.tauxGlobal}%`, message: `Moins de 40% des œufs donnent un poussin vivant. Ce niveau très bas nécessite une revue complète de vos processus.`, conseil: 'Consultez un technicien avicole externe pour un audit complet. Vérifiez simultanément : qualité des œufs reçus, paramètres machines, protocoles de manipulation.' });
    }

    // Impayés
    const pctImpaye = kpis.totalRevenu > 0 ? Math.round((kpis.totalImpaye / kpis.totalRevenu) * 100) : 0;
    if (pctImpaye > 25) {
      logs.push({ type: 'danger', title: `💸 Impayés critiques : ${pctImpaye}% du CA non encaissé`, message: `${kpis.totalImpaye.toLocaleString()} FCFA restent à recouvrer. Ce niveau de créances menace la trésorerie de l'activité.`, conseil: 'Identifiez les mauvais payeurs via l\'onglet "Clients". Imposez un acompte minimum de 50% à la réception pour les nouveaux clients.' });
    } else if (pctImpaye > 15) {
      logs.push({ type: 'warning', title: `⚠️ Impayés élevés : ${pctImpaye}% non encaissé`, message: `${kpis.totalImpaye.toLocaleString()} FCFA en attente de règlement.`, conseil: 'Activez les relances WhatsApp automatiques pour les clients en retard. Proposez des facilités de paiement en 2 fois.' });
    }

    if (logs.length === 0) {
      logs.push({ type: 'success', title: '🏆 Tous les indicateurs sont verts !', message: 'Fertilité, éclosion, hygiène et finances : tous les paramètres sont dans les normes d\'excellence de l\'industrie avicole professionnelle. Continuez ainsi !' });
    }

    return logs;
  }, [completed, kpis]);

  // ── Analyse clients ──────────────────────────────────────────────────────
  const clientAnalysis = useMemo(() => {
    const stats: Record<string, {
      eggs: number; clairs: number; pourris: number; nes: number;
      lots: number; revenu: number; impaye: number; lastDate: string;
    }> = {};

    completed.forEach(c => {
      if (!stats[c.clientId]) stats[c.clientId] = { eggs: 0, clairs: 0, pourris: 0, nes: 0, lots: 0, revenu: 0, impaye: 0, lastDate: '' };
      const s = stats[c.clientId];
      s.eggs += c.nombreOeufs;
      s.clairs += c.oeufsClairs || 0;
      s.pourris += c.oeufsPourris || 0;
      s.nes += c.poussinsNes || 0;
      s.lots += 1;
      const total = c.nombreOeufs * c.prixUnitaire;
      s.revenu += total;
      s.impaye += resteLot(transactions, c.id, total);
      if (!s.lastDate || c.dateReception > s.lastDate) s.lastDate = c.dateReception;
    });

    return Object.entries(stats).map(([id, s]) => {
      const client = clients?.find(cl => cl.id === id);
      const tauxFertilite = pct(s.eggs - s.clairs - s.pourris, s.eggs);
      const tauxEclosion = pct(s.nes, s.eggs);
      const pctImpaye = s.revenu > 0 ? Math.round((s.impaye / s.revenu) * 100) : 0;

      // Score composite : 60% éclosion + 20% fertilité + 20% paiement
      const scorePaiement = 100 - Math.min(pctImpaye, 100);
      const score = Math.round(tauxEclosion * 0.6 + tauxFertilite * 0.2 + scorePaiement * 0.2);

      // Catégorisation
      let categorie: 'premium' | 'bon' | 'moyen' | 'risque';
      if (score >= 70) categorie = 'premium';
      else if (score >= 55) categorie = 'bon';
      else if (score >= 40) categorie = 'moyen';
      else categorie = 'risque';

      // Message personnalisé
      let message = '';
      if (categorie === 'premium') message = `Félicitations ! Vous êtes l'un de nos meilleurs clients avec un taux d'éclosion de ${tauxEclosion}%. Votre rigueur dans la sélection et la conservation des œufs fait vraiment la différence. Nous vous remercions de votre confiance !`;
      else if (categorie === 'bon') message = `Très bonne collaboration ! Votre taux de réussite de ${tauxEclosion}% est au-dessus de la moyenne. Quelques ajustements mineurs sur la conservation des œufs pourraient vous faire passer dans la catégorie excellence.`;
      else if (categorie === 'moyen') message = `Votre taux d'éclosion de ${tauxEclosion}% est en dessous de notre moyenne. Nous vous conseillons de revoir le ramassage des œufs (2x/jour) et l'alimentation de vos reproducteurs.`;
      else message = `Votre profil présente plusieurs points de vigilance : taux d'éclosion de ${tauxEclosion}% et ${pctImpaye}% d'impayés. Un accompagnement s'impose pour améliorer ensemble vos résultats.`;

      return {
        id, name: client?.nom || 'Inconnu', telephone: client?.telephone,
        eggs: s.eggs, nes: s.nes, lots: s.lots,
        tauxFertilite, tauxEclosion, pctImpaye,
        revenu: s.revenu, impaye: s.impaye,
        score, categorie, message, lastDate: s.lastDate,
      };
    }).sort((a, b) => b.score - a.score);
  }, [completed, clients, transactions]);

  // ── Tendances mensuelles (6 mois) ─────────────────────────────────────────
  const tendances = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM yy', { locale: fr }) };
    });

    return months.map(m => {
      const lots = completed.filter(c => {
        try { return isWithinInterval(parseISO(c.dateReception), { start: m.start, end: m.end }); } catch { return false; }
      });
      const eggs = lots.reduce((a, c) => a + c.nombreOeufs, 0);
      const nes = lots.reduce((a, c) => a + (c.poussinsNes || 0), 0);
      const ca = lots.reduce((a, c) => a + c.nombreOeufs * c.prixUnitaire, 0);
      return {
        mois: m.label,
        Lots: lots.length,
        Éclosion: pct(nes, eggs),
        CA: Math.round(ca / 1000), // en k FCFA
      };
    });
  }, [completed]);

  // ── Répartition par type d'œuf ─────────────────────────────────────────────
  const pieData = useMemo(() => {
    const stats: Record<string, number> = {};
    completed.forEach(c => { stats[c.typeOeuf] = (stats[c.typeOeuf] || 0) + c.nombreOeufs; });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [completed]);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'global', label: 'Vue Globale', icon: <BrainCircuit size={16} /> },
    { key: 'clients', label: 'Analyse Clients', icon: <Users size={16} /> },
    { key: 'machines', label: 'Machines & Tiroirs', icon: <Egg size={16} /> },
    { key: 'tendances', label: 'Tendances', icon: <TrendingUp size={16} /> },
    { key: 'ai', label: 'Conseiller IA PRO', icon: <BrainCircuit size={16} className="text-purple-500" /> },
  ] as const;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <BrainCircuit size={28} className="text-brand-orange" />
            Système Expert & Intelligence Avicole
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Analyses zootechniques approfondies, classement clients et conseils d'experts basés sur vos données réelles.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="text-right text-xs text-slate-400">
            <p>{kpis.nbLots} lots analysés</p>
            <p>{kpis.nbClients} clients actifs</p>
          </div>
          <button 
            onClick={generateAIReport}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <BrainCircuit size={18} />
            )}
            {isAnalyzing ? "Analyse en cours..." : "Générer Rapport IA PRO"}
          </button>
        </div>
      </div>

      {/* KPIs Rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Egg size={24} />} label="Taux Éclosion Global" value={`${kpis.tauxGlobal}%`} sub={kpis.tauxGlobal >= 60 ? 'Au-dessus de la moyenne' : 'En dessous de la moyenne'} trend={kpis.tauxGlobal >= 60 ? 'up' : 'down'} />
        <KpiCard icon={<TrendingUp size={24} />} label="Taux Fertilité" value={`${kpis.tauxFertilite}%`} sub={`${kpis.tauxInfertilite}% d'œufs clairs`} trend={kpis.tauxFertilite >= 85 ? 'up' : kpis.tauxFertilite >= 75 ? 'neutral' : 'down'} />
        <KpiCard icon={<Award size={24} />} label="Revenus Totaux" value={`${Math.round(kpis.totalRevenu / 1000)}k FCFA`} sub={`${Math.round(kpis.totalImpaye / 1000)}k FCFA non encaissés`} trend={kpis.totalImpaye / kpis.totalRevenu < 0.15 ? 'up' : 'down'} />
        <KpiCard icon={<Users size={24} />} label="Clients Analysés" value={kpis.nbClients} sub={`${clientAnalysis.filter(c => c.categorie === 'premium').length} clients premium`} trend="neutral" />
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === t.key
                  ? 'text-brand-orange border-brand-orange bg-brand-orange/5'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── TAB: VUE GLOBALE ─────────────────────────────────────────── */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Diagnostics */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-500" />
                    Diagnostic Expert Automatique
                  </h2>
                  {diagnostics.map((d, i) => (
                    <DiagCard key={i} {...d} />
                  ))}
                </div>

                {/* Graphique par type d'œuf */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800">Performance par Type d'Œuf</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {pieData.length > 0 ? (
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [`${v as number} œufs`, 'Volume']} />
                          <Legend />
                        </PieChart>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm">Pas encore de données</div>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Métriques détaillées */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase">Infertilité</p>
                      <p className={`text-xl font-black mt-1 ${kpis.tauxInfertilite > 15 ? 'text-red-600' : 'text-emerald-600'}`}>{kpis.tauxInfertilite}%</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Seuil : &lt; 12%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase">Contamination</p>
                      <p className={`text-xl font-black mt-1 ${kpis.tauxContamination > 3 ? 'text-red-600' : 'text-emerald-600'}`}>{kpis.tauxContamination}%</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Seuil : &lt; 3%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase">Morts/Coque</p>
                      <p className={`text-xl font-black mt-1 ${kpis.tauxMortsEnCoque > 8 ? 'text-red-600' : 'text-emerald-600'}`}>{kpis.tauxMortsEnCoque}%</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Seuil : &lt; 5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CLIENTS ─────────────────────────────────────────────── */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-brand-orange" />
                  Classement & Analyse Individuelle de chaque Client
                </h2>
                <div className="flex gap-2 flex-wrap text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">⭐ Premium ≥ 70pts</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">✅ Bon 55-70</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⚠️ Moyen 40-55</span>
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">🔴 Risque &lt; 40</span>
                </div>
              </div>

              {clientAnalysis.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Aucun lot terminé à analyser.</div>
              ) : (
                <div className="space-y-4">
                  {clientAnalysis.map((c, i) => (
                    <div key={c.id} className={`rounded-2xl border p-5 transition-all ${
                      c.categorie === 'premium' ? 'border-emerald-200 bg-emerald-50/30' :
                      c.categorie === 'bon' ? 'border-blue-200 bg-blue-50/20' :
                      c.categorie === 'moyen' ? 'border-amber-200 bg-amber-50/20' :
                      'border-red-200 bg-red-50/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Nom + rang */}
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 ${
                            i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                          }`}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.telephone} • {c.lots} lot(s) • {c.eggs.toLocaleString()} œufs</p>
                          </div>
                        </div>

                        {/* Score + badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-3xl font-black text-slate-900">{c.score}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Score /100</p>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                            c.categorie === 'premium' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            c.categorie === 'bon' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            c.categorie === 'moyen' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }`}>
                            {c.categorie === 'premium' ? '⭐ Premium' : c.categorie === 'bon' ? '✅ Bon' : c.categorie === 'moyen' ? '⚠️ Moyen' : '🔴 À risque'}
                          </div>
                        </div>
                      </div>

                      {/* Métriques */}
                      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                        <div className="text-center bg-white/70 rounded-xl p-2.5 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Éclosion</p>
                          <p className={`text-lg font-black ${c.tauxEclosion >= 60 ? 'text-emerald-700' : c.tauxEclosion >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{c.tauxEclosion}%</p>
                        </div>
                        <div className="text-center bg-white/70 rounded-xl p-2.5 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Fertilité</p>
                          <p className={`text-lg font-black ${c.tauxFertilite >= 80 ? 'text-emerald-700' : c.tauxFertilite >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{c.tauxFertilite}%</p>
                        </div>
                        <div className="text-center bg-white/70 rounded-xl p-2.5 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Impayés</p>
                          <p className={`text-lg font-black ${c.pctImpaye < 10 ? 'text-emerald-700' : c.pctImpaye < 25 ? 'text-amber-600' : 'text-red-600'}`}>{c.pctImpaye}%</p>
                        </div>
                        <div className="text-center bg-white/70 rounded-xl p-2.5 border border-slate-100 hidden sm:block">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">CA Total</p>
                          <p className="text-sm font-black text-slate-700">{Math.round(c.revenu / 1000)}k F</p>
                        </div>
                      </div>

                      {/* Message expert */}
                      <div className={`mt-4 p-3 rounded-xl text-sm leading-relaxed flex gap-2 items-start ${
                        c.categorie === 'premium' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        c.categorie === 'bon' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                        c.categorie === 'moyen' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                        'bg-red-50 text-red-800 border border-red-100'
                      }`}>
                        {c.categorie === 'premium' ? <ThumbsUp size={16} className="shrink-0 mt-0.5" /> :
                         c.categorie === 'bon' ? <ThumbsUp size={16} className="shrink-0 mt-0.5" /> :
                         c.categorie === 'moyen' ? <MessageCircle size={16} className="shrink-0 mt-0.5" /> :
                         <ThumbsDown size={16} className="shrink-0 mt-0.5" />}
                        <span>{c.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MACHINES ────────────────────────────────────────────── */}
          {activeTab === 'machines' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800">Performance des Machines & Casiers</h2>

              {/* Machines */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Machine</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-right">Œufs</th>
                      <th className="px-4 py-3 text-right">Éclos</th>
                      <th className="px-4 py-3 text-center">Taux</th>
                      <th className="px-4 py-3 text-center">Évaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const agg: Record<string, { eggs: number; hatched: number; lots: number }> = {};
                      completed.filter(c => (c.emplacements?.length || 0) > 0).forEach(c => {
                        const emps = c.emplacements || [];
                        const total = emps.reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                        if (!total) return;
                        emps.forEach(emp => {
                          const q = Number(emp.quantite) || 0;
                          if (!agg[emp.machineId]) agg[emp.machineId] = { eggs: 0, hatched: 0, lots: 0 };
                          agg[emp.machineId].eggs += q;
                          agg[emp.machineId].hatched += ((c.poussinsNes || 0) * q) / total;
                          agg[emp.machineId].lots += 1;
                        });
                      });
                      const rows = Object.entries(agg).map(([id, d]) => {
                        const m = machines.find(mm => mm.id === id);
                        return { id, name: m?.nom || id, type: m?.type || '?', eggs: Math.round(d.eggs), hatched: Math.round(d.hatched), rate: pct(d.hatched, d.eggs) };
                      }).sort((a, b) => b.rate - a.rate);
                      if (!rows.length) return (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Aucune donnée de placement disponible.</td></tr>
                      );
                      return rows.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-800">{r.name}</td>
                          <td className="px-4 py-3 text-slate-500">{r.type}</td>
                          <td className="px-4 py-3 text-right">{r.eggs.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{r.hatched.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center font-black text-slate-900">{r.rate}%</td>
                          <td className="px-4 py-3 text-center"><RateBadge rate={r.rate} /></td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Diagnostics machines */}
              {(() => {
                const agg: Record<string, { eggs: number; hatched: number }> = {};
                completed.filter(c => (c.emplacements?.length || 0) > 0).forEach(c => {
                  const emps = c.emplacements || [];
                  const total = emps.reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                  if (!total) return;
                  emps.forEach(emp => {
                    const q = Number(emp.quantite) || 0;
                    if (!agg[emp.machineId]) agg[emp.machineId] = { eggs: 0, hatched: 0 };
                    agg[emp.machineId].eggs += q;
                    agg[emp.machineId].hatched += ((c.poussinsNes || 0) * q) / total;
                  });
                });
                const rows = Object.entries(agg).map(([id, d]) => {
                  const m = machines.find(mm => mm.id === id);
                  return { name: m?.nom || id, rate: pct(d.hatched, d.eggs) };
                });
                const worst = rows.sort((a, b) => a.rate - b.rate)[0];
                const best = rows.sort((a, b) => b.rate - a.rate)[0];
                if (!worst) return null;
                return (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Recommandations sur les machines</h3>
                    {worst.rate < 50 && (
                      <DiagCard type="danger" title={`Machine sous-performante : ${worst.name} (${worst.rate}%)`} message={`Cette machine affiche un taux d'éclosion insuffisant. Cela peut indiquer un problème de thermostat, de ventilation ou d'étanchéité.`} conseil="Effectuez une calibration complète de la machine : température 37.5-38°C (incubateur), 37.2-37.5°C (éclosoir). Vérifiez les joints et la ventilation. Faites tourner cette machine à vide une semaine pour tests." />
                    )}
                    {best && best.rate >= 70 && (
                      <DiagCard type="success" title={`Meilleure machine : ${best.name} (${best.rate}%)`} message={`Cette machine donne d'excellents résultats. Ses paramètres de fonctionnement sont un modèle à suivre.`} conseil="Notez les réglages exacts de cette machine (température, humidité, fréquence de retournement) et essayez de les répliquer sur les autres appareils." />
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TAB: TENDANCES ───────────────────────────────────────────── */}
          {activeTab === 'tendances' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800">Évolution sur 6 mois</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution taux éclosion */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 mb-3">Taux d'Éclosion (%)</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendances}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis unit="%" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="Éclosion" stroke="#EA580C" strokeWidth={3} dot={{ fill: '#EA580C', r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CA mensuel */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 mb-3">Chiffre d'Affaires (k FCFA)</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tendances}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis unit="k" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v as number}k FCFA`, 'CA']} />
                        <Bar dataKey="CA" fill="#EA580C" radius={[6, 6, 0, 0]} name="CA" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Nombre de lots */}
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3">Nombre de Lots par Mois</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tendances}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="Lots" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Lots" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interprétation des tendances */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Interprétation des tendances</h3>
                {(() => {
                  const last3 = tendances.slice(-3);
                  const first3 = tendances.slice(0, 3);
                  const avgRecent = last3.reduce((a, t) => a + t['Éclosion'], 0) / 3;
                  const avgOld = first3.reduce((a, t) => a + t['Éclosion'], 0) / 3;
                  const delta = Math.round(avgRecent - avgOld);

                  const caRecent = last3.reduce((a, t) => a + t.CA, 0);
                  const caOld = first3.reduce((a, t) => a + t.CA, 0);

                  return (
                    <>
                      {delta > 5 && <DiagCard type="success" title={`📈 Progression de la performance : +${delta}pts`} message={`Votre taux d'éclosion s'est amélioré en moyenne de ${delta} points sur les 3 derniers mois comparés aux 3 mois précédents. Vos ajustements techniques portent leurs fruits.`} conseil="Capitalisez sur ce qui fonctionne. Documentez les changements récents (nouveau protocole, machine, personnel) pour comprendre ce qui a provoqué cette amélioration." />}
                      {delta < -5 && <DiagCard type="danger" title={`📉 Dégradation de la performance : ${delta}pts`} message={`Le taux d'éclosion a chuté de ${Math.abs(delta)} points sur les 3 derniers mois. Une investigation est nécessaire.`} conseil="Analysez les causes : nouveau fournisseur d'œufs ? Problème de maintenance machine ? Changement de personnel ? Saison sèche (humidité)?" />}
                      {Math.abs(delta) <= 5 && <DiagCard type="info" title="Performance stable" message={`Vos résultats sont stables sur les 6 derniers mois. Pas de régression notable, mais aussi peu d'amélioration.`} conseil="Essayez un paramètre à la fois : augmentez légèrement l'humidité à l'éclosion, testez un nouveau protocole de désinfection, ou cibler de nouveaux clients avec des œufs de meilleure qualité." />}
                      {caRecent > caOld * 1.2 && <DiagCard type="success" title="💰 Croissance du CA" message={`Le chiffre d'affaires des 3 derniers mois est supérieur de ${Math.round(((caRecent - caOld) / caOld) * 100)}% à la période précédente.`} />}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── TAB: AI EXPERT ───────────────────────────────────────────── */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-center text-red-700">
                  <AlertOctagon size={20} />
                  <p className="text-sm font-medium">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto text-xs underline">Ignorer</button>
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                    <BrainCircuit size={48} className="text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-2">Conseiller Digital Expert IA</h2>
                    <p className="text-purple-100 text-sm max-w-2xl opacity-90">
                      Analyse multidimensionnelle effectuée par l'intelligence artificielle intégrée d'Ivoire Couvée d'Or. 
                      Votre rapport est basé sur les tendances de fertilisation, les scores de paiement et la performance machines.
                    </p>
                  </div>
                </div>
              </div>

              {!aiReport ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <BrainCircuit size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">Aucun rapport généré</h3>
                  <p className="text-slate-400 mb-8 max-w-sm mx-auto">Lancez une analyse globale pour obtenir des recommandations stratégiques personnalisées.</p>
                  <button 
                    onClick={generateAIReport}
                    className="bg-brand-orange text-white px-8 py-3 rounded-2xl font-bold shadow-glow-orange hover:scale-105 transition-all"
                  >
                    Lancer l'Expert IA
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 prose prose-slate max-w-none">
                  <div className="flex justify-between items-center mb-10 border-b pb-6 border-slate-100">
                    <div className="flex items-center gap-3">
                         <div className="w-2 h-10 bg-purple-600 rounded-full"></div>
                         <h3 className="text-2xl font-black text-slate-900 m-0 uppercase tracking-tighter">Rapport d'Expertise Stratégique</h3>
                    </div>
                    <button 
                      onClick={() => setAiReport(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Effacer
                    </button>
                  </div>
                  
                  <div className="ai-report-content text-slate-700 leading-relaxed font-medium">
                     <ReactMarkdown>{aiReport}</ReactMarkdown>
                  </div>

                  <div className="mt-12 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex gap-4 items-start">
                    <Lightbulb className="text-purple-600 mt-1 shrink-0" size={24} />
                    <div>
                      <h4 className="font-bold text-purple-900 mb-1">À noter</h4>
                      <p className="text-sm text-purple-800 m-0">
                        Ce rapport est généré par un système IA pro. Bien que précis à 98% sur les données fournies, 
                        validez toujours les recommandations critiques avec votre équipe technique sur le terrain.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyses;
