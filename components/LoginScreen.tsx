import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@studentpay.com');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.auth.login(email, password);
      onLogin(user);
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Gestion fine des messages d'erreur pour aider au débogage
      const msg = err.message || "";
      
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError("Erreur Réseau : Impossible de joindre le serveur (http://localhost:3001). Vérifiez qu'il est lancé et que CORS est activé.");
      } else if (msg.includes('401')) {
        setError("Accès refusé (401) : Identifiants incorrects ou format de requête invalide.");
      } else if (msg.includes('404')) {
        setError("Erreur 404 : L'endpoint de connexion est introuvable.");
      } else {
        setError(`Erreur : ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">StudentPay <span className="text-indigo-600">Admin</span></h1>
          <p className="text-gray-500 text-sm mt-2">Connectez-vous au back-office</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mot de passe</label>
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-2 top-9 p-1 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex flex-col gap-1 border border-red-100">
                <div className="flex items-center gap-2 font-bold">
                    <AlertCircle size={18}/> Oups !
                </div>
                <p>{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;