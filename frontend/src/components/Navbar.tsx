import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sun, Moon, Menu, X, Search } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  onSearchToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Custom Studio', path: '/custom' },
    { label: 'Our Story', path: '/about' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-neutral-50/80 backdrop-blur-md dark:bg-neutral-950/80 border-b-[0.5px] border-neutral-200 dark:border-neutral-800">
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
                  ? 'text-brand-clay dark:text-brand-gold font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side: Search, Theme, Cart */}
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
                  ? 'border-brand-clay text-brand-clay dark:border-brand-gold dark:text-brand-gold font-medium'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
