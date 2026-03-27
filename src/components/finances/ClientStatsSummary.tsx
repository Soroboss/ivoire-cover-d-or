import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { netPayeLot, sumAvoirsRemisesLot } from '../../lib/financeCalculations';

interface Props {
  clientId: string;
}

export const ClientStatsSummary: React.FC<Props> = ({ clientId }) => {
  const { couvaisons, transactions } = useAppContext();

  const stats = useMemo(() => {
    const clientLots = couvaisons.filter(c => c.clientId === clientId && c.statut !== 'Annulé');
    
    const totalCouvaisons = clientLots.length;
    const totalOeufs = clientLots.reduce((acc, c) => acc + c.nombreOeufs, 0);
    const totalNet = clientLots.reduce((acc, c) => acc + (c.nombreOeufs * c.prixUnitaire), 0);
    
    let dejaPaye = 0;
    let avoirsRemises = 0;
    
    clientLots.forEach(c => {
      dejaPaye += netPayeLot(transactions, c.id);
      avoirsRemises += sumAvoirsRemisesLot(transactions, c.id);
    });
    
    const resteAPayer = Math.max(0, totalNet - dejaPaye - avoirsRemises);
    
    return {
      totalCouvaisons,
      totalOeufs,
      totalNet,
      dejaPaye,
      resteAPayer
    };
  }, [clientId, couvaisons, transactions]);

  if (!clientId) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4">
      {/* Colonne 1: Couvaisons & Reste à Payer (comme dans le design du screenshot) */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-brand-orange/20 bg-brand-orange/5 h-[90px] flex flex-col justify-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-brand-orange uppercase mb-1 drop-shadow-sm truncate">Total Couvaisons</p>
          <p className="text-xl sm:text-2xl font-black text-brand-dark">{stats.totalCouvaisons}</p>
        </div>
        
        <div className="p-4 rounded-xl border border-red-200/50 bg-red-50/50 h-[90px] flex flex-col justify-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-brand-orange uppercase mb-1 drop-shadow-sm truncate">Reste à payer</p>
          <p className="text-lg sm:text-xl font-black text-brand-dark">{stats.resteAPayer.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Colonne 2: Total Œufs */}
      <div className="p-4 rounded-xl border border-blue-200/50 bg-blue-50 h-[90px] flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-blue-600 uppercase mb-1 truncate">Total Œufs</p>
        <p className="text-xl sm:text-2xl font-black text-blue-900">{stats.totalOeufs}</p>
      </div>

      {/* Colonne 3: Total Net */}
      <div className="p-4 rounded-xl border border-blue-200/50 bg-blue-50 h-[90px] flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-blue-600 uppercase mb-1 truncate">Total Net</p>
        <p className="text-xl sm:text-2xl font-black text-blue-900">{stats.totalNet.toLocaleString()} FCFA</p>
      </div>

      {/* Colonne 4: Déjà Payé */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 h-[90px] flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-slate-500 uppercase mb-1 truncate">Déjà Payé</p>
        <p className="text-xl sm:text-2xl font-black text-brand-dark">{stats.dejaPaye.toLocaleString()} FCFA</p>
      </div>
    </div>
  );
};
