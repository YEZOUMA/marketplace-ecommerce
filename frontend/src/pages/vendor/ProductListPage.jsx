import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { listProducts, deleteProduct } from '../../api/products.js';
import { formatPrice, STATUS_LABELS } from '../../utils/format.js';

const STATUS_COLORS = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  EN_ATTENTE_PAIEMENT: 'bg-yellow-100 text-yellow-800',
  PUBLIE: 'bg-green-100 text-green-800',
  SUSPENDU: 'bg-red-100 text-red-800',
};

export default function ProductListPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listProducts({ vendeurId: user.id, pageSize: 100 });
    setProducts(data.items);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer définitivement ce produit ?')) return;
    await deleteProduct(id);
    load();
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Vous n'avez pas encore publié de produit.</p>
        <Link to="/vendeur/produits/nouveau" className="text-brand-600 hover:underline">
          Créer mon premier produit
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg divide-y">
      {products.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4">
          <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            {p.images?.[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.nom}</p>
            <p className="text-sm text-gray-500">
              {formatPrice(p.prix)} · Stock: {p.stock}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[p.statut]}`}>
            {STATUS_LABELS[p.statut]}
          </span>
          <div className="flex gap-2 text-sm">
            {(p.statut === 'BROUILLON') && (
              <Link to={`/vendeur/produits/${p.id}/publier`} className="text-brand-600 hover:underline">
                Publier
              </Link>
            )}
            <Link to={`/vendeur/produits/${p.id}/modifier`} className="text-gray-600 hover:underline">
              Modifier
            </Link>
            <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
