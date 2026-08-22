import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayments } from '../../api/payments.js';
import { formatPrice, formatDate, STATUS_LABELS, PROVIDER_LABELS } from '../../utils/format.js';

const STATUS_COLORS = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  REUSSI: 'bg-green-100 text-green-800',
  ECHOUE: 'bg-red-100 text-red-800',
};

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Aucun paiement de publication pour l'instant.</p>
        <Link to="/vendeur/produits" className="text-brand-600 hover:underline">
          Aller à mes produits
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg divide-y">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.product?.nom || 'Produit supprimé depuis'}</p>
            <p className="text-sm text-gray-500">
              {PROVIDER_LABELS[p.prestataire]} · {formatDate(p.dateCreation)}
            </p>
          </div>
          <p className="font-semibold">{formatPrice(p.montant, p.devise)}</p>
          <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[p.statut]}`}>
            {STATUS_LABELS[p.statut]}
          </span>
        </div>
      ))}
    </div>
  );
}
