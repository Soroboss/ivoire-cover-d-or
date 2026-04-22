import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { CouvaisonForm } from '../components/couvaisons/CouvaisonForm';
import { MirageForm } from '../components/couvaisons/MirageForm';
import { EclosionHub } from '../components/couvaisons/EclosionHub';
import { PlacementForm } from '../components/couvaisons/PlacementForm';
import { ClientFinanceCardModal } from '../components/clients/ClientFinanceCardModal';
import type { Client, MessageTemplate } from '../types';
import { format, parseISO } from 'date-fns';
import { Search, Plus, Calendar, CheckCircle, Egg, Eye, MessageCircle, Trash2 } from 'lucide-react';
import { formatEmplacementsLigne } from '../lib/casierLabels';
import { isIsoDateInRange } from '../lib/dateRangeFilter';
import { formatWhatsAppMessage, normalizePhoneForWhatsApp } from '../lib/whatsappTemplates';

type ViewState = 'list' | 'create' | 'mirage' | 'eclosionHub' | 'placement';

const Couvaisons = () => {
  const { couvaisons, clients, machines, transactions, messageTemplates, deleteCouvaison, addClientMessage } = useAppContext();
  const { currentUser } = useAuth();
  const [view, setView] = useState<ViewState>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Nouveau' | 'Placement' | 'Mirage' | 'Eclosion' | 'Terminé' | 'Annulé'>('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [receptionFrom, setReceptionFrom] = useState('');
  const [receptionTo, setReceptionTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const canDelete = currentUser?.role === 'Admin';

  const [sortBy, setSortBy] = useState<'reception' | 'registration'>('reception');

  const eggTypes = useMemo(() => {
    const types = new Set(couvaisons.map(c => c.typeOeuf));
    return Array.from(types).sort();
  }, [couvaisons]);

  const filteredCouvaisons = useMemo(() => {
    return couvaisons
      .filter((c) => {
        if (statusFilter !== 'Tous') {
          if (statusFilter === 'Nouveau' && c.statut !== 'En attente') return false;
          if (statusFilter === 'Placement' && (c.statut !== 'En cours' || c.oeufsClairs != null)) return false;
          if (statusFilter === 'Mirage' && (c.oeufsClairs == null || c.dateEclosionDemarrage)) return false;
          if (statusFilter === 'Eclosion' && !c.dateEclosionDemarrage) return false;
          if (statusFilter === 'Terminé' && c.statut !== 'Terminé') return false;
          if (statusFilter === 'Annulé' && c.statut !== 'Annulé') return false;
        }
        if (!isIsoDateInRange(c.dateReception, receptionFrom, receptionTo)) return false;
        if (typeFilter && c.typeOeuf !== typeFilter) return false;
        if (searchTerm) {
          const client = clients.find((cl) => cl.id === c.clientId);
          return client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reception') {
          return new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime();
        } else {
          return couvaisons.indexOf(b) - couvaisons.indexOf(a);
        }
      });
  }, [couvaisons, clients, statusFilter, searchTerm, receptionFrom, receptionTo, typeFilter, sortBy]);

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
    category: MessageTemplate['category'],
    fallbackMessage: string,
    phone?: string
  ) => {
    if (!phone || !clientId) return;
    
    const client = clients.find(cl => cl.id === clientId);
    const couv = couvaisons.find(c => c.id === couvaisonId);
    if (!client || !couv) return;

    const template = messageTemplates.find(t => t.category === category && t.isActive) 
      || { name: 'Fallback', category, content: fallbackMessage, isActive: true };

    const finalMessage = formatWhatsAppMessage(template as any, {
      client,
      couvaison: couv,
      transactions
    });

    const url = `https://wa.me/${normalizePhoneForWhatsApp(phone)}?text=${encodeURIComponent(finalMessage)}`;
    try {
      await addClientMessage({
        clientId,
        couvaisonId,
        canal: 'WhatsApp',
        statut: 'Envoye',
        template: category,
        message: finalMessage,
        sentByUserId: currentUser?.id,
        sentByName: currentUser?.nom,
      });
    } catch { /* no-op */ }
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
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/50 rounded-lg border border-gray-200">
                {[
                  { id: 'Tous', label: 'Tous', icon: '📊' },
                  { id: 'Nouveau', label: 'Réception', icon: '🆕' },
                  { id: 'Placement', label: 'En Couvaison', icon: '⚙️' },
                  { id: 'Mirage', label: 'Mirage Fait', icon: '🔍' },
                  { id: 'Eclosion', label: 'Éclosion', icon: '🐣' },
                  { id: 'Terminé', label: 'Terminé', icon: '✅' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      statusFilter === tab.id 
                        ? 'bg-white text-brand-orange shadow-sm border border-brand-orange/20 scale-105' 
                        : 'text-brand-muted hover:bg-white/60 hover:text-brand-dark'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-semibold focus:ring-2 focus:ring-brand-orange focus:outline-none sm:w-auto text-brand-dark shadow-sm"
                >
                  <option value="">🥚 Tous les œufs</option>
                  {eggTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'reception' | 'registration')}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-semibold focus:ring-2 focus:ring-brand-orange focus:outline-none sm:w-auto text-brand-dark shadow-sm"
                >
                  <option value="reception">🕒 Tri par Date Arrivée</option>
                  <option value="registration">📑 Tri par Date Enregistrement</option>
                </select>
                <div className="text-[10px] text-brand-muted font-medium ml-2">
                  Total: <span className="text-brand-orange font-bold">{filteredCouvaisons.length}</span> lot(s) affiché(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
               <tr>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Réception</th>
                 <th className="px-6 py-4">Détails (Œufs)</th>
                 <th className="px-6 py-4">Dates Clés</th>
                 <th className="px-6 py-4">Statut</th>
                 <th className="px-6 py-4 text-center sticky right-0 z-10 bg-gray-50 shadow-[rgba(0,0,0,0.1)_-4px_0_6px_-2px]">Actions</th>
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
                 const totalDue = (c.nombreOeufs || 0) * (c.prixUnitaire || 0);
                 const paid = transactions
                   .filter(t => (t.typeTransaction as string) === 'Paiement' && t.couvaisonId === c.id)
                   .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
                 const balance = totalDue - paid;

                 return (
                   <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <button 
                         onClick={() => client && setViewingClient(client)}
                         className="text-left group transition-all"
                         title="Voir le profil financier du client"
                       >
                         <p className="font-semibold text-brand-dark group-hover:text-brand-orange underline decoration-brand-orange/20 decoration-2 underline-offset-2 transition-all">{client?.nom || 'Inconnu'}</p>
                         <p className="text-xs text-brand-muted group-hover:text-brand-dark">{client?.telephone}</p>
                       </button>
                     </td>
                     <td className="px-6 py-4 text-sm font-medium text-brand-dark">
                       {format(parseISO(c.dateReception), 'dd/MM/yyyy')}
                     </td>
                     <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-brand-dark">{c.nombreOeufs} {c.typeOeuf}s</p>
                          <p className="text-[10px] text-brand-muted">{(c.nombreOeufs * c.prixUnitaire).toLocaleString()} F (Détail: {c.prixUnitaire} F/u)</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                             <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">Payé: {paid.toLocaleString()} F</span>
                             {balance > 0 && (
                               <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">Reste: {balance.toLocaleString()} F</span>
                             )}
                             {balance <= 0 && (
                               <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">Soudé ✅</span>
                             )}
                          </div>
                        </div>
                        
                        {mirageFait && (
                          <div className="mt-2 p-1.5 bg-blue-50 border border-blue-100 rounded text-[10px] leading-tight text-blue-800">
                             <div className="flex justify-between font-bold"><span>Œufs Viables:</span> <span>{(c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0))}</span></div>
                             <div className="flex justify-between text-brand-muted mt-0.5"><span>Clairs/Pourris:</span> <span>{(c.oeufsClairs || 0) + (c.oeufsPourris || 0)}</span></div>
                          </div>
                        )}
                        {c.dateEclosionDemarrage && (
                          <div className="mt-1.5 p-1.5 bg-green-50 border border-green-100 rounded text-[10px] leading-tight text-green-800 font-medium">
                             <div>Éclos: <span className="font-bold text-green-700">{c.poussinsNes || 0}</span> | Pertes: {c.mortsEnCoque || 0}</div>
                             <div className="mt-1 pt-1 border-t border-green-200 flex justify-between">
                               <span>Reste machine:</span> 
                               <span className="font-black underline text-green-600">{(c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0) - (c.poussinsNes || 0) - (c.mortsEnCoque || 0))}</span>
                             </div>
                          </div>
                        )}
                      </td>
                     <td className="px-6 py-4">
                        <div className="grid grid-cols-1 gap-1.5 min-w-[140px]">
                           <div className="flex items-center gap-2 p-1 bg-gray-50 rounded border border-gray-100">
                             <Calendar size={12} className="text-gray-400" />
                             <div className="flex flex-col">
                               <span className="text-[9px] text-brand-muted uppercase font-bold leading-none">Mise en machine</span>
                               <span className="text-xs font-semibold text-brand-dark">{c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : '-'}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-2 p-1 bg-blue-50 rounded border border-blue-100">
                             <Eye size={12} className="text-blue-400" />
                             <div className="flex flex-col">
                               <span className="text-[9px] text-blue-800 uppercase font-bold leading-none">Date Mirage</span>
                               <span className="text-xs font-semibold text-blue-700">{c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-2 p-1 bg-green-50 rounded border border-green-100">
                             <Egg size={12} className="text-green-400" />
                             <div className="flex flex-col">
                               <span className="text-[9px] text-green-800 uppercase font-bold leading-none">Date Éclosion</span>
                               <span className="text-xs font-semibold text-green-700">{c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}</span>
                             </div>
                           </div>
                           {c.dateEclosionDemarrage && (
                             <div className="flex items-center gap-2 p-1 bg-amber-50 rounded border border-amber-100">
                               <CheckCircle size={12} className="text-amber-500" />
                               <div className="flex flex-col">
                                 <span className="text-[9px] text-amber-800 uppercase font-bold leading-none">Démarrage Réel</span>
                                 <span className="text-xs font-semibold text-amber-700">{format(parseISO(c.dateEclosionDemarrage), 'dd/MM/yyyy')}</span>
                               </div>
                             </div>
                           )}
                           {c.nomDepart && (
                              <p className="text-[9px] text-brand-muted italic bg-white border border-dashed px-1 py-0.5 rounded text-center">
                                Lot: {c.nomDepart}
                              </p>
                            )}
                        </div>
                        {mirageFait ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] text-slate-500">
                              <span className="font-semibold text-brand-dark">Avant:</span> {avantMirage}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              <span className="font-semibold text-brand-dark">Après:</span> {apresMirage}
                            </p>
                          </div>
                        ) : (
                          c.emplacements &&
                          c.emplacements.length > 0 && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              <span className="font-semibold text-brand-dark">Tiroirs:</span>{' '}
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
                     <td className="px-6 py-4 text-center space-x-2 sticky right-0 z-10 bg-white shadow-[rgba(0,0,0,0.1)_-4px_0_6px_-2px]">
                       {c.statut === 'En attente' && (
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => { setActiveId(c.id); setView('placement'); }} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded hover:bg-brand-hover transition-colors whitespace-nowrap">
                             Placer en machine
                           </button>
                           <button
                             onClick={() => sendClientWhatsApp(
                               client?.id,
                               c.id,
                               'RECEPTION',
                               `📝 *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR* 📝\n\nCher(e) *${client?.nom || ''}*,\n\nNous vous confirmons la bonne réception de votre lot.\n\n📅 *Dépôt le* : ${c.dateReception ? format(parseISO(c.dateReception), 'dd/MM/yyyy') : '-'}\n📦 *Détail des lots* :\n{{details_lots}}\n\n📊 *SUIVI FINANCIER* :\n- Montant total : {{montant_total}} F\n- Acompte versé : {{acompte}} F\n🚩 *Reste à régler : {{reste_a_payer}} F*\n\n🕒 *PROCHAINES ÉTAPES* :\n🔍 Mirage technique : environ le ${c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'} (vérification de la fertilité).\n🐣 Éclosion finale prévue : environ le ${c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}.\n\n_Veuillez conserver ce message comme preuve de dépôt. Merci !_`,
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
                               'RECEPTION',
                               `📝 *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR* 📝\n\nCher(e) *${client?.nom || ''}*,\n\nNous vous confirmons la prise en charge technique de votre lot.\n\n📅 *Dépôt le* : ${c.dateReception ? format(parseISO(c.dateReception), 'dd/MM/yyyy') : '-'}\n📦 *Détail des lots* :\n{{details_lots}}\n\n📊 *SUIVI FINANCIER* :\n- Montant total : {{montant_total}} F\n- Acompte versé : {{acompte}} F\n🚩 *Reste à régler : {{reste_a_payer}} F*\n\n🕒 *PROCHAINES ÉTAPES* :\n🔍 Mirage technique : environ le ${c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'} (vérification de la fertilité).\n🐣 Éclosion finale prévue : environ le ${c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}.\n\n_Merci de votre confiance !_`,
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
                           {mirageFait && (
                             <button
                               onClick={() => sendClientWhatsApp(
                                 client?.id,
                                 c.id,
                                 'MIRAGE',
                                  `Bonjour ${client?.nom || ''},\n\nLe mirage de votre lot de ${c.nombreOeufs} œufs a été effectué.\n\n📅 Date de dépôt : ${c.dateReception ? format(parseISO(c.dateReception), 'dd/MM/yyyy') : '-'}\n🔍 *RÉSULTATS DU MIRAGE* :\n- Œufs clairs : ${c.oeufsClairs || 0}\n- Œufs pourris : ${c.oeufsPourris || 0}\n✅ *Œufs viables en incubation : ${c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0)}*\n📈 Taux de fécondité : ${((c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0)) / c.nombreOeufs * 100).toFixed(1)}%\n\nL'incubation se poursuit. Nous vous tiendrons informé(e) pour la date d'éclosion.\n\n_Merci de votre confiance !_ \n*L'équipe Ivoire Couvée d'Or.*`,
                                 client?.telephone,
                               )}
                               title="WhatsApp: Bilan Mirage"
                               className="p-2 bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 transition-colors"
                             >
                               <MessageCircle size={18} />
                             </button>
                           )}
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
                                 'ECLOSION',
                                  `Bonjour ${client?.nom || ''},\n\nL'incubation de votre lot de ${c.typeOeuf}s est terminée !\n\n📅 Date de dépôt : ${c.dateReception ? format(parseISO(c.dateReception), 'dd/MM/yyyy') : '-'}\n🥚 Œufs mis en machine : ${c.nombreOeufs}\n🔍 *BILAN DE L'ÉCLOSION* :\n🐥 Poussins éclos : *${c.poussinsNes || 0}*\n⚠️ Pertes (morts en coque/non éclos) : ${(c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0)) - (c.poussinsNes || 0)}\n🏆 Taux de réussite : ${((c.poussinsNes || 0) / (c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0)) * 100).toFixed(1)}%\n\nVous pouvez dès à présent passer retirer vos poussins. \n\n_Merci de votre confiance !_ \n*L'équipe Ivoire Couvée d'Or.*`,
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

        {viewingClient && (
          <ClientFinanceCardModal 
            client={viewingClient} 
            isOpen={!!viewingClient} 
            onClose={() => setViewingClient(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default Couvaisons;
