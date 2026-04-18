import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { MirageForm } from '../components/couvaisons/MirageForm';
import { EclosionHub } from '../components/couvaisons/EclosionHub';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { Eye, Egg, Calendar, AlertTriangle, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { formatEmplacementsLigne } from '../lib/casierLabels';

type TraitementType = 'mirage' | 'eclosion';

export default function Traitement() {
  const { couvaisons, clients, machines } = useAppContext();
  const [activeTab, setActiveTab] = useState<TraitementType>('mirage');
  const [activeForm, setActiveForm] = useState<{ id: string, type: TraitementType } | null>(null);

  const today = startOfDay(new Date());

  const categorizedData = useMemo(() => {
    const list = couvaisons.filter(c => c.statut === 'En cours');
    const res = {
      eclosion: {
        j: [] as any[],
        j1: [] as any[],
        j3: [] as any[],
        active: [] as any[],
        next: [] as any[],
      },
      mirage: {
        j: [] as any[],
        j1: [] as any[],
        j3: [] as any[],
        next: [] as any[],
      }
    };

    list.forEach(c => {
      // Mirage
      if (c.dateMiragePrevue && c.oeufsClairs == null && c.oeufsPourris == null) {
        const dateM = startOfDay(parseISO(c.dateMiragePrevue));
        const diff = differenceInDays(today, dateM);
        
        if (diff === 0) res.mirage.j.push(c);
        else if (diff >= 1 && diff < 3) res.mirage.j1.push(c);
        else if (diff >= 3) res.mirage.j3.push(c);
        else if (diff < 0 && diff >= -7) res.mirage.next.push(c);
      }

      // Eclosion
      const eclosionLancee = !!c.dateEclosionDemarrage;
      if (c.dateEclosionPrevue) {
        if (eclosionLancee) {
          res.eclosion.active.push(c);
        } else {
          const dateE = startOfDay(parseISO(c.dateEclosionPrevue));
          const diff = differenceInDays(today, dateE);

          if (diff === 0) res.eclosion.j.push(c);
          else if (diff >= 1 && diff < 3) res.eclosion.j1.push(c);
          else if (diff >= 3) res.eclosion.j3.push(c);
          else if (diff < 0 && diff >= -7) res.eclosion.next.push(c);
        }
      }
    });

    return res;
  }, [couvaisons, today]);

  if (activeForm) {
    const isMirage = activeForm.type === 'mirage';
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveForm(null)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-orange transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Retour à l'atelier
        </button>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-4">
           <div className="flex items-center gap-3 px-4 py-2">
             <div className={`p-2 rounded-lg ${isMirage ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {isMirage ? <Eye size={20} /> : <Egg size={20} />}
             </div>
             <div>
               <h2 className="font-bold text-slate-900">
                 {isMirage ? 'Mirage du Lot' : 'Traitement Éclosion'}
               </h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {activeForm.id.substring(0, 8)}...</p>
             </div>
           </div>
        </div>

        {isMirage ? (
           <MirageForm 
            couvaisonId={activeForm.id} 
            onCancel={() => setActiveForm(null)} 
            onSuccess={() => setActiveForm(null)} 
           />
        ) : (
          <EclosionHub 
            couvaisonId={activeForm.id} 
            onCancel={() => setActiveForm(null)} 
            onSuccess={() => setActiveForm(null)} 
          />
        )}
      </div>
    );
  }

  const renderList = (items: any[], type: TraitementType) => {
    if (items.length === 0) return (
      <div className="py-8 text-center text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Aucun lot à traiter pour cette période.
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(c => {
          const client = clients.find(cl => cl.id === c.clientId);
          const dateRef = type === 'mirage' ? c.dateMiragePrevue : c.dateEclosionPrevue;
          const diff = differenceInDays(today, startOfDay(parseISO(dateRef!)));
          
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
              <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{client?.nom || 'Inconnu'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.nombreOeufs} {c.typeOeuf}s</p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${diff >= 3 ? 'bg-red-100 text-red-700' : diff >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {diff === 0 ? 'Aujourd\'hui' : `Retard ${diff} j.`}
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Dépôt: {format(parseISO(c.dateReception), 'dd/MM/yyyy')}</span>
                </div>
                {c.emplacements && c.emplacements.length > 0 && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emplacement</p>
                    <p className="text-xs font-medium text-slate-700">{formatEmplacementsLigne(c.emplacements, machines)}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setActiveForm({ id: c.id, type })}
                className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                  type === 'mirage' 
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white' 
                    : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                }`}
              >
                {type === 'mirage' ? <Eye size={16} /> : <Egg size={16} />}
                Traiter le lot
                <ChevronRight size={14} className="opacity-50" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const stats = useMemo(() => {
    const data = categorizedData[activeTab];
    const totalBatches = data.j.length + data.j1.length + data.j3.length;
    const totalEggs = [...data.j, ...data.j1, ...data.j3].reduce((sum, c) => sum + c.nombreOeufs, 0);
    const criticalBatches = data.j3.length;
    
    return { totalBatches, totalEggs, criticalBatches };
  }, [categorizedData, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
             <div className="p-2 bg-brand-orange/10 rounded-lg">
               {activeTab === 'mirage' ? <Eye size={24} className="text-brand-orange" /> : <Egg size={24} className="text-brand-orange" />}
             </div>
             Atelier de Traitement Technique
          </h1>
          <p className="text-slate-500 text-sm mt-1">
             Pilotage des opérations de {activeTab === 'mirage' ? 'mirage (J+14)' : 'transfert et éclosion'}. 
             Vision directe sur le flux de production.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('mirage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'mirage' 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              Mirage
              {categorizedData.mirage.j.length + categorizedData.mirage.j1.length + categorizedData.mirage.j3.length > 0 && (
                <span className="bg-blue-600 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px]">
                  {categorizedData.mirage.j.length + categorizedData.mirage.j1.length + categorizedData.mirage.j3.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('eclosion')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'eclosion' 
                  ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              Éclosion
              {categorizedData.eclosion.j.length + categorizedData.eclosion.j1.length + categorizedData.eclosion.j3.length > 0 && (
                <span className="bg-green-600 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px]">
                  {categorizedData.eclosion.j.length + categorizedData.eclosion.j1.length + categorizedData.eclosion.j3.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BANDEAU RECAPITULATIF EXPERT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume à traiter</p>
            <div className="flex items-end gap-2">
               <span className="text-2xl font-bold text-slate-900">{stats.totalEggs.toLocaleString()}</span>
               <span className="text-sm font-medium text-slate-500 pb-1">œufs au total</span>
            </div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre de lots</p>
            <div className="flex items-end gap-2">
               <span className="text-2xl font-bold text-slate-900">{stats.totalBatches}</span>
               <span className="text-sm font-medium text-slate-500 pb-1">clients en attente</span>
            </div>
         </div>
         <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${stats.criticalBatches > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Points Critiques</p>
            <div className="flex items-end gap-2">
               <span className={`text-2xl font-bold ${stats.criticalBatches > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.criticalBatches}</span>
               <span className={`text-sm font-medium pb-1 ${stats.criticalBatches > 0 ? 'text-red-500' : 'text-slate-500'}`}>lots en retard (J-3+)</span>
            </div>
         </div>
      </div>

      <div className="space-y-8">
        {/* JOUR J-3 (3 jours et plus) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 p-1.5 rounded-lg">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Retard Critique : J-3 et plus</h2>
          </div>
          {renderList(categorizedData[activeTab].j3, activeTab)}
        </section>

        {/* ÉCLOSIONS EN COURS (Seulement pour onglet éclosion) */}
        {activeTab === 'eclosion' && categorizedData.eclosion.active.length > 0 && (
          <section className="bg-green-50/50 -mx-4 px-4 py-8 rounded-3xl border border-green-100/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-green-800">Éclosions en cours (Sorties à enregistrer)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedData.eclosion.active.map((c: any) => {
                const client = clients.find(cl => cl.id === c.clientId);
                const viable = c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0);
                const progress = viable > 0 ? Math.round(((c.poussinsNes || 0) / viable) * 100) : 0;
                
                return (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden hover:shadow-md transition-all group border-l-4 border-l-green-500">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 leading-tight">{client?.nom || 'Inconnu'}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">{c.nombreOeufs} {c.typeOeuf}s</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{progress}% complété</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-2">
                       <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Poussins nés :</span>
                          <span className="font-bold text-slate-700">{c.poussinsNes || 0} / {viable}</span>
                       </div>
                       {c.emplacements && c.emplacements.length > 0 && (
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded">
                          {formatEmplacementsLigne(c.emplacements, machines)}
                        </div>
                       )}
                    </div>

                    <button 
                      onClick={() => setActiveForm({ id: c.id, type: 'eclosion' })}
                      className="w-full py-2 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Enregistrer sorties
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* JOUR J-1 (1 à 2 jours de retard) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-1.5 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Retard Modéré : J-1 & J-2</h2>
          </div>
          {renderList(categorizedData[activeTab].j1, activeTab)}
        </section>

        {/* JOUR J */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <Clock size={16} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">À traiter : Jour J</h2>
          </div>
          {renderList(categorizedData[activeTab].j, activeTab)}
        </section>

        {/* PROCHAINEMENT (7 jours) */}
        <section className="pt-8 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1.5 rounded-lg">
                <Calendar size={16} className="text-slate-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-500">Prévisions : 7 prochains jours</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
               Volume attendu : {categorizedData[activeTab].next.reduce((s: number, c: any) => s + c.nombreOeufs, 0).toLocaleString()} œufs
            </span>
          </div>
          <div className="opacity-75 hover:opacity-100 transition-opacity">
            {renderList(categorizedData[activeTab].next, activeTab)}
          </div>
        </section>
      </div>
    </div>
  );
}
