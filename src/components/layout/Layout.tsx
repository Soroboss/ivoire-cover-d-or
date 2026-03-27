import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';
import { LayoutDashboard, Egg, DollarSign, FileText, Server, Shield, BrainCircuit, History, X, Database, Landmark, Wallet, ScrollText, ChevronRight, Home } from 'lucide-react';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';
  const showHomeLink = currentUser && hasPermission(currentUser, 'dashboard') && !isDashboard;


  const navItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Couvaisons', path: '/couvaisons', icon: <Egg size={18} />, roles: ['Admin', 'Technicien', 'Réception/Caisse'] },
    { name: 'Clients & Historique', path: '/clients', icon: <Database size={18} />, roles: ['Admin', 'Technicien', 'Réception/Caisse'] },
    { name: 'Parc Machines', path: '/machines', icon: <Server size={18} />, roles: ['Admin', 'Technicien'] },
    { name: 'Expertise & Conseils', path: '/analyses', icon: <BrainCircuit size={18} />, roles: ['Admin', 'Technicien'] },
    { name: 'Finances', path: '/finances', icon: <DollarSign size={18} />, roles: ['Admin'] },
    { name: 'Trésorerie', path: '/tresorerie', icon: <Landmark size={18} />, roles: ['Admin'] },
    { name: 'Dépenses', path: '/depenses', icon: <Wallet size={18} />, roles: ['Admin'] },
    { name: 'Bulletin de salaire', path: '/bulletin-salaire', icon: <ScrollText size={18} />, roles: ['Admin'] },
    { name: 'Factures', path: '/factures', icon: <FileText size={18} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Historique', path: '/historique', icon: <History size={18} />, roles: ['Admin'] },
    { name: 'Équipe & Accès', path: '/utilisateurs', icon: <Shield size={18} />, roles: ['Admin'] },
  ];
  const visibleNav = navItems.filter(item => item.roles.includes(currentUser?.role || 'Admin'));

  return (
    <div className="flex h-screen overflow-hidden bg-mesh-app">
      <Sidebar />
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[min(20rem,92vw)] border-r border-white/10 bg-gradient-to-b from-brand-dark to-brand-dark-mid p-4 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-brand-orange">Menu</h3>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-orange/20 text-brand-orange ring-1 ring-brand-orange/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="w-full flex-grow p-3 sm:p-5 md:p-8">
          <div className="mx-auto max-w-[1600px]">
            {showHomeLink && (
              <nav className="flex items-center gap-2 text-xs font-semibold text-brand-muted mb-4 bg-white/40 backdrop-blur-sm border border-black/5 w-fit px-3 py-1.5 rounded-full shadow-sm animate-in slide-in-from-left duration-500">
                <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
                  <Home size={14} />
                  <span>Tableau de Bord</span>
                </Link>
                <ChevronRight size={12} className="opacity-40" />
                <span className="text-brand-dark opacity-80 capitalize">
                  {location.pathname.startsWith('/') ? location.pathname.substring(1).replace(/-/g, ' ') : location.pathname}
                </span>
              </nav>
            )}
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;
