import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { CouvaisonForm } from '../components/couvaisons/CouvaisonForm';
import { MirageForm } from '../components/couvaisons/MirageForm';
import { EclosionForm } from '../components/couvaisons/EclosionForm';
import EclosionStartForm from '../components/couvaisons/EclosionStartForm';
import { PlacementForm } from '../components/couvaisons/PlacementForm';
import type { StatutCouvaison } from '../types';
import { format, parseISO } from 'date-fns';
import { Search, Filter, Plus, Calendar, CheckCircle, EggOff, Eye, MessageCircle, Trash2, Play } from 'lucide-react';

const formatWhatsAppNumber = (phone?: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned.substring(1);
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
};

type ViewState = 'list' | 'create' | 'mirage' | 'eclosion' | 'eclosionStart' | 'placement';

const Couvaisons = () => {
  const { couvaisons, clients, deleteCouvaison } = useAppContext();
  const { currentUser } = useAuth();
  const [view, setView] = useState<ViewState>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatutCouvaison | 'Tous'>('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const canDelete = currentUser?.role === 'Admin';

  const filteredCouvaisons = useMemo(() => {
    return couvaisons.filter(c => {
      if (statusFilter !== 'Tous' && c.statut !== statusFilter) return false;
      if (searchTerm) {
        const client = clients.find(cl => cl.id === c.clientId);
        return client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    }).sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime());
  }, [couvaisons, clients, statusFilter, searchTerm]);

  const handleOpenMirage = (id: string) => { setActiveId(id); setView('mirage'); };
  const handleOpenEclosion = (id: string) => { setActiveId(id); setView('eclosion'); };
  const handleOpenEclosionStart = (id: string) => { setActiveId(id); setView('eclosionStart'); };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    const ok = window.confirm("Supprimer ce lot ? Ceci efface la saisie (mirage/éclosion/placement) associée.");
    if (!ok) return;
    try {
      await deleteCouvaison(id);
    } catch (e) {
      alert((e as Error).message || 'Erreur lors de la suppression');
    }
  };

  if (view === 'create') {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
         <CouvaisonForm onCancel={() => setView('list')} onSuccess={() => setView('list')} />
      </div>
    );
  }
  
  if (view === 'mirage' && activeId) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
         <MirageForm couvaisonId={activeId} onCancel={() => setView('list')} onSuccess={() => setView('list')} />
      </div>
    );
  }

  if (view === 'eclosion' && activeId) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
         <EclosionForm couvaisonId={activeId} onCancel={() => setView('list')} onSuccess={() => setView('list')} />
      </div>
    );
  }

  if (view === 'eclosionStart' && activeId) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
        <EclosionStartForm
          couvaisonId={activeId}
          onCancel={() => setView('list')}
          onSuccess={() => setView('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-dark">Gestion des Couvaisons</h1>
        <button 
          onClick={() => setView('create')}
          className="bg-brand-orange text-white px-4 py-2 rounded-md font-medium hover:bg-brand-hover shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Nouvelle Couvaison
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden">
        <div className="p-4 border-b border-brand-lightgray flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-brand-muted" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un client..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none text-sm"
              />
           </div>
           <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="text-brand-muted" size={18} />
              <select 
                 value={statusFilter} 
                 onChange={(e) => setStatusFilter(e.target.value as any)}
                 className="text-sm rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-brand-orange outline-none bg-white w-full sm:w-auto"
              >
                 <option value="Tous">Tous les statuts</option>
                 <option value="En cours">En cours</option>
                 <option value="Terminé">Terminés</option>
                 <option value="Annulé">Annulés</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
               <tr>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Détails (Œufs)</th>
                 <th className="px-6 py-4">Dates Clés</th>
                 <th className="px-6 py-4">Statut</th>
                 <th className="px-6 py-4 text-center">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightgray">
               {filteredCouvaisons.length > 0 ? filteredCouvaisons.map(c => {
                 const client = clients.find(cl => cl.id === c.clientId);
                 return (
                   <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <p className="font-semibold text-brand-dark">{client?.nom || 'Inconnu'}</p>
                       <p className="text-xs text-brand-muted">{client?.telephone}</p>
                     </td>
                     <td className="px-6 py-4">
                       <p className="font-medium">{c.nombreOeufs} {c.typeOeuf}s</p>
                       <p className="text-xs text-brand-gray">{c.prixUnitaire} FCFA/u (Total: {c.nombreOeufs * c.prixUnitaire})</p>
                     </td>
                     <td className="px-6 py-4 space-y-1">
                       <p className="text-xs flex items-center gap-1 text-gray-600">
                         <Calendar size={12}/> Machine: {c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : '-'}
                       </p>
                       <p className="text-xs flex items-center gap-1 text-blue-600 font-medium">
                         Mirage: {c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'}
                       </p>
                       <p className="text-xs flex items-center gap-1 text-green-600 font-medium">
                         Éclosion: {c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}
                       </p>
                       {c.dateEclosionDemarrage && (
                         <p className="text-xs flex items-center gap-1 text-amber-700 font-medium">
                           Démarrage éclosion: {format(parseISO(c.dateEclosionDemarrage), 'dd/MM/yyyy')}
                         </p>
                       )}
                       {c.nomDepart && (
                         <p className="text-xs flex items-center gap-1 text-brand-muted">
                           Nom départ: {c.nomDepart}
                         </p>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                         c.statut === 'En cours' ? 'bg-amber-100 text-amber-800' :
                         c.statut === 'Terminé' ? 'bg-green-100 text-green-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {c.statut}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-center space-x-2">
                       {c.statut === 'En attente' && (
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => { setActiveId(c.id); setView('placement'); }} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded hover:bg-brand-hover transition-colors whitespace-nowrap">
                             Placer en machine
                           </button>
                           <a 
                             href={`https://wa.me/${formatWhatsAppNumber(client?.telephone)}?text=${encodeURIComponent(`Bonjour ${client?.nom || ''},\n\nNous vous confirmons la bonne réception de votre lot de ${c.nombreOeufs} œufs de ${c.typeOeuf}.\nIls sont actuellement en salle d'attente et seront prochainement placés en machine par l'équipe technique.\n\nMerci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`)}`} 
                             target="_blank" rel="noopener noreferrer" title="WhatsApp: Reçu en attente" className="p-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 transition-colors"
                           >
                             <MessageCircle size={18} />
                           </a>
                           {canDelete && (
                             <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors" title="Supprimer le lot">
                               <Trash2 size={18} />
                             </button>
                           )}
                         </div>
                       )}
                       {c.statut === 'En cours' && (
                         <div className="flex items-center justify-center gap-2">
                           <a 
                             href={`https://wa.me/${formatWhatsAppNumber(client?.telephone)}?text=${encodeURIComponent(`Bonjour ${client?.nom || ''},\n\nNous vous confirmons la réception de votre lot de ${c.nombreOeufs} œufs de ${c.typeOeuf}.\n\n📅 Date de mise en machine : ${c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : '-'}\n🔍 Date prévue pour le mirage (J+7) : ${c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'}\n🐣 Date prévue pour l'éclosion : ${c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}\n\nMerci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`)}`} 
                             target="_blank" rel="noopener noreferrer" title="WhatsApp: Réception & Planning" className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                           >
                             <MessageCircle size={18} />
                           </a>
                           <button onClick={() => handleOpenMirage(c.id)} title="Enregistrer Mirage" className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                             <Eye size={18} />
                           </button>
                           {!c.dateEclosionDemarrage ? (
                             <button
                               onClick={() => handleOpenEclosionStart(c.id)}
                               title="Enregistrer Démarrage éclosion"
                               className="p-2 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors"
                             >
                               <Play size={18} />
                             </button>
                           ) : (
                             <button
                               onClick={() => handleOpenEclosion(c.id)}
                               title="Clôturer Éclosion"
                               className="p-2 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors"
                             >
                               <EggOff size={18} />
                             </button>
                           )}
                           {canDelete && (
                             <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors" title="Supprimer le lot">
                               <Trash2 size={18} />
                             </button>
                           )}
                         </div>
                       )}
                       {c.statut === 'Terminé' && (
                          <div className="text-xs text-brand-muted flex items-center justify-center gap-3">
                             <div className="flex flex-col items-center">
                               <CheckCircle size={16} className="text-green-500 mb-1" />
                               {c.poussinsNes}/{c.nombreOeufs}
                             </div>
                             <a 
                               href={`https://wa.me/${formatWhatsAppNumber(client?.telephone)}?text=${encodeURIComponent(`Bonjour ${client?.nom || ''},\n\nL'incubation de votre lot de ${c.typeOeuf}s est terminée !\n\n🥚 Œufs mis en machine : ${c.nombreOeufs}\n🐥 Poussins viables (éclos) : ${c.poussinsNes}\n\nVous pouvez dès à présent passer retirer vos poussins. Merci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`)}`} 
                               target="_blank" rel="noopener noreferrer" title="WhatsApp: Bilan Éclosion" className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                             >
                               <MessageCircle size={18} />
                             </a>
                             {canDelete && (
                               <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors" title="Supprimer le lot">
                                 <Trash2 size={18} />
                               </button>
                             )}
                          </div>
                       )}
                     </td>
                   </tr>
                 );
               }) : (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-brand-muted">
                     Aucune couvaison trouvée avec ces critères.
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
        {view === 'placement' && activeId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <PlacementForm 
              couvaisonId={activeId} 
              onCancel={() => { setView('list'); setActiveId(null); }}
              onSuccess={() => { setView('list'); setActiveId(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Couvaisons;
