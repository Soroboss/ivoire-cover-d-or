import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import type { Role } from '../types';

export const Utilisateurs = () => {
  const { users, addUser, updateUser, currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [nom, setNom] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Technicien');

  if (currentUser?.role !== 'Admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addUser({ nom, username, passwordHash: password, role, actif: true });
    setShowModal(false);
    setNom(''); setUsername(''); setPassword(''); setRole('Technicien');
  };

  const toggleStatut = async (id: string, actif: boolean) => {
    await updateUser(id, { actif: !actif });
  };

  const setRoleAuto = async (id: string, r: Role) => {
    await updateUser(id, { role: r });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
             <Shield size={24} className="text-brand-orange" />
             Accès et Sécurité
           </h1>
           <p className="text-sm text-brand-muted mt-1">Gérez les membres de l'équipe et leurs permissions.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-dark text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <UserPlus size={18} /> Nouveau Compte
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-brand-gray font-semibold border-b border-brand-lightgray">
             <tr>
               <th className="px-6 py-4">Nom de la personne</th>
               <th className="px-6 py-4">Identifiant Secret</th>
               <th className="px-6 py-4">Profil (Rôle)</th>
               <th className="px-6 py-4 text-center">Accès Actif</th>
               <th className="px-6 py-4 text-center">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-brand-lightgray">
             {users.map(u => (
               <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                 <td className="px-6 py-4 font-semibold text-brand-dark">{u.nom}</td>
                 <td className="px-6 py-4 font-mono text-gray-500">{u.username}</td>
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
                       onClick={() => toggleStatut(u.id, u.actif)} 
                       disabled={currentUser.id === u.id}
                       className={`px-3 py-1 rounded text-xs font-semibold ${u.actif ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors disabled:opacity-30`}
                    >
                       {u.actif ? 'Bloquer' : 'Débloquer'}
                    </button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray w-full max-w-sm">
             <h2 className="text-xl font-bold text-brand-dark mb-4">Ajouter un Membre</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Privilège initial</label>
                  <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                     <option value="Technicien">Technicien (Production)</option>
                     <option value="Réception/Caisse">Réception/Caisse (Saisie clients)</option>
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
