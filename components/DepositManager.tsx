import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Wallet, TransactionType } from '../types';
import { Loader2, Search, CheckCircle2, User as UserIcon, Wallet as WalletIcon } from 'lucide-react';

const DepositManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userWallet, setUserWallet] = useState<Wallet | null>(null);
    const [walletId, setWalletId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleCancel = () => {
        setSearchTerm('');
        setSelectedUser(null);
        setUserWallet(null);
        setWalletId('');
        setAmount('');
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleSearch = async () => {
        if(!searchTerm) return;
        setLoading(true);
        setErrorMsg('');
        setSelectedUser(null);
        setUserWallet(null);
        try {
            // Recherche simpliste : on récupère tout et on filtre (car l'API user n'a pas de search endpoint documenté)
            // Dans une vraie app, il faudrait un endpoint /users?search=...
            const result: any = await api.users.getAll();
            const allUsers = Array.isArray(result) ? result : [];
            setUsers(allUsers);

            const found = allUsers.find(u => u.email === searchTerm || u.email.includes(searchTerm) || u.nom.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if(found) {
                setSelectedUser(found);
                // Récupérer son wallet
                try {
                    const wallet = await api.wallets.getByUserId(found.id);
                    setUserWallet(wallet);
                    setWalletId(wallet?.id || '');
                } catch {
                    setErrorMsg("Cet utilisateur n'a pas de wallet.");
                }
            } else {
                setErrorMsg("Utilisateur introuvable.");
            }
        } catch (e) { setErrorMsg("Erreur réseau"); } 
        finally { setLoading(false); }
    };

    // Charger la liste des utilisateurs au montage pour le datalist
    useEffect(() => {
        (async () => {
            try {
                const result: any = await api.users.getAll();
                const allUsers = Array.isArray(result) ? result : [];
                setUsers(allUsers);
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const handleSearchChange = async (value: string) => {
        setSearchTerm(value);
        // Si la valeur correspond exactement à un email d'utilisateur, sélectionner directement
        const found = users.find(u => u.email === value || `${u.nom} - ${u.email}` === value);
        if (found) {
            setSelectedUser(found);
            try {
                const wallet = await api.wallets.getByUserId(found.id);
                setUserWallet(wallet);
                setWalletId(wallet?.id || '');
            } catch {
                setUserWallet(null);
                setWalletId('');
            }
        } else {
            setSelectedUser(null);
            setUserWallet(null);
            setWalletId('');
        }
    };

    const fetchWalletById = async (id: string) => {
        if (!id) { setUserWallet(null); return; }
        try {
            const result: any = await api.wallets.getAll();
            const all = Array.isArray(result) ? result : [];
            const w = all.find((x: Wallet) => x.id === id);
            if (w) setUserWallet(w);
            else setUserWallet(null);
        } catch {
            setUserWallet(null);
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!userWallet) return;
        setLoading(true);
        try {
            await api.transactions.create({
                amount: parseFloat(amount),
                type: TransactionType.DEPOSIT,
                destinationWalletId: userWallet.id,
                description: "Dépôt Admin/Guichet"
            });
            setSuccessMsg(`Dépôt de ${amount} ${userWallet.currency} effectué !`);
            setAmount('');
            setSelectedUser(null);
            setUserWallet(null);
            setWalletId('');
            setSearchTerm('');
            // The form is reset, so no need to refresh the wallet balance of a cleared user.
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e) {
            setErrorMsg("Échec du dépôt.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto mt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Dépôt d'Espèces</h2>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                
                {/* Search Box */}
                <div className="relative">
                    <input 
                        list="users-list"
                        type="text" 
                        placeholder="Choisir un utilisateur..." 
                        className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <datalist id="users-list">
                        {users.map(u => (
                            <option key={u.id} value={u.email} label={u.nom} />
                        ))}
                    </datalist>
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <button onClick={handleSearch} disabled={loading} className="absolute right-2 top-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'OK'}
                    </button>
                </div>

                {errorMsg && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{errorMsg}</div>}

                {/* Result Card */}
                {selectedUser && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{selectedUser.nom}</p>
                                <p className="text-xs text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <div className="mb-3">
                                <label className="block text-xs font-bold uppercase text-gray-500">Wallet ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 p-3 text-sm border rounded-xl"
                                        value={walletId}
                                        onChange={e => setWalletId(e.target.value)}
                                        onBlur={e => fetchWalletById(e.target.value)}
                                        placeholder="ID du wallet (modifiable)"
                                    />
                                    <button onClick={() => fetchWalletById(walletId)} className="px-3 py-2 bg-slate-900 text-white rounded-lg">Charger</button>
                                </div>
                            </div>

                            {userWallet ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <WalletIcon size={16} />
                                            <span>Solde actuel :</span>
                                        </div>
                                        <span className="font-bold text-lg text-green-600">{userWallet.balance} {userWallet.currency}</span>
                                    </div>

                                    <form onSubmit={handleDeposit} className="space-y-3">
                                        <label className="block text-xs font-bold uppercase text-gray-500">Montant à créditer</label>
                                        <input 
                                            type="number" 
                                            step="100"
                                            min="100"
                                            className="w-full p-3 text-lg font-bold border rounded-xl"
                                            placeholder="0"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={handleCancel}
                                                className="flex-1 bg-gray-300 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-400 transition-all flex justify-center items-center gap-2"
                                            >
                                                Annuler
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={loading || !amount || !userWallet}
                                                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex justify-center items-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <>Confirmer le Dépôt <CheckCircle2 size={18} /></>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <p className="text-red-500 text-sm italic">Pas de wallet associé.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {successMsg && (
                <div className="mt-4 p-4 bg-green-600 text-white rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <CheckCircle2 size={24} />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}
        </div>
    );
};

export default DepositManager;