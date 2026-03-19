import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) => {
  const { currentUser } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-brand-lightgray flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
      <div className="flex items-center">
        <button onClick={onOpenMobileMenu} className="md:hidden mr-4 text-brand-gray hover:text-brand-orange">
          <Menu size={24} />
        </button>
        <h2 className="text-base sm:text-xl font-semibold text-brand-dark">
          Gestion de Couvoir
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-brand-muted hover:text-brand-orange transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        <div className="flex items-center space-x-2 cursor-pointer hover:bg-brand-lightgray p-1 rounded-md transition-colors">
          <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange">
            <User size={18} />
          </div>
          <span className="text-sm font-medium text-brand-dark hidden md:block">{currentUser?.nom || 'Compte'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
