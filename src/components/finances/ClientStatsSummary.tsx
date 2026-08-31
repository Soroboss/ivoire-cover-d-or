import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { DollarSign, Wallet, Percent, Landmark, Receipt, CalendarCheck } from 'lucide-react';
import { getClientDetailedFinance } from '../../lib/financeCalculations';

interface Props {
  clientId: string;
}

export const ClientStatsSummary: React.FC<Props> = ({ clientId }) => {
  const { clientSummaries, transactions, couvaisons } = useAppContext();

  const stats = useMemo(() => {
    const s = clientSummaries.find(summary => summary.clientId === clientId);
    if (s && (s.totalDu > 0 || s.netEncaisse > 0 || s.resteAPayer > 0 || s.avoirClient > 0 || s.avoir > 0)) {
      return {
        totalDu: s.totalDu,
        avoir: s.avoir,
        remise: s.remise,
        netEncaisse: s.netEncaisse,
        resteAPayer: s.resteAPayer,
        avoirClient: s.avoirClient ?? 0,
        verseJour: s.verseJour,
      };
    }
    // Calcul de secours direct sur transactions & couvaisons en mémoire
    return getClientDetailedFinance(transactions, couvaisons, clientId);
  }, [clientId, clientSummaries, transactions, couvaisons]);

  if (!clientId) return null;

  const items = [
    { label: 'Montant Total dû', value: stats.totalDu, color: 'text-slate-900', bg: 'bg-slate-50', icon: <DollarSign size={16} className="text-slate-400" /> },
    { label: 'Remise commerciale', value: stats.remise, color: 'text-orange-700', bg: 'bg-orange-50', icon: <Percent size={16} className="text-orange-400" /> },
    { label: 'Net encaissé', value: stats.netEncaisse, color: 'text-green-700', bg: 'bg-green-50', icon: <Wallet size={16} className="text-green-400" /> },
    {
      label: stats.resteAPayer > 0 ? 'Reste à payer' : (stats.avoirClient > 0 ? 'Avoir (trop versé)' : 'Soldé ✓'),
      value: stats.resteAPayer > 0 ? stats.resteAPayer : stats.avoirClient,
      color: stats.resteAPayer > 0 ? 'text-red-700' : (stats.avoirClient > 0 ? 'text-purple-700' : 'text-green-700'),
      bg: stats.resteAPayer > 0 ? 'bg-red-50' : (stats.avoirClient > 0 ? 'bg-purple-50' : 'bg-green-50'),
      icon: stats.resteAPayer > 0
        ? <Receipt size={16} className="text-red-400" />
        : <Landmark size={16} className="text-purple-400" />,
    },
    { label: 'Avoir (remise accordée)', value: stats.avoir, color: 'text-purple-700', bg: 'bg-purple-50', icon: <Landmark size={16} className="text-purple-400" /> },
    { label: 'Versé ce Jour', value: stats.verseJour, color: 'text-blue-700', bg: 'bg-blue-50', icon: <CalendarCheck size={16} className="text-blue-400" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mt-4 mb-4">
      {items.map((item, idx) => (
        <div key={idx} className={`p-3 sm:p-4 rounded-2xl border border-white/40 shadow-sm ${item.bg} flex flex-col transition-all hover:scale-[1.02] duration-200 min-h-[90px]`}>
          <div className="flex items-center gap-1.5 mb-2">
            {item.icon}
            <p className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-500 uppercase drop-shadow-sm leading-tight">{item.label}</p>
          </div>
          <p className={`text-base sm:text-lg font-black ${item.color} mt-auto whitespace-nowrap`}>
            {item.value.toLocaleString()} <span className="text-[9px] opacity-70">F</span>
          </p>
        </div>
      ))}
    </div>
  );
};
