import { useEffect, useState, useCallback } from 'react';
import { adminListPayments } from '../../api/admin.js';
import { formatPrice, formatDate, STATUS_LABELS, PROVIDER_LABELS } from '../../utils/format.js';

export default function AdminPaymentsPage() {
  const [statut, setStatut] = useState('');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await adminListPayments({ statut: statut || undefined, pageSize: 100 });
    setData(result);
    setLoading(false);
  }, [statut]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Paiements de publication ({data.total})</h2>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="REUSSI">Réussi</option>
          <option value="ECHOUE">Échoué</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Produit</th>
                <th className="p-3">Vendeur</th>
                <th className="p-3">Prestataire</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">{p.product?.nom}</td>
                  <td className="p-3">{p.vendeur?.nom}</td>
                  <td className="p-3">{PROVIDER_LABELS[p.prestataire]}</td>
                  <td className="p-3">{formatPrice(p.montant, p.devise)}</td>
                  <td className="p-3">{STATUS_LABELS[p.statut]}</td>
                  <td className="p-3">{formatDate(p.dateCreation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.items.length === 0 && <p className="p-4 text-gray-500">Aucun paiement.</p>}
        </div>
      )}
    </div>
  );
}
