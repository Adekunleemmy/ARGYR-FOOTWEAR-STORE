import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export const FloatingCheckoutButton: React.FC = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Hidden on checkout, confirmation, and admin portals
  const isHiddenRoute =
    location.pathname === '/cart' ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/admin');

  // Trigger a subtle pulse animation whenever items are added
  useEffect(() => {
    if (cartCount > 0) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  if (cartCount === 0 || isHiddenRoute) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isHighlighted ? 1.05 : 1,
          transition: { type: 'spring', stiffness: 350, damping: 25 }
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40"
      >
        <Link
          to="/cart"
          aria-label="Proceed to checkout"
          className={`inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg transition-all duration-200 border text-xs uppercase tracking-widest font-semibold font-sans ${
            isHighlighted
              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 ring-2 ring-brand-clay dark:ring-neutral-200 border-transparent shadow-neutral-950/30'
              : 'bg-neutral-900 text-neutral-50 hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white border-neutral-800 dark:border-neutral-200/80 shadow-neutral-950/20'
          }`}
        >
          Checkout
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};
