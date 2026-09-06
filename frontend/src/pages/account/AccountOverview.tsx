import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, MessageSquare, Loader2, Clock } from 'lucide-react';
import { api } from '../../services/api';

export const AccountOverview: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          api.getCustomerProfile(),
          api.getCustomerOrders()
        ]);

        if (profileRes.success) setProfile(profileRes.customer);
        if (ordersRes.success) setRecentOrders(ordersRes.orders.slice(0, 3));
      } catch (err) {
        console.error("Failed to load customer account overview:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    );
  }

  const defaultAddress = profile?.addresses?.find((a: any) => a.isDefault) || profile?.addresses?.[0];

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: "Payment Confirmed", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      CONFIRMED: { label: "Order Confirmed", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      IN_PRODUCTION: { label: "In Production", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
      READY_FOR_SHIPPING: { label: "Ready to Ship", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
      SHIPPED: { label: "Dispatched", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
      DELIVERED: { label: "Delivered", style: "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/20" },
      PENDING_PAYMENT: { label: "Awaiting Payment", style: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
      CANCELLED: { label: "Cancelled", style: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" }
    };

    const conf = map[status] || { label: status, style: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" };
    return (
      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider border-[0.5px] ${conf.style}`}>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Quick KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Total Purchases</span>
          <div className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {profile?._count?.orders || 0}
          </div>
          <Link
            to="/account/orders"
            className="text-xs uppercase tracking-wider font-semibold text-neutral-500 hover:text-neutral-950 dark:hover:text-white mt-4 flex items-center gap-1.5 transition-colors"
          >
            <span>View all orders</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Default Delivery</span>
          <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">
            {defaultAddress ? (
              <>
                <p className="font-semibold text-neutral-900 dark:text-white">{defaultAddress.recipientName}</p>
                <p className="text-neutral-500">{defaultAddress.addressLine}, {defaultAddress.city}</p>
              </>
            ) : (
              <p className="text-neutral-400 italic">No saved address yet.</p>
            )}
          </div>
          <Link
            to="/account/profile"
            className="text-xs uppercase tracking-wider font-semibold text-neutral-500 hover:text-neutral-950 dark:hover:text-white mt-4 flex items-center gap-1.5 transition-colors"
          >
            <span>Manage addresses</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Bespoke Concierge</span>
          <p className="text-xs text-neutral-500 mt-2">
            Have questions regarding sizing, custom leathers or your delivery schedule?
          </p>
          <a
            href="https://wa.me/2348000000000?text=Hello%20ARGYR,%20I%20need%20assistance%20with%20my%20customer%20account."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider font-semibold text-neutral-900 dark:text-white mt-4 flex items-center gap-1.5 hover:underline"
          >
            <MessageSquare size={13} />
            <span>Chat via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 2. Recent Orders Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
            Recent Orders
          </h2>
          {recentOrders.length > 0 && (
            <Link
              to="/account/orders"
              className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              View all ({profile?._count?.orders || recentOrders.length}) →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-12 text-center flex flex-col items-center gap-4">
            <Package size={36} className="text-neutral-300 dark:text-neutral-700" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
              No Purchases Yet
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm">
              Discover our latest handcrafted collections and bespoke shoe releases.
            </p>
            <Link
              to="/shop"
              className="mt-2 px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {order.orderReference}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    {order.items?.slice(0, 4).map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-10 h-10 border-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 overflow-hidden shrink-0"
                        title={`${it.productName} (Size ${it.selectedSize})`}
                      >
                        {it.productImage ? (
                          <img src={it.productImage} alt={it.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">
                            ARG
                          </div>
                        )}
                      </div>
                    ))}
                    <span className="text-xs text-neutral-500 pl-2">
                      {order.items?.length} item{order.items?.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-neutral-400 block">Total Amount</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {formatPrice(order.totalAmount || order.estimatedTotal)}
                    </span>
                  </div>

                  <Link
                    to={`/account/orders/${order.id}`}
                    className="px-4 py-2 border-[0.5px] border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white text-[11px] uppercase tracking-widest font-semibold transition-colors"
                  >
                    View Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
