import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, MessageSquare, Loader2, ClipboardCheck, Clipboard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartCount, cartSubtotal, clearCart } = useCart();
  const { toast } = useToast();

  // Checkout Fields State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('Nigeria');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Execution States
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName || !customerPhone || !deliveryCountry || !deliveryCity || !deliveryAddress) {
      toast("Please fill in all required delivery and contact fields.", "error");
      return;
    }

    setCheckingOut(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.productId,
        selectedSize: item.selectedSize,
        selectedColour: item.selectedColour,
        quantity: item.quantity
      }));

      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        deliveryCountry,
        deliveryCity,
        deliveryAddress,
        notes,
        items: orderItems
      };

      const res = await api.createOrder(payload);
      if (res.success) {
        setOrderSuccess(res.order);
        
        // Track the click event in the DB
        try {
          await api.adminTrackWhatsapp(res.order.id);
        } catch (e) {
          console.error("Failed to track whatsapp click:", e);
        }

        // Open WhatsApp in new tab
        window.open(res.order.whatsappUrl, '_blank');
        
        // Clear local storage guest cart
        clearCart();
        
        toast("Order enquiry registered successfully.", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to submit order checkout.", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCopyMessage = () => {
    if (orderSuccess?.whatsappUrl) {
      // Decode the text query parameter to copy just the message
      const urlObj = new URL(orderSuccess.whatsappUrl);
      const msg = urlObj.searchParams.get('text') || '';
      navigator.clipboard.writeText(msg);
      setCopied(true);
      toast("WhatsApp message copied to clipboard.", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  // SUCCESS STATE VIEW
  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center rounded-none shadow-md">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide">Order Enquiry Created</h1>
        <div className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
          Ref: {orderSuccess.orderReference}
        </div>
        <p className="text-sm text-neutral-500 leading-relaxed font-light">
          Your ARGYR footwear order has been registered. If the browser did not automatically open WhatsApp, click the button below to message us directly.
        </p>

        <div className="flex flex-col gap-2 w-full mt-4">
          <a
            href={orderSuccess.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity flex items-center justify-center gap-2 w-full"
          >
            <MessageSquare size={14} />
            <span>Open WhatsApp Chat</span>
          </a>

          <button
            onClick={handleCopyMessage}
            className="px-8 py-3.5 border-thin text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 w-full cursor-pointer"
          >
            {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
            <span>{copied ? "Copied" : "Copy Order Message"}</span>
          </button>
        </div>
      </div>
    );
  }

  // EMPTY BAG STATE VIEW
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
        <div className="w-12 h-12 text-neutral-300 dark:text-neutral-700 flex items-center justify-center">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-wide">Your bag is empty</h2>
        <p className="text-xs text-neutral-400 leading-relaxed font-light max-w-xs">
          Explore our seasonal sneakers, hand-welted formal oxfords, suedes loafers, and boots collections to find your perfect fit.
        </p>
        <Link
          to="/shop"
          className="mt-2 px-8 py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
      
      {/* Title */}
      <div className="border-thin-b pb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wide">Shopping Bag</h1>
        <span className="text-xs text-neutral-400">Review {cartCount} items in your bag</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: ITEMS LIST (SPAN 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {cart.map(item => {
            const isBulk = item.bulkPrice !== null && item.quantity >= item.bulkMinimumQuantity;
            const itemPrice = isBulk && item.bulkPrice ? item.bulkPrice : item.price;
            const subtotal = itemPrice * item.quantity;

            return (
              <div 
                key={`${item.productId}-${item.selectedSize}`}
                className="flex gap-4 p-4 bg-white dark:bg-neutral-900 border-thin"
              >
                {/* Thumbnail */}
                <div className="w-20 aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 border-thin shrink-0 overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-sm font-semibold text-neutral-950 dark:text-white hover:text-brand-clay dark:hover:text-brand-gold">
                        <Link to={`/shop/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <span className="text-[10px] text-neutral-400 tracking-wider">SKU: {item.sku}</span>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mt-1">Size: {item.selectedSize}</span>
                    </div>

                    {/* Remove Icon */}
                    <button
                      onClick={() => removeFromCart(item.productId, item.selectedSize)}
                      className="p-1 hover:text-red-500 text-neutral-400 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border-thin text-xs">
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.quantity - 1)}
                        className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-3 font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.quantity + 1)}
                        className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    {/* Price and Subtotal */}
                    <div className="flex flex-col items-end gap-0.5">
                      {isBulk && (
                        <span className="text-[9px] bg-brand-clay text-white px-1.5 py-0.5 font-bold uppercase tracking-wider scale-95 shrink-0">
                          Bulk rate applied
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400">
                        {item.quantity} x {formatPrice(itemPrice)}
                      </span>
                      <span className="text-xs font-bold text-neutral-950 dark:text-white">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: GUEST CHECKOUT DETAILS (SPAN 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-6">
          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800">
            Order Review & Guest Checkout
          </h3>

          {/* Pricing Summary */}
          <div className="flex flex-col gap-2 text-xs border-b-[0.5px] pb-4 border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between text-neutral-500">
              <span>Bag Subtotal</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Delivery Cost</span>
              <span className="italic text-[10px]">TBD on WhatsApp</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-neutral-950 dark:text-white mt-1">
              <span>Estimated Total</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
          </div>

          {/* Customer checkout inputs form */}
          <form onSubmit={handleSubmitCheckout} className="flex flex-col gap-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-clay dark:text-brand-gold">
              01. Delivery Details
            </h4>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-neutral-500">WhatsApp Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +2348012345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Email (Optional)</label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Country</label>
                <input
                  type="text"
                  placeholder="Nigeria"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                  className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-neutral-500">City</label>
                <input
                  type="text"
                  placeholder="e.g. Lagos"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Delivery Address</label>
              <input
                type="text"
                placeholder="Street address, apartment details"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Special Notes (Optional)</label>
              <textarea
                placeholder="Preferred delivery time, custom sizing notices..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full h-16 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={checkingOut}
              className="mt-4 py-4 bg-brand-clay text-white text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Processing order...</span>
                </>
              ) : (
                <>
                  <MessageSquare size={14} />
                  <span>Checkout on WhatsApp</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
