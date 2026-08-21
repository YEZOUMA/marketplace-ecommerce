import { useEffect, useState, useCallback } from 'react';
import { listProducts } from '../../api/products.js';
import { adminSetProductStatus } from '../../api/admin.js';
import { formatPrice, STATUS_LABELS } from '../../utils/format.js';

const STATUSES = ['BROUILLON', 'EN_ATTENTE_PAIEMENT', 'PUBLIE', 'SUSPENDU'];

export default function AdminProductsPage() {
  const [statut, setStatut] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listProducts({ statut: statut || undefined, pageSize: 100 });
    setProducts(data.items);
    setLoading(false);
  }, [statut]);

  useEffect(() => {
    load();
  }, [load]);

  const handleModerate = async (id, nextStatus) => {
    await adminSetProductStatus(id, nextStatus);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Modération des produits</h2>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.nom}</p>
                <p className="text-sm text-gray-500">
                  {formatPrice(p.prix)} · Vendeur: {p.vendeur?.nom} · {STATUS_LABELS[p.statut]}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {p.statut !== 'PUBLIE' && (
                  <button onClick={() => handleModerate(p.id, 'PUBLIE')} className="text-green-600 hover:underline">
                    Publier
                  </button>
                )}
                {p.statut !== 'SUSPENDU' && (
                  <button onClick={() => handleModerate(p.id, 'SUSPENDU')} className="text-red-600 hover:underline">
                    Suspendre
                  </button>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="p-4 text-gray-500">Aucun produit.</p>}
        </div>
      )}
    </div>
  );
}
