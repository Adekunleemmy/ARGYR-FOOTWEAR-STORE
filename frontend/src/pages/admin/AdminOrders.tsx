import React, { useEffect, useState } from 'react';
import {
  Loader2,
  MessageSquare,
  Search,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Status update form inside modal
  const [newStatus, setNewStatus] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.adminGetOrders(params);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      toast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleOpenDetail = async (orderId: string) => {
    try {
      const res = await api.adminGetOrderDetail(orderId);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setNewStatus(res.order.status);
        setInternalNote('');
        setCustomerNote('');
      }
    } catch (err: any) {
      toast("Failed to load order details.", "error");
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const res = await api.adminUpdateOrderStatus(selectedOrder.id, {
        status: newStatus,
        internalNote: internalNote || undefined,
        customerNote: customerNote || undefined
      });

      if (res.success) {
        toast(`Order status updated to ${newStatus}.`, "success");
        // Reload detail to reflect updated status history
        await handleOpenDetail(selectedOrder.id);
        // Update list
        setOrders(prev =>
          prev.map(o => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err: any) {
      toast(err.message || "Failed to update order status.", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenWhatsApp = (ord: any) => {
    const phoneClean = ord.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(
      `Hello ${ord.customerName}, this is ARGYR Footwear regarding your order ${ord.orderReference}.`
    )}`;
    window.open(url, '_blank');
  };

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: "Paid", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      CONFIRMED: { label: "Confirmed", style: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      IN_PRODUCTION: { label: "In Production", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
      READY_FOR_SHIPPING: { label: "Ready to Ship", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
      SHIPPED: { label: "Shipped", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
      DELIVERED: { label: "Delivered", style: "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/20" },
      PENDING_PAYMENT: { label: "Pending Payment", style: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
      CANCELLED: { label: "Cancelled", style: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
      NEW: { label: "Legacy Enquiry", style: "bg-neutral-100 text-neutral-500" }
    };

    const conf = map[status] || { label: status, style: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" };
    return (
      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border-[0.5px] ${conf.style}`}>
        {conf.label}
      </span>
    );
  };

  const statusOptions = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
    { label: 'Paid / Confirmed', value: 'PAID' },
    { label: 'In Production', value: 'IN_PRODUCTION' },
    { label: 'Ready to Ship', value: 'READY_FOR_SHIPPING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Order Management
          </h1>
          <span className="text-xs text-neutral-400">
            Fulfill and track customer purchases, payment verification and production schedules
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, customer, phone..."
            className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider font-semibold border-[0.5px] transition-colors whitespace-nowrap ${
              statusFilter === opt.value
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={24} />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-xs text-neutral-400 py-12 text-center">
            No orders found matching this filter criteria.
          </p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-[0.5px] border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Reference</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Items</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {orders.map(ord => (
                <tr key={ord.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold text-neutral-900 dark:text-white block">
                      {ord.orderReference}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                    <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      {ord.customerName}
                    </div>
                    <div className="text-[11px] text-neutral-400">{ord.customerPhone}</div>
                  </td>

                  <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300">
                    {ord.items?.length || 0} pair(s)
                  </td>

                  <td className="py-4 px-6 font-mono font-bold text-neutral-900 dark:text-white">
                    {formatPrice(ord.totalAmount || ord.estimatedTotal)}
                  </td>

                  <td className="py-4 px-6">
                    {getStatusBadge(ord.status)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleOpenDetail(ord.id)}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[11px] uppercase tracking-wider font-bold hover:opacity-85 transition-opacity"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b-[0.5px] border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                    {selectedOrder.orderReference}
                  </h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <span className="text-xs text-neutral-400">
                  Booked on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs">
              {/* Customer & Delivery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 dark:bg-neutral-950 p-4 border-[0.5px] border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Customer Details</span>
                  <p className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">{selectedOrder.customerName}</p>
                  <p className="text-neutral-500">{selectedOrder.customerEmail || 'No email registered'}</p>
                  <p className="text-neutral-500">Phone: {selectedOrder.customerPhone}</p>
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(selectedOrder)}
                    className="mt-2 text-green-600 dark:text-green-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    <span>Contact Customer via WhatsApp</span>
                  </button>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Delivery Destination</span>
                  <p className="text-neutral-800 dark:text-neutral-200">{selectedOrder.deliveryAddress}</p>
                  <p className="text-neutral-500">
                    {selectedOrder.deliveryCity}
                    {selectedOrder.deliveryState ? `, ${selectedOrder.deliveryState}` : ''}, {selectedOrder.deliveryCountry}
                  </p>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Shipping Region: <strong className="text-neutral-700 dark:text-neutral-300">{selectedOrder.shippingMethodName || 'Standard'}</strong> ({formatPrice(selectedOrder.shippingCost || 0)})
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-3">Purchased Items</span>
                <div className="border-[0.5px] border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {selectedOrder.items?.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                          {it.productImage ? (
                            <img src={it.productImage} alt={it.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">ARG</div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider block">{it.productName}</span>
                          <span className="text-[11px] text-neutral-400">Size: {it.selectedSize} {it.selectedColour ? `| ${it.selectedColour}` : ''} | Qty: {it.quantity}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {formatPrice(it.subtotal || it.estimatedSubtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 border-[0.5px] border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Payment Details</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                    Total: {formatPrice(selectedOrder.totalAmount || selectedOrder.estimatedTotal)}
                  </span>
                  {selectedOrder.payments?.[0] && (
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Ref: {selectedOrder.payments[0].transactionReference} | Method: {selectedOrder.payments[0].paymentMethod || 'Flutterwave'}
                    </div>
                  )}
                </div>
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                  {selectedOrder.isPaid ? "Paid in Full" : "Pending Payment"}
                </span>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Update Order Status</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">New Stage</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                    >
                      <option value="PAID">PAID</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                      <option value="READY_FOR_SHIPPING">READY_FOR_SHIPPING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Customer Note (Emailed to Customer)</label>
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="e.g. Leather welt complete. Entering hand polish."
                      className="bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Internal Admin Note (Private)</label>
                  <input
                    type="text"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="e.g. Assigned to master artisan Boma."
                    className="bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="mt-2 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity flex items-center justify-center gap-2"
                >
                  {updatingStatus ? "Saving..." : "Commit Status & Notify Customer"}
                </button>
              </form>

              {/* Status History Audit Trail */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-4">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">Audit History Log</span>
                  <div className="flex flex-col gap-2 font-mono text-[11px] text-neutral-500">
                    {selectedOrder.statusHistory.map((h: any) => (
                      <div key={h.id} className="flex items-start gap-2 bg-neutral-50 dark:bg-neutral-950 p-2 border-[0.5px] border-neutral-200 dark:border-neutral-800">
                        <span className="text-neutral-400 shrink-0">{new Date(h.createdAt).toLocaleString()}:</span>
                        <span>
                          <strong className="text-neutral-900 dark:text-white">{h.newStatus}</strong>
                          {h.customerNote && ` — Customer note: "${h.customerNote}"`}
                          {h.internalNote && ` — Internal: "${h.internalNote}"`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
