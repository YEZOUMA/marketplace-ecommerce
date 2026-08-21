import { useEffect, useState, useCallback } from 'react';
import { listReceivedOrders, updateOrderStatus } from '../../api/orders.js';
import { formatPrice, formatDate, STATUS_LABELS } from '../../utils/format.js';

const STATUS_OPTIONS = ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];

export default function ReceivedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await listReceivedOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (orderId, statut) => {
    await updateOrderStatus(orderId, statut);
    load();
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  if (orders.length === 0) {
    return <p className="text-gray-500">Aucune commande reçue pour l'instant.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
              <p className="text-xs text-gray-500">
                {formatDate(order.dateCreation)} · {order.client?.nom} ({order.client?.telephone || order.client?.email})
              </p>
            </div>
            <select
              value={order.statut}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <ul className="text-sm text-gray-600 divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="py-1.5 flex justify-between">
                <span>
                  {item.product?.nom} × {item.quantite}
                </span>
                <span>{formatPrice(item.prixUnitaire * item.quantite)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-2">Livraison : {order.adresseLivraison}</p>
          {order.notes && <p className="text-xs text-gray-400">Notes : {order.notes}</p>}
        </div>
      ))}
    </div>
  );
}
