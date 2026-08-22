import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

import CatalogPage from './pages/client/CatalogPage.jsx';
import ProductDetailPage from './pages/client/ProductDetailPage.jsx';
import CartPage from './pages/client/CartPage.jsx';
import CheckoutPage from './pages/client/CheckoutPage.jsx';
import OrdersPage from './pages/client/OrdersPage.jsx';

import VendorLayout from './components/vendor/VendorLayout.jsx';
import DashboardPage from './pages/vendor/DashboardPage.jsx';
import ProductListPage from './pages/vendor/ProductListPage.jsx';
import ProductFormPage from './pages/vendor/ProductFormPage.jsx';
import PublishPaymentPage from './pages/vendor/PublishPaymentPage.jsx';
import PaymentSimulationPage from './pages/vendor/PaymentSimulationPage.jsx';
import PaymentsHistoryPage from './pages/vendor/PaymentsHistoryPage.jsx';
import ReceivedOrdersPage from './pages/vendor/ReceivedOrdersPage.jsx';

import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/produits/:id" element={<ProductDetailPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />

          <Route
            path="/commande"
            element={
              <ProtectedRoute roles={['CLIENT']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mes-commandes"
            element={
              <ProtectedRoute roles={['CLIENT']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendeur"
            element={
              <ProtectedRoute roles={['VENDEUR']}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="produits" element={<ProductListPage />} />
            <Route path="produits/nouveau" element={<ProductFormPage />} />
            <Route path="produits/:id/modifier" element={<ProductFormPage />} />
            <Route path="produits/:id/publier" element={<PublishPaymentPage />} />
            <Route path="paiement/simuler" element={<PaymentSimulationPage />} />
            <Route path="commandes" element={<ReceivedOrdersPage />} />
            <Route path="paiements" element={<PaymentsHistoryPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="utilisateurs" element={<AdminUsersPage />} />
            <Route path="produits" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="commandes" element={<AdminOrdersPage />} />
            <Route path="paiements" element={<AdminPaymentsPage />} />
          </Route>

          <Route path="*" element={<p className="text-center py-20 text-gray-500">Page introuvable.</p>} />
        </Routes>
      </main>
    </div>
  );
}
