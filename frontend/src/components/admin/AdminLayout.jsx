import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/produits', label: 'Modération produits' },
  { to: '/admin/categories', label: 'Catégories' },
  { to: '/admin/commandes', label: 'Commandes' },
  { to: '/admin/paiements', label: 'Paiements vendeurs' },
];

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Espace admin</h1>
      <div className="flex gap-6">
        <nav className="w-56 flex-shrink-0 space-y-1">
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
