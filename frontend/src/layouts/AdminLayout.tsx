import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, FolderOpen, Sliders, LogOut, Loader2, Sparkles, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const AdminLayout: React.FC = () => {
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.adminMe();
        if (res.success) {
          setAdmin(res.admin);
        } else {
          navigate('/admin', { replace: true });
        }
      } catch (err) {
        navigate('/admin', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen to unauthorized events from fetch wrapper
    const handleUnauthorized = () => {
      toast("Session expired. Please sign in again.", "error");
      navigate('/admin', { replace: true });
    };

    window.addEventListener('argyr_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('argyr_unauthorized', handleUnauthorized);
    };
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await api.adminLogout();
      toast("Admin signed out successfully.", "success");
      navigate('/admin', { replace: true });
    } catch (err) {
      toast("Logout failed.", "error");
    }
  };

  const menuItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutGrid },
    { label: 'Products', path: '/admin/dashboard/products', icon: ShoppingBag },
    { label: 'Categories', path: '/admin/dashboard/categories', icon: FolderOpen },
    { label: 'Orders', path: '/admin/dashboard/orders', icon: FileSpreadsheet },
    { label: 'Custom requests', path: '/admin/dashboard/custom-requests', icon: Sparkles },
    { label: 'Settings', path: '/admin/dashboard/settings', icon: Sliders }
  ];

  const isLinkActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-neutral-600 dark:text-neutral-400" size={32} />
          <span className="text-xs uppercase tracking-widest text-neutral-500">Validating console key...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-thin-r flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Admin Identity Header */}
          <div className="p-6 border-thin-b flex flex-col gap-1">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-white">
              ARGYR Console
            </h2>
            {admin && (
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Active: {admin.name}
              </span>
            )}
          </div>

          {/* Links navigation list */}
          <nav className="p-4 flex flex-col gap-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
                    active
                      ? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950 font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Sign out button */}
        <div className="p-4 border-thin-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border-thin text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
