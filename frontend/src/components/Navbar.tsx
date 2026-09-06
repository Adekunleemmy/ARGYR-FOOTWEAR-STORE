import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sun, Moon, Menu, X, Search, User, LogOut, Package, Settings } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

interface NavbarProps {
  onSearchToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { customer, isAuthenticated, openAuthModal, logout } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Custom Studio', path: '/custom' },
    { label: 'Our Story', path: '/about' }
  ];

  const isActive = (path: string) => location.pathname === path;

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setAccountDropdownOpen(!accountDropdownOpen);
    } else {
      openAuthModal('login');
    }
  };

  const handleSignOut = async () => {
    setAccountDropdownOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-50/80 backdrop-blur-md dark:bg-neutral-950/80 border-b-[0.5px] border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left Side: Mobile Menu Trigger & Brand logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link 
            to="/" 
            className="text-2xl font-editorial tracking-[0.25em] font-bold text-neutral-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            ARGYR
          </Link>
        </div>

        {/* Center: Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm uppercase tracking-widest transition-colors ${
                isActive(link.path)
                  ? 'text-neutral-950 dark:text-white font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side: Search, Theme, Customer Account, Cart */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={onSearchToggle}
            className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
            title="Search products"
          >
            <Search size={18} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Customer Account Trigger & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleAccountClick}
              className={`p-2.5 transition-colors flex items-center gap-1.5 ${
                isAuthenticated
                  ? 'text-neutral-950 dark:text-white font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
              title={isAuthenticated ? `Account: ${customer?.firstName}` : "Sign In / Register"}
              aria-label="Account"
            >
              <User size={18} />
              {isAuthenticated && customer && (
                <span className="hidden xl:inline text-xs uppercase tracking-wider font-semibold">
                  {customer.firstName}
                </span>
              )}
            </button>

            {/* Account Dropdown Menu */}
            {isAuthenticated && accountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="px-4 py-2.5 border-b-[0.5px] border-neutral-100 dark:border-neutral-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 dark:text-white truncate">
                    {customer?.firstName} {customer?.lastName}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">{customer?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/account"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <User size={14} />
                    <span>Overview</span>
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Package size={14} />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    to="/account/profile"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Settings size={14} />
                    <span>Profile & Addresses</span>
                  </Link>
                </div>

                <div className="pt-1 border-t-[0.5px] border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Bag */}
          <Link
            to="/cart"
            className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors relative"
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-none font-bold uppercase tracking-tighter">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6 py-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg uppercase tracking-widest border-b-[0.5px] pb-3 ${
                isActive(link.path)
                  ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-medium'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Account Links */}
          <div className="pt-2 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-widest text-neutral-800 dark:text-neutral-200 flex items-center gap-2"
                >
                  <Package size={16} />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/account/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-widest text-neutral-800 dark:text-neutral-200 flex items-center gap-2"
                >
                  <Settings size={16} />
                  <span>Profile & Addresses</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="text-sm uppercase tracking-widest text-red-500 text-left flex items-center gap-2 pt-2"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="py-3 text-center bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
