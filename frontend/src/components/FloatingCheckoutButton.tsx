import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
      const timer = setTimeout(() => setIsHighlighted(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  if (cartCount === 0 || isHiddenRoute) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.92 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isHighlighted ? 1.05 : 1,
          transition: { type: 'spring', stiffness: 380, damping: 24 }
        }}
        exit={{ opacity: 0, y: 20, scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 group"
      >
        <Link
          to="/cart"
          aria-label={`Proceed to checkout with ${cartCount} items`}
          className="relative inline-flex items-center gap-2 pl-4 pr-3 py-2 sm:py-2.5 rounded-full shadow-xl transition-all duration-300 border bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-700/60 dark:border-neutral-200/90 shadow-black/25 hover:shadow-2xl"
        >
          {/* Subtle pulse ping when item is added */}
          {isHighlighted && (
            <span className="absolute inset-0 rounded-full ring-2 ring-brand-clay animate-ping opacity-60 pointer-events-none" />
          )}

          {/* Text */}
          <span className="text-xs uppercase tracking-wider font-semibold font-sans select-none">
            Checkout
          </span>

          {/* Notification Counter Badge */}
          <motion.span
            key={cartCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-brand-clay text-white dark:bg-brand-clay dark:text-white shadow-sm leading-none"
          >
            {cartCount}
          </motion.span>

          {/* Animated Arrow */}
          <motion.span
            animate={{ x: [0, 3, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: 'easeInOut'
            }}
            className="flex items-center justify-center text-neutral-300 dark:text-neutral-600 group-hover:text-white dark:group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-colors"
          >
            <ArrowRight size={13} className="stroke-[2.5]" />
          </motion.span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};
