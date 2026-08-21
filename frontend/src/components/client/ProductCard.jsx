import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';

export default function ProductCard({ product }) {
  const image = product.images?.[0]?.url;

  return (
    <Link
      to={`/produits/${product.id}`}
      className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={product.nom} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">Pas d'image</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2">{product.nom}</h3>
        <p className="text-xs text-gray-500 mt-1">{product.vendeur?.nom}</p>
        <p className="text-brand-700 font-bold mt-2">{formatPrice(product.prix)}</p>
      </div>
    </Link>
  );
}
