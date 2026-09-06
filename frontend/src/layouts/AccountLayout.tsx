import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, Settings, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { PageTransition } from '../components/PageTransition';

export const AccountLayout: React.FC = () => {
  const { customer, isAuthenticated, isLoading, openAuthModal } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal('login');
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, openAuthModal, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return null;
  }

  const tabs = [
    { label: 'Overview', path: '/account', icon: User },
    { label: 'My Orders', path: '/account/orders', icon: Package },
    { label: 'Profile & Addresses', path: '/account/profile', icon: Settings }
  ];

  const isTabActive = (path: string) => {
    if (path === '/account') {
      return location.pathname === '/account' || location.pathname === '/account/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Customer Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-[0.5px] border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-editorial text-neutral-400 font-bold">
              ARGYR CIRCLE
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white mt-1">
              Welcome, {customer.firstName}
            </h1>
            <span className="text-xs text-neutral-500 font-mono">
              Member ID: {customer.id.substring(0, 8)}... | {customer.email}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-[0.5px] border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = isTabActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Nested Content Area */}
        <div className="pt-2">
          <Outlet />
        </div>
      </div>
    </PageTransition>
  );
};
