import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Egg, DollarSign, FileText, Server, Shield, BrainCircuit, History, X, Database } from 'lucide-react';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const navItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Couvaisons', path: '/couvaisons', icon: <Egg size={18} />, roles: ['Admin', 'Technicien', 'Réception/Caisse'] },
    { name: 'Clients & Historique', path: '/clients', icon: <Database size={18} />, roles: ['Admin', 'Technicien', 'Réception/Caisse'] },
    { name: 'Parc Machines', path: '/machines', icon: <Server size={18} />, roles: ['Admin', 'Technicien'] },
    { name: 'Expertise & Conseils', path: '/analyses', icon: <BrainCircuit size={18} />, roles: ['Admin', 'Technicien'] },
    { name: 'Finances', path: '/finances', icon: <DollarSign size={18} />, roles: ['Admin'] },
    { name: 'Factures', path: '/factures', icon: <FileText size={18} />, roles: ['Admin', 'Réception/Caisse'] },
    { name: 'Historique', path: '/historique', icon: <History size={18} />, roles: ['Admin'] },
    { name: 'Équipe & Accès', path: '/utilisateurs', icon: <Shield size={18} />, roles: ['Admin'] },
  ];
  const visibleNav = navItems.filter(item => item.roles.includes(currentUser?.role || 'Admin'));

  return (
    <div className="flex h-screen bg-brand-lightgray overflow-hidden">
      <Sidebar />
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-brand-dark text-white shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-brand-orange">Navigation</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded hover:bg-brand-gray/50">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-2">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isActive ? 'bg-brand-gray text-brand-orange' : 'text-brand-muted hover:bg-brand-gray/50 hover:text-white'
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
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="w-full flex-grow p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
