import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export const FloatingCheckoutButton: React.FC = () => {
  const { cartCount, cartSubtotal } = useCart();
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
      const timer = setTimeout(() => setIsHighlighted(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [cartCount, cartSubtotal]);

  if (cartCount === 0 || isHiddenRoute) {
    return null;
  }

  const formattedSubtotal = '₦' + Number(cartSubtotal).toLocaleString('en-NG');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isHighlighted ? 1.04 : 1,
          transition: { type: 'spring', stiffness: 350, damping: 25 }
        }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 group"
      >
        <Link
          to="/cart"
          aria-label={`Proceed to checkout with ${cartCount} items totaling ${formattedSubtotal}`}
          className={`flex items-center gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 border ${
            isHighlighted
              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 ring-2 ring-brand-clay dark:ring-neutral-200 border-transparent shadow-neutral-950/30'
              : 'bg-neutral-900 text-neutral-50 hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white border-neutral-700/60 dark:border-neutral-300/80 shadow-neutral-950/20'
          }`}
        >
          {/* Bag Icon & Badge */}
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-brand-clay dark:bg-neutral-900 text-white dark:text-neutral-100 text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-neutral-700 dark:bg-neutral-300 opacity-60" />

          {/* Content */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase font-sans">
              Checkout
            </span>
            <span className="text-xs sm:text-sm font-mono opacity-90">
              • {formattedSubtotal}
            </span>
          </div>

          {/* Arrow */}
          <div className="w-6 h-6 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 flex items-center justify-center transition-transform group-hover:translate-x-1 ml-0.5">
            <ArrowRight size={13} />
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};
