import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Egg,
  DollarSign,
  FileText,
  Server,
  Shield,
  LogOut,
  BrainCircuit,
  Key,
  X,
  History,
  Database,
  Landmark,
  Wallet,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppProvider';
import { hasPermission } from '../../lib/permissions';
import type { PermissionKey } from '../../types';

const Sidebar = () => {
  const { currentUser, logout, updateUser } = useAuth();
  const { addLog } = useAppContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setAlertMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 4) {
      setAlertMsg('Le mot de passe doit faire au moins 4 caractères.');
      return;
    }
    if (currentUser) {
      await updateUser(currentUser.id, { passwordHash: newPassword });
      addLog('MODIFICATION', 'Sécurité', `Mot de passe modifié par ${currentUser.nom}.`);
      setAlertMsg('');
      setIsProfileOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Votre mot de passe a été mis à jour avec succès.');
    }
  };

  const navItems: {
    name: string;
    path: string;
    icon: ReactNode;
    permission: PermissionKey;
  }[] = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} />, permission: 'dashboard' },
    { name: 'Couvaisons', path: '/couvaisons', icon: <Egg size={20} />, permission: 'couvaisons' },
    { name: 'Clients & Historique', path: '/clients', icon: <Database size={20} />, permission: 'clients' },
    { name: 'Parc Machines', path: '/machines', icon: <Server size={20} />, permission: 'machines' },
    { name: 'Expertise & Conseils', path: '/analyses', icon: <BrainCircuit size={20} />, permission: 'analyses' },
    { name: 'Finances', path: '/finances', icon: <DollarSign size={20} />, permission: 'finances' },
    { name: 'Trésorerie', path: '/tresorerie', icon: <Landmark size={20} />, permission: 'finances' },
    { name: 'Dépenses', path: '/depenses', icon: <Wallet size={20} />, permission: 'finances' },
    { name: 'Bulletin de salaire', path: '/bulletin-salaire', icon: <ScrollText size={20} />, permission: 'finances' },
    { name: 'Factures', path: '/factures', icon: <FileText size={20} />, permission: 'factures' },
    { name: 'Historique', path: '/historique', icon: <History size={20} />, permission: 'historique' },
    { name: 'Administration', path: '/utilisateurs', icon: <Shield size={20} />, permission: 'administration' },
  ];

  const visibleNav = navItems.filter((item) => hasPermission(currentUser, item.permission));

  return (
    <aside className="z-20 hidden h-screen min-h-0 w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-brand-dark via-brand-dark-mid to-brand-dark text-white shadow-xl md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-brand-orange/30">
          <img
            src={logoUrl}
            alt="Logo Ivoire Couvée d’Or"
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-display truncate text-base font-bold uppercase tracking-wide text-white">
            Ivoire Couvée
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-brand-orange/90">d&apos;Or</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {visibleNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-orange/20 text-brand-orange shadow-inner ring-1 ring-brand-orange/35'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="shrink-0 opacity-90">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-black/25 to-transparent p-3 backdrop-blur-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-inner ring-1 ring-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-hover text-sm font-bold uppercase text-white shadow-md ring-2 ring-white/10">
              {currentUser?.nom.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-white">{currentUser?.nom}</p>
              <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {currentUser?.role}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-black/25 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-brand-orange"
                title="Modifier le mot de passe"
                aria-label="Modifier le mot de passe"
              >
                <Key size={17} strokeWidth={2} />
              </button>
              <span className="h-5 w-px shrink-0 bg-white/15" aria-hidden />
              <button
                type="button"
                onClick={logout}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-200"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-brand-dark">
                <Key size={18} className="text-brand-orange" /> Mon profil
              </h3>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4 p-6">
              {alertMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {alertMsg}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">
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
