import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', motDePasse: '', role: 'CLIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'VENDEUR' ? '/vendeur' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
      <p className="text-sm text-gray-500 mb-6">Inscription gratuite, pour les clients comme pour les vendeurs.</p>
      {error && <p className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom complet</label>
          <input
            required
            className="w-full border rounded-md px-3 py-2"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full border rounded-md px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="+226 70 00 00 00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full border rounded-md px-3 py-2"
            value={form.motDePasse}
            onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Je m'inscris en tant que</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === 'CLIENT'}
                onChange={() => setForm({ ...form, role: 'CLIENT' })}
              />
              Client
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === 'VENDEUR'}
                onChange={() => setForm({ ...form, role: 'VENDEUR' })}
              />
              Vendeur
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="text-brand-600 hover:underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
