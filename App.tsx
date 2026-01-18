import React, { useState } from 'react';
import { User } from './types';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import UsersManager from './components/UsersManager';
import WalletsManager from './components/WalletsManager';
import DepositManager from './components/DepositManager';

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
    </Layout>
  );
};

export default App;