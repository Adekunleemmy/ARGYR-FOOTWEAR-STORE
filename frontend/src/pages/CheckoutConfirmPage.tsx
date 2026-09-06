import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Package, MessageSquare, ShoppingBag, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { PageTransition } from '../components/PageTransition';

export const CheckoutConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const status = searchParams.get('status') || '';
  const txRef = searchParams.get('tx_ref') || searchParams.get('txRef') || '';
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';

  const [verifying, setVerifying] = useState(true);
  const [verifiedOrder, setVerifiedOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const runVerification = async () => {
      // Check if user cancelled on Flutterwave
      if (status === 'cancelled') {
        setVerifying(false);
        setErrorMessage("Payment was cancelled before completion. Your shopping bag has been preserved.");
        return;
      }

      if (!txRef) {
        setVerifying(false);
        setErrorMessage("Transaction reference missing. If you were charged, please contact ARGYR Concierge.");
        return;
      }

      try {
        const res = await api.verifyFlutterwavePayment(txRef, transactionId);
        if (res.success && res.order) {
          setVerifiedOrder(res.order);
          // Payment confirmed: clear the cart
          clearCart();
        } else {
          setErrorMessage(res.message || "Payment verification could not be confirmed.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to verify transaction with Flutterwave.");
      } finally {
        setVerifying(false);
      }
    };

    runVerification();
  }, [txRef, transactionId, status, clearCart]);

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  // 1. VERIFYING SPINNER STATE
  if (verifying) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-6 py-32 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
            <Loader2 size={32} className="animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Verifying Payment
            </h1>
            <p className="text-xs text-neutral-500 mt-2">
              Confirming transaction with Flutterwave and securing your bespoke footwear order...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 2. SUCCESSFUL ORDER CONFIRMATION
  if (verifiedOrder) {
    const whatsappUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(
      `Hello ARGYR, I just paid for order ${verifiedOrder.orderReference}.`
    )}`;

    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
            <CheckCircle2 size={44} />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-editorial text-neutral-400 font-bold">
              ARGYR FOOTWEAR STORE
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white mt-1">
              Order Confirmed
            </h1>
            <p className="text-sm text-neutral-500 mt-2 max-w-md">
              Thank you for your purchase. Your payment of <strong>{formatPrice(verifiedOrder.totalAmount)}</strong> has been verified and your handcrafted footwear is now entering production.
            </p>
          </div>

          <div className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-3 text-left my-2 shadow-sm">
            <div className="flex items-center justify-between text-xs pb-3 border-b-[0.5px] border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">Order Reference</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">{verifiedOrder.orderReference}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-3 border-b-[0.5px] border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">Estimated Delivery</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{verifiedOrder.estimatedDeliveryTimeframe || '7–14 days'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">Order Status</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                Payment Confirmed
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Link
              to={`/account/orders/${verifiedOrder.id}`}
              className="w-full sm:flex-1 py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Package size={15} />
              <span>Track My Order</span>
            </Link>

            <Link
              to="/shop"
              className="w-full sm:flex-1 py-3.5 border-[0.5px] border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white text-xs uppercase tracking-widest font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>Continue Shopping</span>
            </Link>
          </div>

          <div className="pt-4 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 w-full text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <MessageSquare size={13} />
              <span>Need concierge support? Chat with ARGYR on WhatsApp</span>
            </a>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 3. PAYMENT FAILED / CANCELLED STATE
  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <XCircle size={36} />
        </div>

        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Payment Unsuccessful
          </h1>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            {errorMessage || "We were unable to complete your Flutterwave transaction. No charges were finalized."}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2">
          <Link
            to="/cart"
            className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Return to Checkout & Try Again</span>
          </Link>

          <a
            href="https://wa.me/2348000000000?text=Hello%20ARGYR,%20I%20experienced%20an%20issue%20during%20Flutterwave%20payment."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 pt-2"
          >
            <MessageSquare size={13} />
            <span>Report payment issue to Concierge</span>
          </a>
        </div>
      </div>
    </PageTransition>
  );
};
