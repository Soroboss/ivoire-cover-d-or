import { useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { BrainCircuit, Lightbulb, AlertOctagon, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Diagnostic {
  type: 'danger' | 'warning' | 'success';
  title: string;
  message: string;
}

const Analyses = () => {
  const { couvaisons, clients } = useAppContext();
  
  const rules = useMemo(() => {
    const completed = couvaisons.filter(c => c.statut === 'Terminé');
    const logs: Diagnostic[] = [];
    
    if (completed.length === 0) {
      return [{ type: 'warning' as const, title: 'Données Insuffisantes', message: 'Il n\'y a pas encore assez de couvaisons terminées pour générer des conseils experts.' }];
    }

    // 1. Infertility Rule (Œufs clairs)
    const totalEggs = completed.reduce((acc, c) => acc + c.nombreOeufs, 0);
    const totalClairs = completed.reduce((acc, c) => acc + (c.oeufsClairs || 0), 0);
    const pctClairs = totalEggs > 0 ? (totalClairs / totalEggs) * 100 : 0;
    
    if (pctClairs > 15) {
      logs.push({
        type: 'danger',
        title: `Alerte Infertilité (${pctClairs.toFixed(1)}% d'œufs clairs)`,
        message: "Demandez à vos éleveurs de revoir leur ratio Mâles/Femelles (1 coq pour 10 poules selon la race) et de corriger les potentielles carences (Vitamine E, Sélénium)."
      });
    }

    // 2. Morts en coque (Hatching phase issue)
    const totalFrt = totalEggs - totalClairs - completed.reduce((acc, c) => acc + (c.oeufsPourris || 0), 0);
    const totalMorts = completed.reduce((acc, c) => acc + (c.mortsEnCoque || 0), 0);
    const pctMorts = totalFrt > 0 ? (totalMorts / totalFrt) * 100 : 0;
    
    if (pctMorts > 8) {
      logs.push({
        type: 'danger',
        title: `Anomalie Éclosoir (${pctMorts.toFixed(1)}% morts en coque)`,
        message: "L'humidité ou l'oxygénation dans l'éclosoir (les 3 derniers jours) est inadaptée. Les poussins s'épuisent avant de percer la coquille. Vérifiez vos entrées d'air."
      });
    }

    // 3. Infections
    const totalPourris = completed.reduce((acc, c) => acc + (c.oeufsPourris || 0), 0);
    const pctPourris = totalEggs > 0 ? (totalPourris / totalEggs) * 100 : 0;
    
    if (pctPourris > 3) {
      logs.push({
        type: 'warning',
        title: `Alerte Hygiène (${pctPourris.toFixed(1)}% d'œufs contaminés)`,
        message: "Forte présence bactérienne identifiée au mirage. Exigez de vos clients un ramassage plus régulier et une désinfection stricte des pondoirs."
      });
    }

    if (logs.length === 0) {
      logs.push({
        type: 'success',
        title: "Performances Excellentes",
        message: "Les indicateurs zootechniques de fertilité et d'incubation sont tous dans les standards de la haute performance de l'industrie."
      });
    }

    return logs;
  }, [couvaisons]);

  const birdStats = useMemo(() => {
    const stats: Record<string, { eggs: number, clairs: number, hat: number }> = {};
    couvaisons.filter(c => c.statut === 'Terminé').forEach(c => {
       if(!stats[c.typeOeuf]) stats[c.typeOeuf] = { eggs: 0, clairs: 0, hat: 0 };
       stats[c.typeOeuf].eggs += c.nombreOeufs;
       stats[c.typeOeuf].clairs += (c.oeufsClairs || 0) + (c.oeufsPourris || 0);
       stats[c.typeOeuf].hat += (c.poussinsNes || 0);
    });
    return Object.entries(stats).map(([name, data]) => ({
       name,
       Fecondite: data.eggs > 0 ? Math.round(((data.eggs - data.clairs) / data.eggs) * 100) : 0,
       Eclosion: (data.eggs - data.clairs) > 0 ? Math.round((data.hat / (data.eggs - data.clairs)) * 100) : 0
    }));
  }, [couvaisons]);

  const clientStats = useMemo(() => {
    const stats: Record<string, { eggs: number, hat: number }> = {};
    couvaisons.filter(c => c.statut === 'Terminé').forEach(c => {
       if(!stats[c.clientId]) stats[c.clientId] = { eggs: 0, hat: 0 };
       stats[c.clientId].eggs += c.nombreOeufs;
       stats[c.clientId].hat += (c.poussinsNes || 0);
    });
    return Object.entries(stats).map(([id, data]) => {
       const client = clients?.find(cl => cl.id === id);
       return {
         name: client?.nom || 'Inconnu',
         TauxReussite: data.eggs > 0 ? Math.round((data.hat / data.eggs) * 100) : 0
       };
    }).sort((a,b) => b.TauxReussite - a.TauxReussite).slice(0, 10);
  }, [couvaisons, clients]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
             <BrainCircuit size={28} className="text-brand-orange" />
             Système Expert & Conseils
           </h1>
           <p className="text-sm text-brand-muted mt-1">Interprétations automatisées basées sur l'agronomie pour orienter vos décisions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden flex flex-col">
           <div className="bg-brand-dark p-4 flex items-center justify-between text-white">
              <h2 className="font-semibold flex items-center gap-2 tracking-wide"><Lightbulb className="text-yellow-400" size={20} /> Diagnostic Croisé Automatique</h2>
           </div>
           <div className="p-6 space-y-4 flex-1">
             {rules.map((rule, idx) => (
                <div key={idx} className={`p-4 rounded-lg flex gap-4 items-start ${rule.type === 'danger' ? 'bg-red-50 border border-red-100' : rule.type === 'warning' ? 'bg-amber-50 border border-amber-100' : 'bg-green-50 border border-green-100'}`}>
                   {rule.type === 'success' ? <CheckCircle className="text-green-600 mt-0.5" size={24} /> : <AlertOctagon className={rule.type === 'danger' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} size={24} />}
                   <div>
                     <h3 className={`font-bold ${rule.type === 'danger' ? 'text-red-800' : rule.type === 'warning' ? 'text-amber-800' : 'text-green-800'}`}>{rule.title}</h3>
                     <p className={`text-sm mt-1 leading-relaxed ${rule.type === 'danger' ? 'text-red-700' : rule.type === 'warning' ? 'text-amber-700' : 'text-green-700'}`}>{rule.message}</p>
                   </div>
                </div>
             ))}
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
           <h2 className="text-lg font-semibold text-brand-dark mb-4">Performance Qualitatives par Type (Lot)</h2>
           <p className="text-xs text-brand-muted mb-6">Comparaison des seuils de Fécondité (Éleveur) vs Éclosion (Incubateur) purs.</p>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                {birdStats.length > 0 ? (
                 <BarChart data={birdStats}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                   <YAxis unit="%" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                   <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                   <Bar dataKey="Fecondite" name="Fécondité (Souche)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Eclosion" name="Éclosion (Machine)" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
                ) : (
                  <div className="flex bg-brand-lightgray/50 rounded-lg h-full items-center justify-center text-brand-muted">Données insuffisantes</div>
                )}
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
         <h2 className="text-lg font-semibold text-brand-dark mb-4">Taux d'Éclosion par Client (Top 10)</h2>
         <p className="text-xs text-brand-muted mb-6">Comparatif de réussite globale par éleveur pour cibler ceux nécessitant des visites terrain.</p>
         <div className="h-72">
           <ResponsiveContainer width="100%" height="100%">
              {clientStats.length > 0 ? (
               <BarChart data={clientStats} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                 <XAxis type="number" unit="%" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                 <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 12}} />
                 <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                 <Bar dataKey="TauxReussite" name="Réussite Globale" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
              ) : (
                <div className="flex bg-brand-lightgray/50 rounded-lg h-full items-center justify-center text-brand-muted">Données insuffisantes</div>
              )}
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
export default Analyses;
