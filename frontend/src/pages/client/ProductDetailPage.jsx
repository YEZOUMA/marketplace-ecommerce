import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../../api/products.js';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/format.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantite, setQuantite] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <p className="text-center py-20 text-gray-500">Produit introuvable.</p>;
  }

  if (!product) {
    return <p className="text-center py-20 text-gray-500">Chargement...</p>;
  }

  const handleAddToCart = () => {
    addItem(product, quantite);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {product.images?.[activeImage] ? (
            <img
              src={product.images[activeImage].url}
              alt={product.nom}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400">Pas d'image</span>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="flex gap-2 mt-3">
            {product.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded border overflow-hidden ${idx === activeImage ? 'ring-2 ring-brand-600' : ''}`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{product.nom}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vendu par {product.vendeur?.nom} · {product.categorie?.nom || 'Non catégorisé'}
        </p>
        <p className="text-3xl font-bold text-brand-700 mt-4">{formatPrice(product.prix)}</p>
        <p className="text-sm text-gray-600 mt-1">{product.stock} en stock</p>

        <p className="mt-6 text-gray-700 whitespace-pre-line">{product.description}</p>

        <div className="flex items-center gap-3 mt-6">
          <label htmlFor="quantite" className="text-sm font-medium">
            Quantité
          </label>
          <input
            id="quantite"
            type="number"
            min={1}
            max={product.stock}
            value={quantite}
            onChange={(e) => setQuantite(Math.min(product.stock, Math.max(1, Number(e.target.value))))}
            className="border rounded-md px-3 py-2 w-20"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-brand-600 text-white px-6 py-2.5 rounded-md hover:bg-brand-700 disabled:opacity-50"
          >
            {product.stock === 0 ? 'Rupture de stock' : added ? 'Ajouté ✓' : 'Ajouter au panier'}
          </button>
          <button onClick={() => navigate('/panier')} className="border px-6 py-2.5 rounded-md hover:bg-gray-50">
            Voir le panier
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Le règlement de la commande se fait directement avec le vendeur ou le livreur, en dehors de
          l'application.
        </p>
      </div>
    </div>
  );
}
