import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/vendeur', label: 'Tableau de bord', end: true },
  { to: '/vendeur/produits', label: 'Mes produits' },
  { to: '/vendeur/produits/nouveau', label: 'Publier un produit' },
  { to: '/vendeur/commandes', label: 'Commandes reçues' },
];

export default function VendorLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Espace vendeur</h1>
      <div className="flex gap-6">
        <nav className="w-52 flex-shrink-0 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
