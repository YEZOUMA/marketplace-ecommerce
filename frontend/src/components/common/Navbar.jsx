import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const spaceLink = () => {
    if (!user) return null;
    if (user.role === 'VENDEUR') return { to: '/vendeur', label: 'Espace vendeur' };
    if (user.role === 'ADMIN') return { to: '/admin', label: 'Espace admin' };
    return { to: '/mes-commandes', label: 'Mes commandes' };
  };
  const space = spaceLink();

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-700">
          Marketplace
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-brand-600">
            Catalogue
          </Link>

          {user?.role !== 'VENDEUR' && (
            <Link to="/panier" className="relative hover:text-brand-600">
              Panier
              {items.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-brand-600 text-white text-xs rounded-full px-1.5">
                  {items.length}
                </span>
              )}
            </Link>
          )}

          {space && (
            <Link to={space.to} className="hover:text-brand-600">
              {space.label}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{user.nom}</span>
              <button onClick={handleLogout} className="text-red-600 hover:underline">
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/connexion" className="hover:text-brand-600">
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
