import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, FileText, Sparkles, FolderOpen, ArrowRight, Loader2 } from 'lucide-react';
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

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, desc: `${stats.activeProducts} active, ${stats.outOfStockProducts} out of stock`, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'New Order Enquiries', value: stats.newOrders, desc: 'Awaiting WhatsApp confirmation', icon: FileText, color: 'text-yellow-500' },
    { label: 'Custom Shoe Requests', value: stats.pendingCustomRequests, desc: 'Awaiting design review', icon: Sparkles, color: 'text-purple-500' },
    { label: 'Completed Orders', value: stats.completedOrders, desc: 'Successfully finalized orders', icon: FolderOpen, color: 'text-green-500' }
  ];

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Atelier Dashboard</h1>
        <span className="text-xs text-neutral-400">Live operational overview</span>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-neutral-900 p-6 border-thin flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-450 dark:text-neutral-400">
                  {c.label}
                </span>
                <Icon size={16} className={c.color} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
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
        
        {/* RECENT STANDARD ORDERS (ENQUIRIES) */}
        <div className="bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-4">
          <div className="flex items-baseline justify-between border-thin-b pb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Recent Order Enquiries
            </h3>
            <Link to="orders" className="text-[10px] uppercase font-bold hover:text-brand-clay dark:hover:text-brand-gold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={10} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No orders registered yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((ord: any) => (
                <div key={ord.id} className="flex justify-between items-center text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border-thin">
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
                      ₦{Number(ord.estimatedTotal).toLocaleString()}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                      ord.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                      ord.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-neutral-200 text-neutral-800'
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
        <div className="bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-4">
          <div className="flex items-baseline justify-between border-thin-b pb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Recent Custom Requests
            </h3>
            <Link to="custom-requests" className="text-[10px] uppercase font-bold hover:text-brand-clay dark:hover:text-brand-gold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={10} />
            </Link>
          </div>

          {recentCustomRequests.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No custom requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentCustomRequests.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border-thin">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-neutral-900 dark:text-white tracking-wider font-mono">
                      {req.requestReference}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {req.customerName} &bull; {req.categoryName} ({req.shoeSize})
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                      Qty: {req.quantity}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                      req.status === 'NEW' ? 'bg-purple-100 text-purple-800' :
                      req.status === 'REVIEWING' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      'bg-neutral-200 text-neutral-800'
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
