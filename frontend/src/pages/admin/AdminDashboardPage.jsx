import { useEffect, useState } from 'react';
import { adminStats } from '../../api/admin.js';
import { formatPrice } from '../../utils/format.js';

const cards = [
  { key: 'totalUsers', label: 'Utilisateurs' },
  { key: 'totalVendeurs', label: 'Vendeurs' },
  { key: 'totalClients', label: 'Clients' },
  { key: 'totalProduits', label: 'Produits' },
  { key: 'produitsPublies', label: 'Produits publiés' },
  { key: 'totalCommandes', label: 'Commandes' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminStats().then(setStats);
  }, []);

  if (!stats) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {cards.map((c) => (
          <div key={c.key} className="bg-white border rounded-lg p-4">
            <p className="text-3xl font-bold text-brand-700">{stats[c.key]}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-lg p-4">
        <p className="text-3xl font-bold text-brand-700">{formatPrice(stats.revenuPublicationTotal)}</p>
        <p className="text-sm text-gray-500 mt-1">Revenu total des frais de publication (paiements réussis)</p>
      </div>
    </div>
  );
}
