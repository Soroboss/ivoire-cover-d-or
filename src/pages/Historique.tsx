import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { 
  History, Search, FileText, Database, Package, ShieldAlert, 
  ArrowRight, User, Filter, Calendar, Activity, 
  TrendingUp, CreditCard, Users, Settings, X 
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Historique = () => {
  const { logs } = useAppContext();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTarget, setFilterTarget] = useState('All');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  if (currentUser?.role !== 'Admin') return null;

  const stats = useMemo(() => {
    const todayLogs = logs.filter(log => isToday(parseISO(log.timestamp)));
    const uniqueUsers = new Set(logs.map(log => log.userId)).size;
    const creational = logs.filter(log => log.action === 'CRÉATION').length;
    
    return {
      total: logs.length,
      today: todayLogs.length,
      users: uniqueUsers,
      creations: creational
    };
  }, [logs]);

  const targets = useMemo(() => {
    const uniqueTargets = ['All', ...new Set(logs.map(log => log.target))];
    return uniqueTargets;
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterTarget === 'All' || log.target === filterTarget;
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (target: string) => {
    switch (target) {
      case 'Facture': return <FileText size={18} className="text-purple-500" />;
      case 'Machine': return <Database size={18} className="text-blue-500" />;
      case 'Couvaison': return <Package size={18} className="text-brand-orange" />;
      case 'Dépense': return <CreditCard size={18} className="text-red-500" />;
      case 'Client': return <Users size={18} className="text-indigo-500" />;
      case 'Archive Reçu': return <FileText size={18} className="text-emerald-500" />;
      default: return <Settings size={18} className="text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CRÉATION': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MODIFICATION': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUPPRESSION': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4 sm:px-0">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
             <div className="p-2 bg-brand-orange/10 rounded-xl">
               <History size={28} className="text-brand-orange" />
             </div>
             Registre d'Audit Business
           </h1>
           <p className="text-slate-500 mt-1 flex items-center gap-2">
             <ShieldAlert size={14} />
             Surveillez les modifications sensibles et la traçabilité des opérations en temps réel.
           </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Actions Totales</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Aujourd'hui</p>
            <p className="text-xl font-bold text-slate-900">{stats.today}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Contributeurs</p>
            <p className="text-xl font-bold text-slate-900">{stats.users}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Créations</p>
            <p className="text-xl font-bold text-slate-900">{stats.creations}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Filter size={14} /> Filtres
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Type d'entité</label>
                <div className="flex flex-wrap gap-2">
                  {targets.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterTarget(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        filterTarget === t 
                        ? 'bg-brand-orange text-white border-brand-orange shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-orange/50'
                      }`}
                    >
                      {t === 'All' ? 'Tous' : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-dark rounded-2xl p-5 text-white shadow-lg shadow-brand-dark/10">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Settings size={16} className="text-brand-orange" /> Aide à l'audit
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Le registre conserve les 1000 dernières actions. Pour une recherche plus précise, filtrez par type d'entité (Dépense, Couvaison).
            </p>
          </div>
        </div>

        {/* Main Log Table */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            {filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Date & Heure</th>
                      <th className="px-6 py-4">Utilisateur</th>
                      <th className="px-6 py-4 text-center">Action</th>
                      <th className="px-6 py-4">Cible</th>
                      <th className="px-6 py-4">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-brand-orange"
                      >
                        <td className="px-6 py-4 text-slate-500">
                           <div className="flex flex-col">
                             <span className="font-semibold text-slate-700">{format(parseISO(log.timestamp), "d MMM yyyy", { locale: fr })}</span>
                             <span className="text-xs opacity-70">{format(parseISO(log.timestamp), "HH:mm:ss")}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs border border-slate-200 shadow-inner">
                                 {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[120px]">{log.userName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 text-[10px] font-black tracking-widest rounded border uppercase ${getActionColor(log.action)}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 font-semibold text-slate-700">
                             {getActionIcon(log.target)}
                             <span>{log.target}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                           <div className="flex items-center gap-2 max-w-[300px]">
                              <ArrowRight size={14} className="text-slate-300 shrink-0" />
                              <span className="truncate scrollbar-hide">{log.details}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={40} className="opacity-20" />
                </div>
                <p className="font-bold text-slate-600">Aucun résultat</p>
                <p className="text-xs mt-1">Essayez d'ajuster vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Overlay (Modal-like) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md h-full rounded-3xl shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
                     <History size={20} />
                   </div>
                   <h2 className="font-bold text-lg text-slate-900">Détails de l'action</h2>
                 </div>
                 <button 
                   onClick={() => setSelectedLog(null)}
                   className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                 {/* ID & Date Section */}
                 <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Référence Audit</p>
                    <p className="text-slate-500 font-mono text-sm break-all">{selectedLog.id}</p>
                    <div className="mt-4 flex items-center gap-4 text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                      <Calendar size={16} className="text-brand-orange" />
                      <span>{format(parseISO(selectedLog.timestamp), "eeee d MMMM yyyy 'à' HH:mm:ss", { locale: fr })}</span>
                    </div>
                 </div>

                 {/* User Info */}
                 <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <User size={60} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Utilisateur Responsable</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-brand-orange flex items-center justify-center text-xl font-bold border-2 border-white/20">
                          {selectedLog.userName.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="font-bold text-lg">{selectedLog.userName}</p>
                          <p className="text-xs text-slate-400">ID: {selectedLog.userId}</p>
                       </div>
                    </div>
                 </div>

                 {/* Action Box */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className={`px-3 py-1 text-xs font-black tracking-widest rounded-lg border uppercase ${getActionColor(selectedLog.action)}`}>
                         {selectedLog.action}
                       </span>
                       <div className="flex items-center gap-2 font-bold text-slate-700">
                         {getActionIcon(selectedLog.target)}
                         <span>{selectedLog.target}</span>
                       </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 border-l-4 border-l-brand-orange">
                       <p className="text-xs font-bold text-brand-orange uppercase mb-2">Description complète</p>
                       <p className="text-slate-700 font-medium leading-relaxed">{selectedLog.details}</p>
                    </div>

                    {selectedLog.targetId && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cible ID</p>
                         <p className="text-xs font-mono text-slate-600">{selectedLog.targetId}</p>
                      </div>
                    )}
                 </div>

                 <div className="pt-6">
                    <button 
                      onClick={() => setSelectedLog(null)}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Fermer la vue détaillée
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Historique;
