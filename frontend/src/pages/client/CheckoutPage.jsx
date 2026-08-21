import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { createOrder } from '../../api/orders.js';
import { formatPrice } from '../../utils/format.js';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantite: i.quantite })),
        adresseLivraison,
        notes: notes || undefined,
      });
      clearCart();
      navigate(`/mes-commandes?confirmee=${order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Finaliser la commande</h1>
      <p className="text-sm text-gray-500 mb-6">
        Aucun paiement en ligne n'est requis. Le règlement se fait directement avec le vendeur ou le
        livreur à la livraison.
      </p>

      {error && <p className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Adresse de livraison</label>
          <textarea
            required
            rows={3}
            className="w-full border rounded-md px-3 py-2"
            value={adresseLivraison}
            onChange={(e) => setAdresseLivraison(e.target.value)}
            placeholder="Quartier, ville, repère..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
          <textarea
            rows={2}
            className="w-full border rounded-md px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions de livraison, disponibilités..."
          />
        </div>

        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total à régler à la livraison</span>
          <span className="text-brand-700">{formatPrice(total)}</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-3 rounded-md hover:bg-brand-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Envoi...' : 'Confirmer la commande'}
        </button>
      </form>
    </div>
  );
}
