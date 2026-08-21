import { useEffect, useState } from 'react';
import { getVendorStats } from '../../api/products.js';

const cards = [
  { key: 'totalProduits', label: 'Produits au total' },
  { key: 'produitsPublies', label: 'Produits publiés' },
  { key: 'produitsEnAttente', label: 'En attente de paiement' },
  { key: 'commandesRecues', label: 'Articles commandés' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getVendorStats().then(setStats);
  }, []);

  if (!stats) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="bg-white border rounded-lg p-4">
          <p className="text-3xl font-bold text-brand-700">{stats[c.key]}</p>
          <p className="text-sm text-gray-500 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
