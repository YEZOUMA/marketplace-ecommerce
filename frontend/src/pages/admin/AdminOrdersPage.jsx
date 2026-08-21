import { useEffect, useState } from 'react';
import { adminListOrders } from '../../api/admin.js';
import { formatPrice, formatDate, STATUS_LABELS } from '../../utils/format.js';

export default function AdminOrdersPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListOrders({ pageSize: 100 })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Commandes ({data.total})</h2>
      <div className="space-y-3">
        {data.items.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                #{order.id.slice(0, 8)} · {order.client?.nom}
              </span>
              <span>{formatDate(order.dateCreation)}</span>
            </div>
            <p className="text-sm text-gray-500">
              {order.items.length} article(s) · {STATUS_LABELS[order.statut]} · {formatPrice(order.total)}
            </p>
          </div>
        ))}
        {data.items.length === 0 && <p className="text-gray-500">Aucune commande.</p>}
      </div>
    </div>
  );
}
