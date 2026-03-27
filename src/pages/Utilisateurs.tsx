import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, CheckCircle, XCircle, Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import type { Role, PermissionKey } from '../types';
import { hasPermission, PERMISSION_CATALOG, defaultPermissionsForRole } from '../lib/permissions';

export const Utilisateurs = () => {
  const { users, usersLoading, usersError, addUser, updateUser, deleteUser, currentUser } = useAuth();


  const [showModal, setShowModal] = useState(false);
  const [nom, setNom] = useState('');
  const [username, setUsername] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Technicien');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [permUserId, setPermUserId] = useState<string | null>(null);
  const [permDraft, setPermDraft] = useState<PermissionKey[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  const permUser = useMemo(() => users.find((u) => u.id === permUserId), [users, permUserId]);
  const permLocked = Boolean(permUser && (permUser.role === 'Admin' || permUser.isProjectAdmin));

  useEffect(() => {
    if (!permUser) return;
    setPermDraft(permUser.permissions ?? defaultPermissionsForRole(permUser.role));
  }, [permUserId, permUser]);

  if (!currentUser || !hasPermission(currentUser, 'administration')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await addUser({ nom, username, telephone, passwordHash: password, role, actif: true });
      setShowModal(false);
      setNom('');
      setUsername('');
      setTelephone('');
      setPassword('');
      setRole('Technicien');
    } catch (err) {
      setSubmitError((err as Error).message || 'Erreur lors de la création du compte.');
    }
  };

  const toggleStatut = async (id: string, actif: boolean) => {
    await updateUser(id, { actif: !actif });
  };

  const setRoleAuto = async (id: string, r: Role) => {
    await updateUser(id, { role: r });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-xl border-2 border-brand-orange/40 bg-gradient-to-r from-amber-50 to-orange-50/80 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">Module Administration</p>
            <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2 mt-1">
              <Shield size={28} className="text-brand-orange" />
              Comptes &amp; rôles
            </h1>
            <p className="text-sm text-brand-gray mt-1 max-w-2xl">
              Créez des comptes, choisissez un <strong>rôle</strong>, puis ouvrez <strong>« Permissions »</strong> pour cocher les écrans
              autorisés (stocké sur le serveur). Les comptes <strong>Admin</strong> ou admin projet ont tout l&apos;accès.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={usersLoading}
            className="shrink-0 bg-brand-dark text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus size={18} /> Nouveau compte
          </button>
        </div>
      </div>

      {usersError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold">Liste utilisateurs : mode hors ligne ou erreur API</p>
            <p className="mt-1 font-mono text-xs">{usersError}</p>
            <p className="mt-2 text-xs">
              Vérifiez <code className="bg-white/80 px-1 rounded">VITE_INSFORGE_OSS_HOST</code> sur Vercel et le déploiement des fonctions
              InsForge (<code className="bg-white/80 px-1 rounded">users_list</code>).
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-brand-lightgray p-4 text-sm text-brand-gray">
        <p className="font-semibold text-brand-dark mb-2">Rôles — accès aux menus</p>
        <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
          <li><strong>Administrateur</strong> : tout (dashboard, finances, factures, historique, ce module).</li>
          <li><strong>Technicien</strong> : couvaisons, clients, machines, analyses.</li>
          <li><strong>Réception/Caisse</strong> : dashboard, couvaisons, clients, factures.</li>
        </ul>
      </div>

      {/* Matrice simple des permissions (lecture seule) */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm min-w-[520px]">
          <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
            <tr>
              <th className="px-4 py-3">Fonction</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm">Admin</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm">Tech</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm">Récept</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm font-bold text-brand-orange">Finan</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm font-bold text-brand-orange">Compt</th>
              <th className="px-1 py-1 text-center text-[10px] md:text-sm font-bold text-brand-orange">Logist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-lightgray">
            <tr><td className="px-4 py-2">Tableau de bord</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">—</td></tr>
            <tr><td className="px-4 py-2">Couvaisons / Clients</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">✓</td></tr>
            <tr><td className="px-4 py-2">Machines / Expertise</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">✓</td></tr>
            <tr><td className="px-4 py-2">Finances / Historique</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">—</td></tr>
            <tr><td className="px-4 py-2">Factures</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">—</td></tr>
            <tr className="bg-orange-50/50 font-medium"><td className="px-4 py-2">Administration</td><td className="text-center">✓</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">—</td></tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden relative min-h-[200px]">
        {usersLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
            <Loader2 className="animate-spin text-brand-orange mb-2" size={32} />
            <p className="text-sm text-brand-muted">Chargement des comptes…</p>
          </div>
        )}
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
             <tr>
               <th className="px-6 py-4">Nom de la personne</th>
               <th className="px-6 py-4">Identifiant Secret</th>
                <th className="px-6 py-4">Téléphone</th>
               <th className="px-6 py-4">Profil (Rôle)</th>
               <th className="px-6 py-4 text-center">Accès Actif</th>
               <th className="px-6 py-4 text-center">Permissions</th>
               <th className="px-6 py-4 text-center">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-brand-lightgray">
             {!usersLoading && users.length === 0 && !usersError && (
               <tr>
                 <td colSpan={7} className="px-6 py-12 text-center text-brand-muted">
                   Aucun utilisateur. Cliquez sur « Nouveau compte » pour créer le premier accès.
                 </td>
               </tr>
             )}
             {users.map(u => (
               <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                 <td className="px-6 py-4 font-semibold text-brand-dark">{u.nom}</td>
                 <td className="px-6 py-4 font-mono text-gray-500">{u.username}</td>
                 <td className="px-6 py-4 text-gray-500">{u.telephone || '-'}</td>
                 <td className="px-6 py-4">
                    <select 
                       value={u.role} 
                       onChange={e => setRoleAuto(u.id, e.target.value as Role)} 
                       disabled={currentUser.id === u.id} // Éviter de s'auto-rétrograder
                       className={`px-2 py-1 rounded-md text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                        <option value="Admin">Administrateur</option>
                        <option value="Technicien">Technicien</option>
                        <option value="Réception/Caisse">Réception/Caisse</option>
                        <option value="Finance">Finance</option>
                        <option value="Comptable">Comptable</option>
                        <option value="Logistique">Logistique</option>
                        <option value="Mixte">Mixte (Profil Personnalisé)</option>
                     </select>
                  </td>

                 <td className="px-6 py-4 text-center">
                    {u.actif ? 
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold"><CheckCircle size={14}/> Oui</span> : 
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold"><XCircle size={14}/> Bloqué</span>
                    }
                 </td>
                 <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => setPermUserId(u.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                    >
                      <ListChecks size={14} /> Cocher les accès
                    </button>
                 </td>
                 <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-2">
                        <button 
                           onClick={() => toggleStatut(u.id, u.actif)} 
                           disabled={currentUser.id === u.id}
                           className={`px-3 py-1 rounded text-xs font-semibold ${u.actif ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors disabled:opacity-30`}
                           title={u.actif ? 'Bloquer l\'accès' : 'Débloquer l\'accès'}
                        >
                           {u.actif ? 'Bloquer' : 'Débloquer'}
                        </button>
                        <button 
                           onClick={async () => {
                              if (window.confirm(`Confirmez-vous la suppression DEFINITIVE du compte de ${u.nom} ?`)) {
                                 await deleteUser(u.id);
                              }
                           }}
                           disabled={currentUser.id === u.id}
                           className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                           title="Supprimer définitivement"
                        >
                           Supprimer
                        </button>
                     </div>
                  </td>

               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {permUserId && permUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg border border-brand-lightgray w-full max-w-md max-h-[90vh] overflow-y-auto p-6 my-8">
            <h2 className="text-lg font-bold text-brand-dark mb-1">Permissions — {permUser.nom}</h2>
            <p className="text-xs text-brand-muted mb-4">
              Cochez les écrans accessibles pour ce compte. L&apos;utilisateur doit se reconnecter si besoin.
            </p>
            {permLocked ? (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-sm text-purple-900">
                Ce compte est <strong>administrateur</strong> (rôle Admin ou admin InsForge) : accès complet à
                l&apos;application. Les cases ne sont pas modifiables ici.
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {PERMISSION_CATALOG.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      checked={permDraft.includes(p.id)}
                      onChange={() => {
                        setPermDraft((prev) =>
                          prev.includes(p.id) ? prev.filter((k) => k !== p.id) : [...prev, p.id],
                        );
                      }}
                    />
                    <span className="text-sm text-brand-dark">{p.label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPermUserId(null)}
                className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 text-sm"
              >
                Fermer
              </button>
              {!permLocked && (
                <button
                  type="button"
                  disabled={permSaving}
                  onClick={async () => {
                    if (permDraft.length === 0) {
                      alert('Cochez au moins une permission.');
                      return;
                    }
                    setPermSaving(true);
                    try {
                      await updateUser(permUser.id, { permissions: permDraft });
                      setPermUserId(null);
                    } catch (e) {
                      alert((e as Error).message || 'Erreur enregistrement');
                    } finally {
                      setPermSaving(false);
                    }
                  }}
                  className="px-4 py-2 bg-brand-orange text-white rounded-md font-semibold text-sm hover:bg-brand-hover disabled:opacity-50"
                >
                  {permSaving ? 'Enregistrement…' : 'Enregistrer les permissions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray w-full max-w-sm">
             <h2 className="text-xl font-bold text-brand-dark mb-4">Ajouter un Membre</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
               {submitError && (
                 <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{submitError}</div>
               )}
               <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Nom Complet</label>
                  <input required type="text" value={nom} onChange={e => setNom(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Identifiant de session</label>
                  <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Mot de passe temporaire</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
               </div>
              <div>
                 <label className="block text-sm font-semibold text-brand-dark mb-1">Téléphone de connexion</label>
                 <input type="text" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+225..." className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
              </div>
               <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Privilège initial</label>
                  <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                      <option value="Technicien">Technicien (Production)</option>
                      <option value="Réception/Caisse">Réception/Caisse (Saisie clients)</option>
                      <option value="Finance">Finance (Indicateurs & Trésorerie)</option>
                      <option value="Comptable">Comptable (Analyses & Factures)</option>
                      <option value="Logistique">Logistique (Machines & Stocks)</option>
                      <option value="Mixte">Mixte (Profil à permissions manuelles)</option>
                      <option value="Admin">Administrateur (Pleins pouvoirs)</option>
                  </select>
               </div>
               <div className="flex justify-end space-x-3 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50">Annuler</button>
                 <button type="submit" className="px-4 py-2 bg-brand-orange text-white rounded-md font-bold hover:bg-brand-hover">Accréditer</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};
export default Utilisateurs;
