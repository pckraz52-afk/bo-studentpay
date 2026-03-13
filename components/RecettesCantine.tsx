import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TransactionType } from '../types';
import { format } from 'date-fns';

const RecettesCantine: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api.transactions.getAll({ type: TransactionType.PAYMENT })
      .then(res => {
        if (!mounted) return;
        setTransactions(res || []);
      })
      .catch(err => {
        if (!mounted) return;
        setError(String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const total = transactions.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recettes cantine</h2>

      {loading && <div className="text-sm text-slate-500">Chargement...</div>}
      {error && <div className="text-sm text-red-500">Erreur: {error}</div>}

      {!loading && !error && (
        <div className="max-w-md">
          <div className="mb-4">
            <div className="text-sm text-slate-600 mb-2">Nombre de transactions: <strong>{transactions.length}</strong></div>

            {/* Small invisible table to align the total above the 'Montant' column dynamically */}
            <div className="w-full mb-2">
              <table className="w-full table-auto">
                <thead className="sr-only">
                  <tr>
                    <th />
                    <th />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td />
                    <td />
                    <td className="text-right text-lg font-semibold">Total: {total.toLocaleString()} Ar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="table-auto text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-sm text-slate-500">Date</th>
                  <th className="px-4 py-2 text-sm text-slate-500">Description</th>
                  <th className="px-4 py-2 text-sm text-slate-500 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-3 text-sm text-slate-600">{tx.createdAt ? format(new Date(tx.createdAt), 'dd/MM/yy') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{tx.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 text-right">{(tx.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">Aucune transaction trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecettesCantine;


