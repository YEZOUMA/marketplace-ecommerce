import { useEffect, useState, useCallback } from 'react';
import { adminListUsers } from '../../api/admin.js';
import { formatDate } from '../../utils/format.js';

export default function AdminUsersPage() {
  const [role, setRole] = useState('');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await adminListUsers({ role: role || undefined, pageSize: 100 });
    setData(result);
    setLoading(false);
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Utilisateurs ({data.total})</h2>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
          <option value="">Tous les rôles</option>
          <option value="CLIENT">Clients</option>
          <option value="VENDEUR">Vendeurs</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Téléphone</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">{u.nom}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.telephone || '-'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{formatDate(u.dateCreation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
