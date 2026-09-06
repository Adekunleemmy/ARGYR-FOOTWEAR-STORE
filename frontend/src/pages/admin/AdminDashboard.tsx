import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, CreditCard, User, ArrowRight, Loader2, Scissors } from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.adminGetDashboardStats();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    );
  }

  if (!data) return <p className="text-sm text-neutral-500">Failed to load statistics.</p>;

  const { stats, recentOrders, recentCustomRequests } = data;

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const cards = [
    {
      label: 'Verified Paid Revenue',
      value: formatPrice(stats.totalPaidRevenue || 0),
      desc: 'Settled via Flutterwave & confirmed',
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      label: 'Registered Customers',
      value: stats.totalCustomers || 0,
      desc: 'Active customer accounts',
      icon: User,
      color: 'text-blue-500'
    },
    {
      label: 'Orders In Production',
      value: stats.inProductionOrdersCount || 0,
      desc: `${stats.shippedOrdersCount || 0} dispatched / in transit`,
      icon: Scissors,
      color: 'text-amber-500'
    },
    {
      label: 'Product Catalogue',
      value: stats.totalProducts || 0,
      desc: `${stats.activeProducts} active, ${stats.outOfStockProducts} out of stock`,
      icon: ShoppingBag,
      color: 'text-neutral-900 dark:text-white'
    }
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Atelier Dashboard
        </h1>
        <span className="text-xs text-neutral-400">Live ecommerce metrics, production schedules and customer activity</span>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-neutral-900 p-6 border-[0.5px] border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                  {c.label}
                </span>
                <Icon size={16} className={c.color} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                  {c.value}
                </span>
                <span className="text-[10px] text-neutral-400 leading-normal">
                  {c.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Recent Activity list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* RECENT ECOMMERCE ORDERS */}
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-baseline justify-between border-b-[0.5px] border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Recent Ecommerce Purchases
            </h3>
            <Link to="orders" className="text-[10px] uppercase font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={10} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No orders registered yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((ord: any) => (
                <div key={ord.id} className="flex justify-between items-center text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-neutral-900 dark:text-white tracking-wider font-mono">
                      {ord.orderReference}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {ord.customerName} &bull; {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-bold font-mono">
                      {formatPrice(ord.totalAmount || ord.estimatedTotal)}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                      ord.status === 'PAID' || ord.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                      ord.status === 'IN_PRODUCTION' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' :
                      ord.status === 'SHIPPED' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                      'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT BESPOKE CUSTOM REQUESTS */}
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-baseline justify-between border-b-[0.5px] border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Recent Custom Shoe Requests
            </h3>
            <Link to="custom-requests" className="text-[10px] uppercase font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={10} />
            </Link>
          </div>

          {recentCustomRequests.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No custom requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentCustomRequests.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-neutral-900 dark:text-white tracking-wider font-mono">
                      {req.requestReference}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {req.customerName} &bull; {req.categoryName} (Size {req.shoeSize})
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                      Qty: {req.quantity}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                      req.status === 'NEW' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400' :
                      req.status === 'REVIEWING' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' :
                      req.status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                      'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
