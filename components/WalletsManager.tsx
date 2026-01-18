import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Wallet, User } from '../types';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';

const WalletsManager: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Pour le select lors de la création
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ userId: '', balance: 0, currency: 'Ar' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({
    id: 150,
    user: 200,
    balance: 150,
    actions: 100
  });
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wListRaw, uListRaw] = await Promise.all([api.wallets.getAll(), api.users.getAll()]);

      const wList = Array.isArray(wListRaw) ? wListRaw : [];
      const uList = Array.isArray(uListRaw) ? uListRaw : [];

      // Enrich wallets with user names manually since API might separate them
      const enrichedWallets = wList.map(w => ({
        ...w,
        user: uList.find(u => u.id === w.userId)
      }));
      setWallets(enrichedWallets);
      setUsers(uList);
    } catch (e) {
      console.error(e);
      // En cas d'erreur grave, on vide les listes pour éviter les crashs au render
      setWallets([]);
      setUsers([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Handle column resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { col, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({ ...prev, [col]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent potentially triggering sort or other events
    resizingRef.current = { col, startX: e.clientX, startWidth: (columnWidths as any)[col] };
    document.body.style.cursor = 'col-resize';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce wallet ?")) return;
    try { await api.wallets.delete(id); loadData(); } catch (e) { alert("Erreur"); }
  };

  const handleEdit = (wallet: Wallet) => {
    setFormData({ userId: wallet.userId, balance: wallet.balance, currency: wallet.currency });
    setEditingId(wallet.id);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({ userId: '', balance: 0, currency: 'Ar' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.wallets.update(editingId, formData);
      } else {
        await api.wallets.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (e) { alert("Erreur opération wallet"); }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('fr-FR').replace(/\u202f/g, ' '); // Ensure spaces are used
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Porte-monnaies</h2>
        <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:bg-indigo-700">
          <Plus size={16} /> Créer
        </button>
      </div>

      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: '600px', tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
              <tr>
                <th className="p-4 relative" style={{ width: columnWidths.id }}>
                  ID Wallet
                  <div
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-indigo-400 opacity-0 hover:opacity-100 z-10 translate-x-1/2"
                    onMouseDown={(e) => startResizing(e, 'id')}
                  />
                </th>
                <th className="p-4 relative" style={{ width: columnWidths.user }}>
                  Titulaire
                  <div
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-indigo-400 opacity-0 hover:opacity-100 z-10 translate-x-1/2"
                    onMouseDown={(e) => startResizing(e, 'user')}
                  />
                </th>
                <th className="p-4 text-right relative" style={{ width: columnWidths.balance }}>
                  Solde
                  <div
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-indigo-400 opacity-0 hover:opacity-100 z-10 translate-x-1/2"
                    onMouseDown={(e) => startResizing(e, 'balance')}
                  />
                </th>
                <th className="p-4 text-right" style={{ width: columnWidths.actions }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wallets.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-500 truncate" style={{ width: columnWidths.id }}>{w.id}</td>
                  <td className="p-4 font-medium text-gray-900 truncate" style={{ width: columnWidths.user }}>
                    {w.user ? w.user.nom : <span className="text-red-400 italic">Inconnu ({w.userId})</span>}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600 truncate" style={{ width: columnWidths.balance }}>{formatNumber(w.balance)} {w.currency}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(w)} className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(w.id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Aucun wallet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL WALLET */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Modifier Portefeuille' : 'Nouveau Portefeuille'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Propriétaire</label>
                <select
                  className="w-full p-3 border rounded-lg bg-white"
                  value={formData.userId}
                  onChange={e => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solde initial</label>
                  <input type="number" className="w-full p-3 border rounded-lg" value={formData.balance} onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <input type="text" className="w-full p-3 border rounded-lg" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700">{editingId ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletsManager;