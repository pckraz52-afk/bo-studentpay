import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Transaction, TransactionType, Wallet, User } from '../types';

const ReceivedDeposits: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // FIX : 1 seul appel ciblé au lieu de N appels getHistory par wallet
        // Le backend filtre directement type=deposit et retourne tous les dépôts
        const [deposits, wallets, users] = await Promise.all([
          api.transactions.getAll({ type: TransactionType.DEPOSIT }),
          api.wallets.getAll(),
          api.users.getAll()
        ]);

        // Construction des maps pour l'affichage
        const wArr: Wallet[] = Array.isArray(wallets) ? wallets : [];
        const uArr: User[] = Array.isArray(users) ? users : [];

        const wMap: Record<string, Wallet> = {};
        wArr.forEach(w => (wMap[w.id] = w));

        const uMap: Record<string, User> = {};
        uArr.forEach(u => (uMap[u.id] = u));

        setWalletsMap(wMap);
        setUsersMap(uMap);

        // Tri par date décroissante
        const sorted = (Array.isArray(deposits) ? deposits : []).sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });

        setTransactions(sorted);
      } catch (e: any) {
        setError('Impossible de charger la liste des dépôts.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Liste des dépôts reçus</h3>

        {loading && <p className="text-sm text-gray-500">Chargement...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun dépôt trouvé.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Utilisateur</th>
                    <th className="py-2 pr-4">Wallet</th>
                    <th className="py-2 pr-4">Montant</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    // Un dépôt cible toujours le destinationWalletId
                    const wallet = walletsMap[tx.destinationWalletId || ''];
                    const user = wallet ? usersMap[wallet.userId] : undefined;
                    return (
                      <tr key={tx.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {user
                            ? `${user.nom} (${user.email})`
                            : wallet
                            ? wallet.userId
                            : '—'}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-600">
                          {wallet ? wallet.id : (tx.destinationWalletId || '—')}
                        </td>
                        <td className="py-3 pr-4 font-bold text-green-600">
                          +{tx.amount.toLocaleString()} {wallet?.currency ?? ''}
                        </td>
                        <td className="py-3 text-gray-600">
                          {tx.description || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedDeposits;