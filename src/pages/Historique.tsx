import { useState } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { History, Search, FileText, Database, Package, ShieldAlert, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Historique = () => {
  const { logs } = useAppContext();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.role !== 'Admin') return null;

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (target: string) => {
    switch (target) {
      case 'Facture': return <FileText size={18} className="text-purple-500" />;
      case 'Machine': return <Database size={18} className="text-gray-500" />;
      case 'Couvaison': return <Package size={18} className="text-brand-orange" />;
      default: return <ShieldAlert size={18} className="text-red-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CRÉATION': return 'bg-green-100 text-green-800 border-green-200';
      case 'MODIFICATION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUPPRESSION': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
             <History size={28} className="text-brand-orange" />
             Registre d'Audit
           </h1>
           <p className="text-sm text-brand-muted mt-1">Traçabilité complète des actions effectuées par votre équipe sur le logiciel.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Rechercher (ex: 'Couvaison', 'Jean')..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none w-full md:w-64 bg-white shadow-sm"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden">
        {filteredLogs.length > 0 ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
              <tr>
                <th className="px-6 py-4">Date & Heure</th>
                <th className="px-6 py-4">Auteur</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 w-full">Détails de l'opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightgray">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                     {format(parseISO(log.timestamp), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-dark flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-brand-lightgray text-brand-dark flex items-center justify-center text-xs">
                        {log.userName.charAt(0).toUpperCase()}
                     </div>
                     {log.userName}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded border uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                     {getActionIcon(log.target)}
                     <span>{log.target}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[300px]">
                     <div className="flex items-center gap-2">
                        <ArrowRight size={14} className="text-gray-300" />
                        <span title={log.details} className="truncate">{log.details}</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-brand-muted">
            <History size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-brand-dark text-lg">Aucun historique trouvé</p>
            <p className="text-sm mt-1">Le registre d'activité est vide ou aucun résultat ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Historique;
