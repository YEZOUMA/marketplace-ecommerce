import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../../api/products.js';
import { getProviders, initiatePublicationPayment } from '../../api/payments.js';
import { formatPrice, PROVIDER_LABELS } from '../../utils/format.js';

export default function PublishPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [providers, setProviders] = useState({ providers: [], fraisPublication: {} });
  const [prestataire, setPrestataire] = useState('');
  const [numeroTelephone, setNumeroTelephone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProduct(id).then(setProduct);
    getProviders().then((data) => {
      setProviders(data);
      setPrestataire(data.providers[0]);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { redirectUrl } = await initiatePublicationPayment(id, { prestataire, numeroTelephone });
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'initiation du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-2">Publier "{product.nom}"</h2>
      <p className="text-sm text-gray-500 mb-6">
        Frais de publication :{' '}
        <span className="font-semibold text-brand-700">
          {formatPrice(providers.fraisPublication.amount, providers.fraisPublication.currency)}
        </span>
        . Le produit sera visible des clients dès confirmation du paiement.
      </p>

      {error && <p className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Prestataire mobile money</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={prestataire}
            onChange={(e) => setPrestataire(e.target.value)}
          >
            {providers.providers.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p] || p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Numéro de téléphone</label>
          <input
            required
            className="w-full border rounded-md px-3 py-2"
            value={numeroTelephone}
            onChange={(e) => setNumeroTelephone(e.target.value)}
            placeholder="+226 70 00 00 00"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-2.5 rounded-md hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Initiation...' : 'Payer et publier'}
        </button>
      </form>
    </div>
  );
}
