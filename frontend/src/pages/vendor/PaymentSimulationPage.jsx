import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { simulatePayment } from '../../api/payments.js';
import { PROVIDER_LABELS } from '../../utils/format.js';

// Stands in for the mobile money provider's own confirmation page (USSD prompt / redirect
// screen) when the app runs in mock/sandbox mode (no real provider credentials configured).
// A real integration would never render this — the customer would confirm on their phone
// and the provider would call our webhook directly.
export default function PaymentSimulationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  const prestataire = searchParams.get('prestataire');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (resultat) => {
    setLoading(true);
    try {
      const res = await simulatePayment({ reference, resultat });
      setResult(res.statut);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white border rounded-lg p-8 text-center">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Mode simulation (sandbox)</p>
      <h1 className="text-xl font-bold mb-4">{PROVIDER_LABELS[prestataire] || prestataire}</h1>
      <p className="text-sm text-gray-500 mb-6">
        En production, le client confirmerait ce paiement sur son téléphone (USSD/app). Ici, simulez le
        résultat pour tester le flux de bout en bout.
      </p>

      {result ? (
        <div>
          <p className={`font-semibold mb-4 ${result === 'REUSSI' ? 'text-green-600' : 'text-red-600'}`}>
            Paiement {result === 'REUSSI' ? 'réussi' : 'échoué'}
          </p>
          <Link to="/vendeur/produits" className="text-brand-600 hover:underline">
            Retour à mes produits
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 justify-center">
          <button
            disabled={loading}
            onClick={() => handleSimulate('REUSSI')}
            className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50"
          >
            Simuler un paiement réussi
          </button>
          <button
            disabled={loading}
            onClick={() => handleSimulate('ECHOUE')}
            className="border px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Simuler un échec
          </button>
        </div>
      )}

      <button onClick={() => navigate('/vendeur/produits')} className="text-xs text-gray-400 mt-6 hover:underline">
        Annuler
      </button>
    </div>
  );
}
