import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) => {
  const { currentUser } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/85 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-orange md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-brand-dark sm:text-xl">
            Gestion de couvoir
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">Pilotage des lots, machines et finances</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-orange"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <div className="flex cursor-default items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 py-1 pl-1 pr-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-hover text-white shadow-sm">
            <User size={18} strokeWidth={2.2} />
          </div>
          <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-brand-dark md:block">
            {currentUser?.nom || 'Compte'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
