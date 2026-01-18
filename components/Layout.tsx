import React from 'react';
import { Users, WalletCards, ArrowDownLeft, LogOut, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  
  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => onTabChange(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={`${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
        
        {/* Header / Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">S</span>
            </div>
            <h1 className="font-bold text-lg tracking-wide">StudentPay</h1>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider pl-10">Admin Panel</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase px-4 mb-2 mt-2">Gestion</div>
          
          <NavItem id="users" label="Utilisateurs" icon={Users} />
          <NavItem id="wallets" label="Portefeuilles" icon={WalletCards} />
          
          <div className="text-xs font-bold text-slate-500 uppercase px-4 mb-2 mt-6">Opérations</div>
          
          <NavItem id="deposit" label="Recevoir un Dépôt" icon={ArrowDownLeft} />
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-screen">
        {/* Mobile Header (optional, mainly for small screens if we added responsive logic later) */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between">
           <h2 className="text-xl font-bold text-gray-800 capitalize">
             {activeTab === 'deposit' ? 'Dépôt d\'espèces' : activeTab === 'wallets' ? 'Gestion des Portefeuilles' : 'Gestion des Utilisateurs'}
           </h2>
           <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Admin connecté</span>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                AD
              </div>
           </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
             {children}
          </div>
        </div>
      </main>

    </div>
  );
};

export default Layout;