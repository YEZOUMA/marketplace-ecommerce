import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listMyOrders } from '../../api/orders.js';
import { formatPrice, formatDate, STATUS_LABELS } from '../../utils/format.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const confirmedId = searchParams.get('confirmee');

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-16 text-gray-500">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>

      {confirmedId && (
        <p className="bg-green-50 text-green-700 text-sm p-3 rounded mb-6">
          Votre commande a bien été enregistrée. Le vendeur ou le livreur vous contactera pour la
          livraison et le règlement.
        </p>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-500">Vous n'avez pas encore passé de commande.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.dateCreation)}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{STATUS_LABELS[order.statut]}</span>
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
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Livraison : {order.adresseLivraison}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
