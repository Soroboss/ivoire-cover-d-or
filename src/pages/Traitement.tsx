import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { MirageForm } from '../components/couvaisons/MirageForm';
import { EclosionHub } from '../components/couvaisons/EclosionHub';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { Eye, Egg, Calendar, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { formatEmplacementsLigne } from '../lib/casierLabels';

type TraitementType = 'mirage' | 'eclosion';

export default function Traitement() {
  const { couvaisons, clients, machines } = useAppContext();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TraitementType>('mirage');
  const [activeForm, setActiveForm] = useState<{ id: string, type: TraitementType } | null>(null);

  const today = startOfDay(new Date());

  const categorizedData = useMemo(() => {
    const list = couvaisons.filter(c => c.statut === 'En cours');
    
    const res = {
      mirage: {
        j: [] as any[],
        j1: [] as any[],
        j3: [] as any[],
      },
      eclosion: {
        j: [] as any[],
        j1: [] as any[],
        j3: [] as any[],
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
      }

      // Eclosion
      if (c.dateEclosionPrevue && !c.dateEclosionDemarrage) {
        const dateE = startOfDay(parseISO(c.dateEclosionPrevue));
        const diff = differenceInDays(today, dateE);

        if (diff === 0) res.eclosion.j.push(c);
        else if (diff >= 1 && diff < 3) res.eclosion.j1.push(c);
        else if (diff >= 3) res.eclosion.j3.push(c);
      }
    });

    return res;
  }, [couvaisons, today]);

  if (activeForm) {
    if (activeForm.type === 'mirage') {
      return (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
           <MirageForm 
            couvaisonId={activeForm.id} 
            onCancel={() => setActiveForm(null)} 
            onSuccess={() => setActiveForm(null)} 
           />
        </div>
      );
    }
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
        <EclosionHub 
          couvaisonId={activeForm.id} 
          onCancel={() => setActiveForm(null)} 
          onSuccess={() => setActiveForm(null)} 
        />
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Atelier de Traitement</h1>
          <p className="text-slate-500 text-sm">Suivi des tâches critiques du jour et backlog technique.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('mirage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'mirage' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <Eye size={18} />
            Mirage
            {categorizedData.mirage.j.length + categorizedData.mirage.j1.length + categorizedData.mirage.j3.length > 0 && (
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                {categorizedData.mirage.j.length + categorizedData.mirage.j1.length + categorizedData.mirage.j3.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('eclosion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'eclosion' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <Egg size={18} />
            Éclosion
            {categorizedData.eclosion.j.length + categorizedData.eclosion.j1.length + categorizedData.eclosion.j3.length > 0 && (
              <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                {categorizedData.eclosion.j.length + categorizedData.eclosion.j1.length + categorizedData.eclosion.j3.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-8">
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
      </div>
    </div>
  );
}
