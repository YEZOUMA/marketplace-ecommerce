import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/format.js';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Votre panier est vide.</p>
        <Link to="/" className="text-brand-600 hover:underline">
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mon panier</h1>

      <div className="bg-white border rounded-lg divide-y">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {item.image && <img src={item.image} alt={item.nom} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.nom}</p>
              <p className="text-sm text-gray-500">{formatPrice(item.prix)}</p>
            </div>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantite}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              className="border rounded-md px-2 py-1 w-16"
            />
            <p className="font-semibold w-24 text-right">{formatPrice(item.prix * item.quantite)}</p>
            <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:underline text-sm">
              Retirer
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 bg-white border rounded-lg p-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-bold text-brand-700">{formatPrice(total)}</span>
      </div>

      <button
        onClick={() => navigate('/commande')}
        className="w-full mt-4 bg-brand-600 text-white py-3 rounded-md hover:bg-brand-700 font-medium"
      >
        Passer la commande
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">
        Aucun paiement n'est demandé ici — le règlement se fait directement avec le vendeur ou le livreur.
      </p>
    </div>
  );
}
