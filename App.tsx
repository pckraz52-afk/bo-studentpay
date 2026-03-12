import React, { useState } from 'react';
import { User } from './types';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import UsersManager from './components/UsersManager';
import WalletsManager from './components/WalletsManager';
import DepositManager from './components/DepositManager';
import ReceivedDeposits from './components/ReceivedDeposits';
import DashboardEvolutionDepot from './components/DashboardEvolutionDepot';
import DashboardEvolutionUsers from './components/DashboardEvolutionUsers';
import GenerateQr from './components/GenerateQr';

// --- MAIN APP ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'users' && <UsersManager />}
      {activeTab === 'wallets' && <WalletsManager />}
      {activeTab === 'deposit' && <DepositManager />}
      {activeTab === 'deposit-list' && <ReceivedDeposits />}
      {activeTab === 'dashboards' && <div><h3 className="text-2xl font-bold">Dashboards</h3></div>}
      {activeTab === 'dashboard-evolution-depot' && <DashboardEvolutionDepot />}
      {activeTab === 'dashboard-evolution-users' && <DashboardEvolutionUsers />}
      {activeTab === 'generate-qr' && <GenerateQr />}
    </Layout>
  );
};

export default App;
