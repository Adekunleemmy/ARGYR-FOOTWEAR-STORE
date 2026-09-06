import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Scissors,
  CreditCard,
  MessageSquare,
  Loader2,
  Calendar,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { PageTransition } from '../../components/PageTransition';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const res = await api.getCustomerOrderDetail(id);
        if (res.success) {
          setOrder(res.order);
        } else {
          setError(res.message || "Unable to load order details.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={28} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <HelpCircle size={40} className="mx-auto text-neutral-400 mb-4" />
        <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Order Not Found
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          {error || "The requested order could not be retrieved."}
        </p>
        <Link
          to="/account/orders"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={14} />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  // Timeline stage sequence
  const timelineStages = [
    { key: 'ORDER_PLACED', label: 'Order Placed', icon: Clock },
    { key: 'PAID', label: 'Payment Confirmed', icon: CreditCard },
    { key: 'IN_PRODUCTION', label: 'In Production', icon: Scissors },
    { key: 'READY_FOR_SHIPPING', label: 'Ready for Shipping', icon: Package },
    { key: 'SHIPPED', label: 'Dispatched', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
  ];

  // Map database status to stage index
  const getStageIndex = (status: string): number => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 0;
      case 'PAID':
      case 'CONFIRMED':
        return 1;
      case 'IN_PRODUCTION':
        return 2;
      case 'READY_FOR_SHIPPING':
        return 3;
      case 'SHIPPED':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(order.status);

  // WhatsApp contextual help link
  const whatsappUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(
    `Hello ARGYR, I would like to ask about my order ${order.orderReference}.`
  )}`;

  return (
    <PageTransition>
      <div className="flex flex-col gap-10">
        {/* Navigation Breadcrumb & Title */}
        <div className="flex flex-col gap-3">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[0.5px] border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tracking-wide">
                  {order.orderReference}
                </h1>
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-xs text-neutral-400 mt-1 block">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Contextual WhatsApp Support */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border-[0.5px] border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              <MessageSquare size={14} />
              <span>Ask About Order on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 1. VISUAL ORDER PROGRESS TIMELINE */}
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-8">
            Order Progress
          </h2>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            {timelineStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                      isCompleted
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                        : isCurrent
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-900 dark:border-white shadow-md'
                        : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-700 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>

                  <div className="text-left md:text-center">
                    <span
                      className={`text-xs uppercase tracking-wider block font-semibold ${
                        isCurrent
                          ? 'text-neutral-900 dark:text-white font-bold'
                          : isCompleted
                          ? 'text-neutral-800 dark:text-neutral-200'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Communicated Estimated Delivery Timeframe */}
          <div className="mt-8 pt-6 border-t-[0.5px] border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Estimated Delivery Window: <strong className="text-neutral-900 dark:text-white">{order.estimatedDeliveryTimeframe || '7–14 days'}</strong></span>
            </span>
            <span className="text-[11px] text-neutral-400">
              Each pair is meticulously handcrafted to bespoke standards.
            </span>
          </div>

          {/* Customer-facing notes history */}
          {order.statusHistory?.length > 0 && (
            <div className="mt-6 pt-6 border-t-[0.5px] border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-3">
                Tracking Updates
              </span>
              <div className="flex flex-col gap-2">
                {order.statusHistory
                  .filter((h: any) => h.customerNote)
                  .map((h: any) => (
                    <div key={h.id} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                      <span className="font-mono text-[10px] text-neutral-400 shrink-0 mt-0.5">
                        {new Date(h.createdAt).toLocaleDateString()}:
                      </span>
                      <span>{h.customerNote}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. ORDER DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: PRODUCTS LIST (SPAN 7) */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-6">
              Purchased Footwear ({order.items?.length})
            </h2>

            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-4 flex gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 overflow-hidden shrink-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 font-bold">
                          ARGYR
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        Size: <strong className="text-neutral-700 dark:text-neutral-300">{item.selectedSize}</strong>
                        {item.selectedColour ? ` | Colour: ${item.selectedColour}` : ''}
                      </p>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {formatPrice(item.subtotal || item.estimatedSubtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SUMMARY & DELIVERY DETAILS (SPAN 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Price Breakdown */}
            <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-4">
                Payment Summary
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="text-neutral-900 dark:text-white font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping ({order.shippingMethodName || 'Standard'})</span>
                  <span className="text-neutral-900 dark:text-white font-medium">{formatPrice(order.shippingCost || 0)}</span>
                </div>

                <div className="pt-3 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 flex justify-between text-sm font-bold">
                  <span className="text-neutral-900 dark:text-white uppercase tracking-wider">Total</span>
                  <span className="text-neutral-900 dark:text-white">
                    {formatPrice(order.totalAmount || order.estimatedTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-[0.5px] border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Payment Status</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {order.isPaid ? "Paid in Full" : "Pending Payment"}
                </span>
              </div>
            </div>

            {/* Delivery Information Snapshot */}
            <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-4 flex items-center gap-1.5">
                <MapPin size={14} />
                <span>Delivery Address</span>
              </h2>

              <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                <p className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  {order.customerName}
                </p>
                <p className="mt-1">{order.deliveryAddress}</p>
                <p>
                  {order.deliveryCity}
                  {order.deliveryState ? `, ${order.deliveryState}` : ''}
                  {order.deliveryPostalCode ? ` ${order.deliveryPostalCode}` : ''}
                </p>
                <p>{order.deliveryCountry}</p>
                <p className="mt-2 text-neutral-500">Phone: {order.customerPhone}</p>
                {order.deliveryInstructions && (
                  <p className="mt-2 text-[11px] text-neutral-400 italic">
                    Instructions: "{order.deliveryInstructions}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
