import { useEffect, useState, useCallback } from 'react';
import { listProducts } from '../../api/products.js';
import { listCategories } from '../../api/categories.js';
import ProductCard from '../../components/client/ProductCard.jsx';

const initialFilters = { q: '', categorieId: '', prixMin: '', prixMax: '', page: 1 };

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const data = await listProducts(params);
      setProducts(data.items);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Catalogue produits</h1>

      <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-lg border">
        <input
          placeholder="Rechercher un produit..."
          className="border rounded-md px-3 py-2 flex-1 min-w-[200px]"
          value={filters.q}
          onChange={(e) => updateFilter({ q: e.target.value })}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={filters.categorieId}
          onChange={(e) => updateFilter({ categorieId: e.target.value })}
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Prix min"
          className="border rounded-md px-3 py-2 w-28"
          value={filters.prixMin}
          onChange={(e) => updateFilter({ prixMin: e.target.value })}
        />
        <input
          type="number"
          placeholder="Prix max"
          className="border rounded-md px-3 py-2 w-28"
          value={filters.prixMax}
          onChange={(e) => updateFilter({ prixMax: e.target.value })}
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement des produits...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Aucun produit ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`px-3 py-1 rounded ${filters.page === p ? 'bg-brand-600 text-white' : 'bg-white border'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
