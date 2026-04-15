import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { Search, ChevronLeft, User, Calendar, Eye, Egg, RefreshCw, Loader2 } from 'lucide-react';
import type { StatutCouvaison } from '../types';
import { ClientStatsSummary } from '../components/finances/ClientStatsSummary';
import { formatEmplacementsLigne } from '../lib/casierLabels';
import { ClientEditModal } from '../components/clients/ClientEditModal';
import { callBackendFunction } from '../lib/insforgeApi';

type FilterState = StatutCouvaison | 'Tous';

const ClientsDB = () => {
  const { clients, couvaisons, clientMessages, machines } = useAppContext();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterState>('Tous');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';

  const handleMigrateIds = async () => {
    if (!window.confirm("Voulez-vous renommer tous les IDs clients au format #ICOxxx ?")) return;
    setIsMigrating(true);
    try {
      const res = await callBackendFunction<{ success: boolean, migrated: number }>('clients_migrate_ids', {});
      if (res.success) {
        alert(`${res.migrated} clients mis à jour avec succès.`);
        window.location.reload();
      }
    } catch (err) {
      alert("Erreur lors de la migration: " + (err as Error).message);
    } finally {
      setIsMigrating(false);
    }
  };

  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return clients
      .filter(c => {
        if (!term) return true;
        return c.nom.toLowerCase().includes(term) || c.telephone.includes(term);
      })
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [clients, searchTerm]);

  const clientCouvaisons = useMemo(() => {
    if (!selectedClientId) return [];
    return couvaisons
      .filter(c => c.clientId === selectedClientId)
      .filter(c => (statusFilter === 'Tous' ? true : c.statut === statusFilter))
      .sort((a, b) => new Date(a.dateReception).getTime() - new Date(b.dateReception).getTime());
  }, [couvaisons, selectedClientId, statusFilter]);

  const clientMessageHistory = useMemo(() => {
    if (!selectedClientId) return [];
    return clientMessages
      .filter(m => m.clientId === selectedClientId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, 8);
  }, [clientMessages, selectedClientId]);

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalEggs = couvaisons.reduce((sum, c) => sum + (c.nombreOeufs || 0), 0);
    
    // Calcul des œufs fécondés (on prend les œufs restants après mirage pour les lots où le mirage a été fait)
    const fertileEggs = couvaisons.reduce((sum, c) => {
      if (c.oeufsClairs != null || c.oeufsPourris != null) {
        return sum + (c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0));
      }
      return sum;
    }, 0);

    // Calcul du meilleur client (celui avec le plus grand volume total d'œufs)
    const clientVolumes = couvaisons.reduce((acc, c) => {
      acc[c.clientId] = (acc[c.clientId] || 0) + c.nombreOeufs;
      return acc;
    }, {} as Record<string, number>);

    let bestClientName = "—";
    let maxVol = 0;
    Object.entries(clientVolumes).forEach(([id, vol]) => {
      if (vol > maxVol) {
        maxVol = vol;
        const cl = clients.find(c => c.id === id);
        if (cl) bestClientName = cl.nom;
      }
    });

    return { totalClients, totalEggs, fertileEggs, bestClientName, maxVol };
  }, [clients, couvaisons]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-brand-orange/[0.04] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-hover text-white shadow-lg">
              <User size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange/80">CRM & Database</p>
              <h1 className="font-display text-2xl font-black tracking-tight text-brand-dark sm:text-3xl">
                Base de données Clients
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Gérez vos partenaires et suivez l&apos;historique de leurs prestations en un clin d&apos;œil.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleMigrateIds}
              disabled={isMigrating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              {isMigrating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Migration IDs (#ICO)
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-50 transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">Total Partenaires</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalClients}</span>
                <span className="text-xs font-bold text-blue-600/70">ACTIFS</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-50 transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Œufs Traités</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalEggs.toLocaleString()}</span>
                <span className="text-xs font-bold text-amber-600/70">UNITÉS</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-50 transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Fécondité Globale</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.fertileEggs.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-600/70">VIABLES</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-50 transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-widest text-purple-500">Meilleur Client</p>
              <div className="mt-1 flex flex-col">
                <span className="truncate text-xl font-black text-slate-900">{stats.bestClientName}</span>
                <span className="text-[10px] font-bold text-purple-600/70 uppercase">{stats.maxVol.toLocaleString()} œufs au total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liste clients */}
        <div className={selectedClientId ? 'hidden md:block md:col-span-1' : 'block md:block md:col-span-1'}>
          <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-2">Rechercher un client</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-brand-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom ou téléphone"
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-orange outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User size={18} className="text-brand-orange" />
              <p className="text-sm text-brand-muted">
                {filteredClients.length} client(s)
              </p>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="text-center py-10 text-brand-muted text-sm">
                  Aucun client trouvé.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedClientId === c.id
                          ? 'bg-brand-orange/10 border-brand-orange text-brand-dark'
                          : 'bg-white border-brand-lightgray hover:bg-brand-lightgray/30'
                      }`}
                    >
                      <div className="font-semibold text-brand-dark">{c.nom}</div>
                      <div className="text-xs text-brand-muted truncate">{c.telephone}</div>
                      <div className="text-xs text-brand-muted mt-1">
                        {couvaisons.filter(x => x.clientId === c.id).length} lot(s)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails client */}
        <div className={selectedClientId ? 'block md:block md:col-span-2' : 'hidden md:block md:col-span-2'}>
          <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-brand-dark">
                  {selectedClient ? selectedClient.nom : '—'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-brand-muted">{selectedClient?.telephone || ''}</p>
                  {selectedClient && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-[10px] font-bold text-brand-orange hover:underline px-1 py-0.5"
                      >
                        (Modifier)
                      </button>
                      <ClientEditModal 
                        client={selectedClient}
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                      />
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="md:hidden px-3 py-2 rounded-md border border-gray-300 text-brand-dark hover:bg-gray-50"
                onClick={() => setSelectedClientId(null)}
              >
                <span className="inline-flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Retour
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-muted">Filtre statut</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FilterState)}
                  className="text-sm rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-brand-orange outline-none bg-white"
                >
                  <option value="Tous">Tous</option>
                  <option value="En attente">En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>

              <div className="text-sm text-brand-muted">
                {clientCouvaisons.length} opération(s)
              </div>
            </div>

            {selectedClientId && (
               <div className="mb-4">
                  <ClientStatsSummary clientId={selectedClientId} />
               </div>
            )}

            {!selectedClient ? (
              <div className="text-center py-12 text-brand-muted text-sm">
                Choisissez un client dans la liste.
              </div>
            ) : clientCouvaisons.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-sm">
                Aucune couvaison pour ce client (avec ce filtre).
              </div>
            ) : (
              <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
                    <tr>
                      <th className="px-4 py-3">Date réception</th>
                      <th className="px-4 py-3">Détails lot</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Dates clés</th>
                      <th className="px-4 py-3 min-w-[200px]">Machine & Tiroirs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-lightgray">
                    {clientCouvaisons.map((c) => {
                       const mirageFait = c.oeufsClairs != null || c.oeufsPourris != null;
                       const avantMirage = formatEmplacementsLigne(
                         mirageFait ? c.emplacementsAvantMirage ?? c.emplacements : c.emplacements,
                         machines
                       );
                       const apresMirage = formatEmplacementsLigne(
                         mirageFait ? c.emplacementsApresMirage ?? c.emplacements : undefined,
                         machines
                       );
                       
                       return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-brand-muted">
                          {c.dateReception ? format(parseISO(c.dateReception), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-brand-dark">{c.nombreOeufs} {c.typeOeuf}s</div>
                          <div className="text-xs text-brand-muted">{c.prixUnitaire} FCFA/u</div>
                          
                          {mirageFait && (
                            <div className="mt-2 p-1 bg-blue-50 border border-blue-100 rounded text-[10px] leading-tight text-blue-800">
                               <span className="font-bold">Viables:</span> {(c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0))} 
                            </div>
                          )}
                          {c.dateEclosionDemarrage && (
                            <div className="mt-1 p-1 bg-green-50 border border-green-100 rounded text-[10px] leading-tight text-green-800">
                               <div>Éclos: <span className="font-bold">{c.poussinsNes || 0}</span> | Morts: {c.mortsEnCoque || 0}</div>
                               <div className="mt-1 pt-1 border-t border-green-200">
                                 Reste: <span className="font-bold text-green-600">{(c.nombreOeufs - (c.oeufsClairs || 0) - (c.oeufsPourris || 0) - (c.poussinsNes || 0) - (c.mortsEnCoque || 0))}</span>
                               </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
                              c.statut === 'En cours'
                                ? 'bg-amber-100 text-amber-800'
                                : c.statut === 'Terminé'
                                  ? 'bg-green-100 text-green-800'
                                  : c.statut === 'Annulé'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {c.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] text-brand-muted space-y-1.5">
                            <div className="flex items-center gap-1"><Calendar size={10}/> Machine: <span className="text-brand-dark font-medium">{c.dateMiseEnMachine ? format(parseISO(c.dateMiseEnMachine), 'dd/MM/yyyy') : '-'}</span></div>
                            <div className="flex items-center gap-1"><Eye size={10}/> Mirage: {c.dateMiragePrevue ? format(parseISO(c.dateMiragePrevue), 'dd/MM/yyyy') : '-'}</div>
                            <div className="flex items-center gap-1"><Egg size={10}/> Éclosion: {c.dateEclosionPrevue ? format(parseISO(c.dateEclosionPrevue), 'dd/MM/yyyy') : '-'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] leading-tight text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 whitespace-normal">
                             {mirageFait ? (
                               <div className="space-y-1">
                                 <p><span className="font-semibold text-brand-dark">Avant:</span> {avantMirage || '-'}</p>
                                 <p><span className="font-semibold text-brand-dark">Après:</span> {apresMirage || '-'}</p>
                               </div>
                             ) : c.emplacements && c.emplacements.length > 0 ? (
                               <p><span className="font-semibold text-brand-dark">Tiroirs:</span> {avantMirage}</p>
                             ) : (
                               <p className="italic text-slate-400">Non placé</p>
                             )}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <h3 className="text-sm font-semibold text-brand-dark mb-2">Historique messages client</h3>
                {clientMessageHistory.length === 0 ? (
                  <p className="text-xs text-brand-muted">Aucun message enregistré.</p>
                ) : (
                  <div className="space-y-2">
                    {clientMessageHistory.map((m) => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-md p-2">
                        <div className="flex items-center justify-between text-xs text-brand-muted">
                          <span>{m.canal} - {m.template || 'manuel'}</span>
                          <span>{format(parseISO(m.sentAt), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        <p className="text-xs text-brand-dark mt-1 line-clamp-2">{m.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsDB;

