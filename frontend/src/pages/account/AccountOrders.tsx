import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const AccountOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.getCustomerOrders();
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: "Payment Confirmed", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      CONFIRMED: { label: "Confirmed", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      IN_PRODUCTION: { label: "In Production", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
      READY_FOR_SHIPPING: { label: "Ready to Ship", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
      SHIPPED: { label: "Shipped", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
      DELIVERED: { label: "Delivered", style: "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/20" },
      PENDING_PAYMENT: { label: "Pending Payment", style: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
      CANCELLED: { label: "Cancelled", style: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" }
    };

    const conf = map[status] || { label: status, style: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" };
    return (
      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider border-[0.5px] ${conf.style}`}>
        {conf.label}
      </span>
    );
  };

  const filterOptions = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Delivered', value: 'DELIVERED' }
  ];

  const filteredOrders = orders.filter(ord => {
    if (filter === 'ALL') return true;
    if (filter === 'DELIVERED') return ord.status === 'DELIVERED';
    if (filter === 'IN_PROGRESS') {
      return ['PAID', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_SHIPPING', 'SHIPPED'].includes(ord.status);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
            Purchase History
          </h2>
          <span className="text-xs text-neutral-400">
            {orders.length} total order{orders.length === 1 ? '' : 's'} registered
          </span>
        </div>

        <div className="flex items-center gap-2">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider font-semibold border-[0.5px] transition-colors ${
                filter === opt.value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-16 text-center flex flex-col items-center gap-4">
          <Package size={40} className="text-neutral-300 dark:text-neutral-700" />
          <h3 className="text-sm uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
            No Orders Found
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm">
            {filter === 'ALL'
              ? "You have not placed any orders yet. Visit our shop to explore handcrafted footwear."
              : "No orders match the selected filter criteria."}
          </p>
          <Link
            to="/shop"
            className="mt-2 px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
          >
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                    {order.orderReference}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>

                {/* Thumbnails of items */}
                <div className="flex items-center gap-2 mt-2">
                  {order.items?.map((it: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-12 h-12 border-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 overflow-hidden shrink-0"
                      title={`${it.productName} (Size ${it.selectedSize})`}
                    >
                      {it.productImage ? (
                        <img src={it.productImage} alt={it.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                          ARG
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pl-2">
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium block">
                      {order.items?.length} item{order.items?.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[11px] text-neutral-400 truncate max-w-xs block">
                      {order.items?.map((i: any) => i.productName).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-400 block">Total</span>
                  <span className="text-base font-bold text-neutral-900 dark:text-white">
                    {formatPrice(order.totalAmount || order.estimatedTotal)}
                  </span>
                </div>

                <Link
                  to={`/account/orders/${order.id}`}
                  className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
