import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  bulkPrice: number | null;
  bulkMinimumQuantity: number;
  selectedSize: string;
  selectedColour: string | null;
  quantity: number;
  imageUrl: string;
  slug: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('argyr_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cart local storage:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('argyr_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      // Check if product with identical ID and size already exists in cart
      const existingIndex = prev.findIndex(
        item => item.productId === newItem.productId && item.selectedSize === newItem.selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Compute total number of items
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Compute subtotal on client side (using bulk pricing triggers where applicable)
  const cartSubtotal = cart.reduce((total, item) => {
    const isBulk = item.bulkPrice !== null && item.quantity >= item.bulkMinimumQuantity;
    const activePrice = isBulk && item.bulkPrice ? item.bulkPrice : item.price;
    return total + (activePrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
