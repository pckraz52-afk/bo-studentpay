import React, { useState } from 'react';
import {
  Users,
  WalletCards,
  ArrowDownLeft,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  QrCode,
  ListOrdered,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  users: 'Gestion des utilisateurs',
  wallets: 'Gestion des portefeuilles',
  deposit: 'Dépôts',
  'deposit-list': 'Dépôts',
  dashboards: 'Dashboards',
  'dashboard-evolution-depot': 'Dépôts',
  'dashboard-recettes': 'Recettes',
  'dashboard-evolution-users': 'Utilisateurs',
  'recettes-cantine': 'Recettes',
  'generate-qr': 'QR code',
};

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {

  const dashboardSubIds = ['dashboard-evolution-depot', 'dashboard-recettes', 'recettes-cantine', 'dashboard-evolution-users'];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gestion: true,
    operations: true,
    dashboards: true,
    utilitaires: true,
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const NavItem = ({
    id,
    label,
    icon: Icon,
    indent = false,
  }: {
    id: string;
    label: string;
    icon?: any;
    indent?: boolean;
  }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group
          ${indent ? 'px-3 py-2' : 'px-3 py-2.5'}
          ${isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
      >
        {Icon && (
          <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors
            ${isActive ? 'bg-indigo-500/50 text-white' : 'text-slate-500 group-hover:text-slate-200'}`}>
            <Icon size={15} />
          </span>
        )}
        <span className={`font-medium tracking-wide flex-1 text-left ${indent ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />}
      </button>
    );
  };

  const Section = ({
    sectionKey,
    label,
    children: sectionChildren,
  }: {
    sectionKey: string;
    label: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openSections[sectionKey] ?? true;
    return (
      <div>
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-3 pt-5 pb-1.5 group"
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
            {label}
          </span>
          <span className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={12} />
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-0.5 pb-1">
            {sectionChildren}
          </div>
        </div>
      </div>
    );
  };

  const pageTitle = PAGE_TITLES[activeTab] ?? activeTab;
  const breadcrumb: string[] = [];
  if (dashboardSubIds.includes(activeTab)) breadcrumb.push('Dashboards');
  breadcrumb.push(pageTitle);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <span className="font-bold text-base text-white tracking-tight">S</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none tracking-wide">StudentPay</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 overflow-y-auto">

          <Section sectionKey="gestion" label="Gestion">
            <NavItem id="users"   label="Utilisateurs"  icon={Users} />
            <NavItem id="wallets" label="Wallets" icon={WalletCards} />
          </Section>

          <Section sectionKey="operations" label="Opérations">
            <NavItem id="deposit"      label="Enregistrer dépôt"      icon={ArrowDownLeft} />
            <NavItem id="deposit-list" label="Cash to wallets" icon={ListOrdered} />
            <NavItem id="recettes-cantine" label="Recettes cantine" icon={ListOrdered} />
          </Section>

          <Section sectionKey="dashboards" label="Tableaux de bord">
            <NavItem id="dashboards" label="Graphiques" icon={LayoutDashboard} />
            <div className="border-l border-slate-700 ml-5 pl-1 mt-0.5 space-y-0.5">
              <NavItem id="dashboard-evolution-depot"  label="Évolution dépôts"       icon={TrendingUp} indent />
                <NavItem id="dashboard-recettes" label="Évolution recettes" icon={TrendingUp} indent />
              <NavItem id="dashboard-evolution-users"  label="Évolution utilisateurs" icon={Users}      indent />
            </div>
          </Section>

          <Section sectionKey="utilitaires" label="Utilitaires">
            <NavItem id="generate-qr" label="Générer QR code" icon={QrCode} />
          </Section>

        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg group-hover:bg-red-500/10">
              <LogOut size={15} />
            </span>
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen bg-slate-50">

        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.map((seg, i) => (
              <React.Fragment key={seg}>
                {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
                <span className={i === breadcrumb.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                  {seg}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              Admin connecté
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow shadow-indigo-900/20">
              AD
            </div>
          </div>
        </header>

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
