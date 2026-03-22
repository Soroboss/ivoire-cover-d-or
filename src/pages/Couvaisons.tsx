import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { CouvaisonForm } from '../components/couvaisons/CouvaisonForm';
import { MirageForm } from '../components/couvaisons/MirageForm';
import { EclosionHub } from '../components/couvaisons/EclosionHub';
import { PlacementForm } from '../components/couvaisons/PlacementForm';
import type { StatutCouvaison } from '../types';
import { format, parseISO } from 'date-fns';
import { Search, Filter, Plus, Calendar, CheckCircle, Egg, Eye, MessageCircle, Trash2 } from 'lucide-react';
import { formatEmplacementsLigne } from '../lib/casierLabels';
import { isIsoDateInRange } from '../lib/dateRangeFilter';

const formatWhatsAppNumber = (phone?: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned.substring(1);
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
};

type ViewState = 'list' | 'create' | 'mirage' | 'eclosionHub' | 'placement';

const Couvaisons = () => {
  const { couvaisons, clients, machines, deleteCouvaison, addClientMessage } = useAppContext();
  const { currentUser } = useAuth();
  const [view, setView] = useState<ViewState>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatutCouvaison | 'Tous'>('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [receptionFrom, setReceptionFrom] = useState('');
  const [receptionTo, setReceptionTo] = useState('');
  const canDelete = currentUser?.role === 'Admin';

  const filteredCouvaisons = useMemo(() => {
    return couvaisons
      .filter((c) => {
        if (statusFilter !== 'Tous' && c.statut !== statusFilter) return false;
        if (!isIsoDateInRange(c.dateReception, receptionFrom, receptionTo)) return false;
        if (searchTerm) {
          const client = clients.find((cl) => cl.id === c.clientId);
          return client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime());
  }, [couvaisons, clients, statusFilter, searchTerm, receptionFrom, receptionTo]);

  const handleOpenMirage = (id: string) => { setActiveId(id); setView('mirage'); };
  const handleOpenEclosionHub = (id: string) => { setActiveId(id); setView('eclosionHub'); };

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

  const sendClientWhatsApp = async (
    clientId: string | undefined,
    couvaisonId: string,
    template: string,
    message: string,
    phone?: string,
  ) => {
    if (!phone || !clientId) return;
    const url = `https://wa.me/${formatWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
    try {
      await addClientMessage({
        clientId,
        couvaisonId,
        canal: 'WhatsApp',
        statut: 'Envoye',
        template,
        message,
        sentByUserId: currentUser?.id,
        sentByName: currentUser?.nom,
      });
    } catch {
      // No-op: on n'empêche pas l'envoi WhatsApp si le log échoue.
    }
    window.open(url, '_blank', 'noopener,noreferrer');
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

  if (view === 'eclosionHub' && activeId) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
        <EclosionHub couvaisonId={activeId} onCancel={() => setView('list')} onSuccess={() => setView('list')} />
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
        <div className="space-y-3 border-b border-brand-lightgray bg-gray-50/50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <Calendar size={14} /> Réception
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only">Date réception du</label>
                <input
                  type="date"
                  value={receptionFrom}
                  onChange={(e) => setReceptionFrom(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none"
                  title="Réception à partir du"
                />
                <span className="text-xs text-brand-muted">au</span>
                <label className="sr-only">Date réception au</label>
                <input
                  type="date"
                  value={receptionTo}
                  onChange={(e) => setReceptionTo(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none"
                  title="Réception jusqu’au"
                />
                {(receptionFrom || receptionTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceptionFrom('');
                      setReceptionTo('');
                    }}
                    className="text-xs font-semibold text-brand-orange hover:underline"
                  >
                    Effacer les dates
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-brand-muted lg:max-w-xs">
              Un seul jour : même date dans « du » et « au ». Laisser vide pour tout afficher.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 text-brand-muted" size={18} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-orange focus:outline-none"
              />
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Filter className="shrink-0 text-brand-muted" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatutCouvaison | 'Tous')}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none sm:w-auto"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminés</option>
                <option value="Annulé">Annulés</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
               <tr>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Réception</th>
                 <th className="px-6 py-4">Détails (Œufs)</th>
                 <th className="px-6 py-4">Dates Clés</th>
                 <th className="px-6 py-4">Statut</th>
                 <th className="px-6 py-4 text-center">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightgray">
               {filteredCouvaisons.length > 0 ? filteredCouvaisons.map(c => {
                 const client = clients.find(cl => cl.id === c.clientId);
                 const mirageFait = c.oeufsClairs != null || c.oeufsPourris != null;
                 const avantMirage = formatEmplacementsLigne(
                   mirageFait ? c.emplacementsAvantMirage ?? c.emplacements : c.emplacements,
                   machines,
                 );
                 const apresMirage = formatEmplacementsLigne(
                   mirageFait ? c.emplacementsApresMirage ?? c.emplacements : undefined,
                   machines,
                 );
                 return (
                   <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <p className="font-semibold text-brand-dark">{client?.nom || 'Inconnu'}</p>
                       <p className="text-xs text-brand-muted">{client?.telephone}</p>
                     </td>
                     <td className="px-6 py-4 text-sm font-medium text-brand-dark">
                       {format(parseISO(c.dateReception), 'dd/MM/yyyy')}
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
                       {mirageFait ? (
                         <>
                           <p className="text-xs text-slate-600">
                             <span className="font-semibold text-brand-dark">Tiroirs avant mirage :</span> {avantMirage}
                           </p>
                           <p className="text-xs text-slate-600">
                             <span className="font-semibold text-brand-dark">Tiroirs après mirage :</span> {apresMirage}
                           </p>
                         </>
                       ) : (
                         c.emplacements &&
                         c.emplacements.length > 0 && (
                           <p className="text-xs text-slate-600">
                             <span className="font-semibold text-brand-dark">Tiroirs :</span>{' '}
                             {formatEmplacementsLigne(c.emplacements, machines)}
                           </p>
                         )
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                         c.statut === 'En attente' ? 'bg-yellow-100 text-yellow-900' :
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
                           <button
                             onClick={() => sendClientWhatsApp(
                               client?.id,
                               c.id,
                               'reception_en_attente',
                               `Bonjour ${client?.nom || ''},\n\nNous vous confirmons la bonne réception de votre lot de ${c.nombreOeufs} œufs de ${c.typeOeuf}.\nIls sont actuellement en salle d'attente et seront prochainement placés en machine par l'équipe technique.\n\nMerci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`,
                               client?.telephone,
                             )}
                             title="WhatsApp: Reçu en attente"
                             className="p-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 transition-colors"
                           >
                             <MessageCircle size={18} />
                           </button>
                           {canDelete && (
                             <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors" title="Supprimer le lot">
                               <Trash2 size={18} />
                             </button>
                           )}
                         </div>
                       )}
                       {c.statut === 'En cours' && (
                         <div className="flex items-center justify-center gap-2">
                           <button
                             onClick={() => sendClientWhatsApp(
                               client?.id,
                               c.id,
                               'planning_incubation',
                               `Bonjour ${client?.nom || ''},\n\nNous vous confirmons la réception de votre lot de ${c.nombreOeufs} œufs de ${c.typeOeuf}.\n\n📅 Date de mise en machine : ${c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : '-'}\n🔍 Date prévue pour le mirage (réception +14 j.) : ${c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'}\n🐣 Date prévue pour l'éclosion : ${c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}\n\nMerci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`,
                               client?.telephone,
                             )}
                             title="WhatsApp: Réception & Planning"
                             className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                           >
                             <MessageCircle size={18} />
                           </button>
                           <button onClick={() => handleOpenMirage(c.id)} title="Enregistrer Mirage" className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                             <Eye size={18} />
                           </button>
                           <button
                             onClick={() => handleOpenEclosionHub(c.id)}
                             title="Éclosion : démarrage ou clôture (onglets)"
                             className="p-2 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors"
                           >
                             <Egg size={18} />
                           </button>
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
                             <button
                               onClick={() => sendClientWhatsApp(
                                 client?.id,
                                 c.id,
                                 'bilan_eclosion',
                                 `Bonjour ${client?.nom || ''},\n\nL'incubation de votre lot de ${c.typeOeuf}s est terminée !\n\n🥚 Œufs mis en machine : ${c.nombreOeufs}\n🐥 Poussins viables (éclos) : ${c.poussinsNes}\n\nVous pouvez dès à présent passer retirer vos poussins. Merci pour votre confiance ! L'équipe Ivoire Couvée d'Or.`,
                                 client?.telephone,
                               )}
                               title="WhatsApp: Bilan Éclosion"
                               className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                             >
                               <MessageCircle size={18} />
                             </button>
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
                   <td colSpan={6} className="px-6 py-12 text-center text-brand-muted">
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
