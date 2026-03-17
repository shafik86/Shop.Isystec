import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

// Customer pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import Account from './pages/Account';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductEdit from './pages/admin/ProductEdit';
import ProductCreate from './pages/admin/ProductCreate';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminVouchers from './pages/admin/Vouchers';
import AdminPaymentGateways from './pages/admin/PaymentGateways';
import AdminSettings from './pages/admin/Settings';

function StoreLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function AdminPage({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer */}
          <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
          <Route path="/products/:slug" element={<StoreLayout><ProductDetail /></StoreLayout>} />
          <Route path="/cart" element={<StoreLayout><ProtectedRoute><Cart /></ProtectedRoute></StoreLayout>} />
          <Route path="/checkout" element={<StoreLayout><ProtectedRoute><Checkout /></ProtectedRoute></StoreLayout>} />
          <Route path="/order-success" element={<StoreLayout><ProtectedRoute><OrderSuccess /></ProtectedRoute></StoreLayout>} />
          <Route path="/orders" element={<StoreLayout><ProtectedRoute><OrderHistory /></ProtectedRoute></StoreLayout>} />
          <Route path="/account" element={<StoreLayout><ProtectedRoute><Account /></ProtectedRoute></StoreLayout>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
          <Route path="/admin/products" element={<AdminPage><AdminProducts /></AdminPage>} />
          <Route path="/admin/products/new" element={<AdminPage><ProductCreate /></AdminPage>} />
          <Route path="/admin/products/:id" element={<AdminPage><ProductEdit /></AdminPage>} />
          <Route path="/admin/categories" element={<AdminPage><AdminCategories /></AdminPage>} />
          <Route path="/admin/orders" element={<AdminPage><AdminOrders /></AdminPage>} />
          <Route path="/admin/vouchers" element={<AdminPage><AdminVouchers /></AdminPage>} />
          <Route path="/admin/payment-gateways" element={<AdminPage><AdminPaymentGateways /></AdminPage>} />
          <Route path="/admin/settings" element={<AdminPage><AdminSettings /></AdminPage>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
