import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { CustomRequestWizard } from './pages/CustomRequestWizard';
import { CartPage } from './pages/CartPage';
import { About } from './pages/About';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomRequests } from './pages/admin/AdminCustomRequests';
import { AdminSettings } from './pages/admin/AdminSettings';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <ThemeProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-neutral-800 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
              {/* Navbar with Search toggle hook */}
              <Navbar onSearchToggle={() => setSearchOpen(!searchOpen)} />
              
              <main className="flex-grow flex flex-col">
                <Routes>
                  {/* Public Client Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop searchOpen={searchOpen} onSearchClose={() => setSearchOpen(false)} />} />
                  <Route path="/shop/:slug" element={<ProductDetail />} />
                  <Route path="/custom" element={<CustomRequestWizard />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/about" element={<About />} />

                  {/* Admin Gateway Authentication */}
                  <Route path="/admin" element={<AdminLogin />} />

                  {/* Protected Admin Routing Tree */}
                  <Route path="/admin/dashboard" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/edit/:id" element={<AdminProductForm />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="custom-requests" element={<AdminCustomRequests />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Minimal Editorial Footer */}
              <Footer />
            </div>
          </Router>
        </ToastProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
