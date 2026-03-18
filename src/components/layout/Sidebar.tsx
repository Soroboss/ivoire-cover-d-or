import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Egg, DollarSign, FileText, Server, Shield, LogOut, BrainCircuit, Key, X, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { currentUser, logout, updateUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword !== confirmPassword) {
      setAlertMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if(newPassword.length < 4) {
      setAlertMsg("Le mot de passe doit faire au moins 4 caractères.");
      return;
    }
    if(currentUser) {
      updateUser(currentUser.id, { passwordHash: newPassword });
      setAlertMsg('');
      setIsProfileOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      alert("Votre mot de passe a été mis à jour avec succès.");
    }
  };
  
  const navItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Couvaisons', path: '/couvaisons', icon: <Egg size={20} />, roles: ['Admin', 'Technicien', 'Réception/Caisse'] },
    { name: 'Parc Machines', path: '/machines', icon: <Server size={20} />, roles: ['Admin', 'Technicien'] },
    { name: 'Expertise & Conseils', path: '/analyses', icon: <BrainCircuit size={20} />, roles: ['Admin', 'Technicien'] },
    { name: 'Finances', path: '/finances', icon: <DollarSign size={20} />, roles: ['Admin'] },
    { name: 'Factures', path: '/factures', icon: <FileText size={20} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Historique', path: '/historique', icon: <History size={20} />, roles: ['Admin'] },
    { name: 'Équipe & Accès', path: '/utilisateurs', icon: <Shield size={20} />, roles: ['Admin'] },
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(currentUser?.role || 'Admin'));

  return (
    <aside className="w-64 bg-brand-dark text-white flex flex-col h-full hidden md:flex shadow-xl z-20">
      <div className="h-16 flex items-center justify-center border-b border-brand-gray/30">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="Logo Ivoire Couvée d’Or"
            className="h-9 w-9 rounded-full bg-white/90 object-cover shadow-sm"
            loading="eager"
            decoding="async"
          />
          <h1 className="text-xl font-bold text-brand-orange uppercase tracking-wider leading-none">
            Ivoire Couvée
          </h1>
        </div>
      </div>
      <nav className="flex-1 py-6 space-y-2">
        {visibleNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-gray text-brand-orange border-r-4 border-brand-orange shadow-inner'
                  : 'text-brand-muted hover:bg-brand-gray/50 hover:text-white'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 w-full p-4 border-t border-brand-lightgray bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold uppercase">
              {currentUser?.nom.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-brand-dark truncate max-w-[120px]">{currentUser?.nom}</p>
              <p className="text-xs text-brand-muted">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={() => setIsProfileOpen(true)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-colors" title="Modifier mon mot de passe">
            <Key size={18} />
          </button>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>

      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-brand-dark flex items-center gap-2"><Key size={18} className="text-brand-orange"/> Mon Profil</h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {alertMsg && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md">{alertMsg}</div>}
              <div>
                 <label className="block text-sm font-semibold text-brand-dark mb-1">Nouveau mot de passe</label>
                 <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-brand-dark mb-1">Confirmer mot de passe</label>
                 <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
              </div>
              <button type="submit" className="w-full py-2 bg-brand-orange text-white rounded-md font-bold hover:bg-brand-hover transition-colors shadow-sm">
                 Mettre à jour
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
