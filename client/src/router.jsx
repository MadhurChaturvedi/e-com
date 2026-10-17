import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';

// Helper component to wrap lazy-loaded routes with Suspense
const Loadable = (Component) => (props) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

// Store Pages (Lazy Loaded)
const HomePage = Loadable(lazy(() => import('./pages/store/HomePage').then(m => ({ default: m.HomePage }))));
const ShopPage = Loadable(lazy(() => import('./pages/store/ShopPage').then(m => ({ default: m.ShopPage }))));
const ProductDetailsPage = Loadable(lazy(() => import('./pages/store/ProductDetailsPage').then(m => ({ default: m.ProductDetailsPage }))));
const CartPage = Loadable(lazy(() => import('./pages/store/CartPage').then(m => ({ default: m.CartPage }))));
const WishlistPage = Loadable(lazy(() => import('./pages/store/WishlistPage').then(m => ({ default: m.WishlistPage }))));
const CheckoutPage = Loadable(lazy(() => import('./pages/store/CheckoutPage').then(m => ({ default: m.CheckoutPage }))));
const OrderSuccessPage = Loadable(lazy(() => import('./pages/store/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage }))));

// Auth Pages (Lazy Loaded)
const LoginPage = Loadable(lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage }))));
const RegisterPage = Loadable(lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage }))));

// Customer Account Pages (Lazy Loaded)
const ProfilePage = Loadable(lazy(() => import('./pages/account/ProfilePage').then(m => ({ default: m.ProfilePage }))));
const CustomerOrdersPage = Loadable(lazy(() => import('./pages/account/OrdersPage').then(m => ({ default: m.OrdersPage }))));
const OrderDetailsPage = Loadable(lazy(() => import('./pages/account/OrderDetailsPage').then(m => ({ default: m.OrderDetailsPage }))));
const AddressesPage = Loadable(lazy(() => import('./pages/account/AddressesPage').then(m => ({ default: m.AddressesPage }))));

// Admin Pages (Lazy Loaded - kept completely separate from customer bundle)
const DashboardPage = Loadable(lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage }))));
const AdminProductsPage = Loadable(lazy(() => import('./pages/admin/ProductsPage').then(m => ({ default: m.ProductsPage }))));
const AdminCategoriesPage = Loadable(lazy(() => import('./pages/admin/CategoriesPage').then(m => ({ default: m.CategoriesPage }))));
const AdminBrandsPage = Loadable(lazy(() => import('./pages/admin/BrandsPage').then(m => ({ default: m.BrandsPage }))));
const AdminBannersPage = Loadable(lazy(() => import('./pages/admin/BannersPage').then(m => ({ default: m.BannersPage }))));
const AdminOrdersPage = Loadable(lazy(() => import('./pages/admin/OrdersPage').then(m => ({ default: m.OrdersPage }))));
const AdminCustomersPage = Loadable(lazy(() => import('./pages/admin/CustomersPage').then(m => ({ default: m.CustomersPage }))));
const AdminCouponsPage = Loadable(lazy(() => import('./pages/admin/CouponsPage').then(m => ({ default: m.CouponsPage }))));
const AdminInventoryPage = Loadable(lazy(() => import('./pages/admin/InventoryPage').then(m => ({ default: m.InventoryPage }))));
const AdminSettingsPage = Loadable(lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage }))));

export const router = createBrowserRouter([
  // Public Store & Customer Account Routes
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'product/:idOrSlug', element: <ProductDetailsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'order-success/:orderId',
        element: (
          <ProtectedRoute>
            <OrderSuccessPage />
          </ProtectedRoute>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'account/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/orders',
        element: (
          <ProtectedRoute>
            <CustomerOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/addresses',
        element: (
          <ProtectedRoute>
            <AddressesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Protected Admin Dashboard Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'brands', element: <AdminBrandsPage /> },
      { path: 'banners', element: <AdminBannersPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },

  // Catch all unknown routes -> Redirect to Home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

