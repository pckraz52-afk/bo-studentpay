import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Wallet } from '../types';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';

interface UserWithWallet extends User {
  walletId?: string;
}

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<UserWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    passwd: '',
    type: 'student',
    adresse: '',
    num_CIN: '',
    role: 'user',
    type_utilisateur: 'standard'
  });
  const PASSWORD_PLACEHOLDER = '********';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersResponse, walletsResponse]: [any, any] = await Promise.all([
        api.users.getAll(),
        api.wallets.getAll()
      ]);
      
      const usersData: User[] = Array.isArray(usersResponse) ? usersResponse : [];
      const walletsData: Wallet[] = Array.isArray(walletsResponse) ? walletsResponse : [];

      const walletMap = new Map<string, string>();
      walletsData.forEach((wallet: Wallet) => {
        walletMap.set(wallet.userId, wallet.id);
      });

      const usersWithWallets: UserWithWallet[] = usersData.map((user: User) => ({
        ...user,
        walletId: walletMap.get(user.id)
      }));
      
      setUsers(usersWithWallets);
    } catch (error) {
      console.error(error);
      alert("Impossible de charger les utilisateurs ou les portefeuilles.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await api.users.delete(id);
      loadUsers();
    } catch (e) { alert("Erreur suppression"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      // Si on édite et que le champ mot de passe contient le placeholder,
      // on l'enlève du payload pour ne pas écraser le mot de passe existant.
      if (editingUser && payload.passwd === PASSWORD_PLACEHOLDER) {
        delete payload.passwd;
      }

      if (editingUser) {
        await api.users.update(editingUser.id, payload);
      } else {
        await api.users.create(payload);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ nom: '', email: '', passwd: '', type: 'student', adresse: '', num_CIN: '', role: 'user', type_utilisateur: 'standard' });
      loadUsers();
    } catch (e) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      nom: u.nom,
      email: u.email,
      passwd: PASSWORD_PLACEHOLDER, // Présenter un placeholder masqué lors de l'édition
      type: u.type || 'student',
      adresse: u.adresse || '',
      num_CIN: u.num_CIN || '',
      role: u.role || 'user',
      type_utilisateur: u.type_utilisateur || 'standard'
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ nom: '', email: '', passwd: '', type: 'student', adresse: '', num_CIN: '', role: 'user', type_utilisateur: 'standard' });
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Utilisateurs</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
              <tr>
                <th className="p-4">Nom</th>
                <th className="p-4 hidden sm:table-cell">Email</th>
                <th className="p-4 hidden sm:table-cell">Type</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    <div>{u.nom}</div>
                    {u.walletId && <div className="text-xs text-gray-400 font-mono">ID Wallet: {u.walletId}</div>}
                    <div className="text-xs text-gray-400 sm:hidden">{u.email}</div>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-gray-600">{u.email}</td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{u.type}</span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-lg"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Aucun utilisateur trouvé.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL USER */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" placeholder="Nom complet" className="w-full p-3 border rounded-lg" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
              <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              <input type="password" placeholder="Mot de passe (numérique)" className="w-full p-3 border rounded-lg" value={formData.passwd} onChange={e => setFormData({ ...formData, passwd: e.target.value })} required={!editingUser} />

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="CIN" className="w-full p-3 border rounded-lg" value={formData.num_CIN} onChange={e => setFormData({ ...formData, num_CIN: e.target.value })} />
                <select className="w-full p-3 border rounded-lg" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="student">Étudiant</option>
                  <option value="teacher">Enseignant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Role" className="w-full p-3 border rounded-lg" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
                <input type="text" placeholder="Type Utilisateur" className="w-full p-3 border rounded-lg" value={formData.type_utilisateur} onChange={e => setFormData({ ...formData, type_utilisateur: e.target.value })} />
              </div>

              <input type="text" placeholder="Adresse" className="w-full p-3 border rounded-lg" value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} />

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;