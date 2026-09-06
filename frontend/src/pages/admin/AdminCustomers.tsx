import React, { useEffect, useState } from 'react';
import { Search, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCustomers = async (query?: string) => {
    setLoading(true);
    try {
      const res = await api.adminGetCustomers(query);
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err: any) {
      toast("Failed to load customer list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search);
  };

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Customer Directory
          </h1>
          <span className="text-xs text-neutral-400">
            {customers.length} registered customer{customers.length === 1 ? '' : 's'}
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={24} />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-xs text-neutral-400 py-12 text-center">
            No customers found matching the search criteria.
          </p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-[0.5px] border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Contact</th>
                <th className="py-4 px-6">Verification</th>
                <th className="py-4 px-6 text-center">Paid Orders</th>
                <th className="py-4 px-6 text-right">Lifetime Spend</th>
                <th className="py-4 px-6 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {customers.map(cust => (
                <tr key={cust.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider block">
                      {cust.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ID: {cust.id.substring(0, 8)}...
                    </span>
                  </td>

                  <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300">
                    <div>{cust.email}</div>
                    <div className="text-neutral-400 text-[11px]">{cust.phone || 'No phone'}</div>
                  </td>

                  <td className="py-4 px-6">
                    {cust.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5">
                        <CheckCircle2 size={11} />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5">
                        <Clock size={11} />
                        <span>Pending OTP</span>
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center font-bold text-neutral-900 dark:text-white">
                    {cust.totalPaidOrders}
                  </td>

                  <td className="py-4 px-6 text-right font-mono font-bold text-neutral-900 dark:text-white">
                    {formatPrice(cust.totalSpend)}
                  </td>

                  <td className="py-4 px-6 text-right text-neutral-400">
                    {new Date(cust.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
