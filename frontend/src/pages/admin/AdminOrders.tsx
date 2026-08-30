import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await api.adminUpdateOrderStatus(id, status);
      if (res.success) {
        toast(`Order status updated to ${status}.`, "success");
        setOrders((prev: any[]) =>
          prev.map(ord => (ord.id === id ? { ...ord, status } : ord))
        );
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder((prev: any) => ({ ...prev, status }));
        }
      }
    } catch (err: any) {
      toast(err.message || "Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenWhatsApp = async (ord: any) => {
    try {
      // Record click tracking in database
      await api.adminTrackWhatsapp(ord.id);
      
      // Form link: wa.me/<customerPhone>?text=<message>
      // Clean customer phone (remove spaces, symbols)
      const customerPhoneClean = ord.customerPhone.replace(/\D/g, '');
      const url = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(ord.whatsappMessage)}`;
      
      window.open(url, '_blank');
      
      // Update local state to reflect whatsappOpenedAt
      setOrders((prev: any[]) =>
        prev.map(o => (o.id === ord.id ? { ...o, whatsappOpenedAt: new Date().toISOString() } : o))
      );
      if (selectedOrder && selectedOrder.id === ord.id) {
        setSelectedOrder((prev: any) => ({ ...prev, whatsappOpenedAt: new Date().toISOString() }));
      }
    } catch (err) {
      console.error("Failed to process WhatsApp direct contact:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Order Enquiries</h1>
        <span className="text-xs text-neutral-400">Review shopping bag checkout leads</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: LIST TABLE (SPAN 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border-thin overflow-x-auto shadow-sm">
          {orders.length === 0 ? (
            <p className="text-xs text-neutral-400 py-12 text-center">No order enquiries found.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-950 border-thin-b uppercase text-neutral-400 tracking-wider font-semibold">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`border-thin-b hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 cursor-pointer ${
                      selectedOrder?.id === ord.id ? 'bg-neutral-50 dark:bg-neutral-950' : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-semibold tracking-wider text-neutral-900 dark:text-neutral-100">
                      {ord.orderReference}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-neutral-900 dark:text-white">{ord.customerName}</span>
                        <span className="text-[10px] text-neutral-400">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold">₦{Number(ord.estimatedTotal).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <select
                        value={ord.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(ord.id, e.target.value);
                        }}
                        disabled={updatingId === ord.id}
                        className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 text-[10px] uppercase font-bold py-1 px-2 outline-none cursor-pointer dark:bg-neutral-900"
                      >
                        <option value="NEW" className="dark:bg-neutral-950">New</option>
                        <option value="CONTACTED" className="dark:bg-neutral-950">Contacted</option>
                        <option value="NEGOTIATING" className="dark:bg-neutral-950">Negotiating</option>
                        <option value="COMPLETED" className="dark:bg-neutral-950">Completed</option>
                        <option value="CANCELLED" className="dark:bg-neutral-950">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhatsApp(ord);
                        }}
                        className="p-2 border-thin text-brand-clay dark:text-brand-gold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center ml-auto cursor-pointer"
                        title="Contact Customer on WhatsApp"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED VIEW (SPAN 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-6 shadow-sm">
          {selectedOrder ? (
            <div className="flex flex-col gap-5 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-thin-b pb-3">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-semibold tracking-wider font-mono text-neutral-900 dark:text-white">
                    {selectedOrder.orderReference}
                  </h3>
                  <span className="text-[10px] text-neutral-400">Submitted: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>

                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  selectedOrder.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                  selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  'bg-neutral-200 text-neutral-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Contact Card */}
              <div className="flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-950 p-4 border-thin">
                <h4 className="text-[10px] uppercase font-bold text-neutral-400">Customer Coordinates</h4>
                <div className="flex flex-col gap-1.5 leading-relaxed text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">{selectedOrder.customerName}</span>
                  <span className="flex items-center gap-1.5"><Phone size={12} /> {selectedOrder.customerPhone}</span>
                  {selectedOrder.customerEmail && <span className="flex items-center gap-1.5"><Mail size={12} /> {selectedOrder.customerEmail}</span>}
                  <span className="flex items-center gap-1.5"><MapPin size={12} /> {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}, {selectedOrder.deliveryCountry}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] uppercase font-bold text-neutral-450 dark:text-neutral-400">Items Ordered ({selectedOrder.items.length})</h4>
                <div className="flex flex-col gap-2">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-neutral-50 dark:bg-neutral-950 border-thin">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-neutral-900 dark:text-white">{item.productName}</span>
                        <span className="text-[10px] text-neutral-400">SKU: {item.productSku} &bull; Size: {item.selectedSize}</span>
                        <span className="text-[10px] text-neutral-400">Qty: {item.quantity} x ₦{Number(item.unitPrice).toLocaleString()}</span>
                      </div>
                      <span className="font-bold font-mono">
                        ₦{Number(item.estimatedSubtotal).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="flex flex-col gap-1 bg-yellow-50 dark:bg-yellow-950/10 p-3 border-[0.5px] border-yellow-250 dark:border-yellow-900/30">
                  <span className="font-semibold text-yellow-800 dark:text-yellow-450 uppercase tracking-wider text-[9px]">Customer Note:</span>
                  <p className="text-neutral-600 dark:text-neutral-300 italic font-mono">"{selectedOrder.notes}"</p>
                </div>
              )}

              {/* Pricing Totals */}
              <div className="flex flex-col gap-2 pt-3 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Subtotal</span>
                  <span>₦{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 dark:text-white mt-1 border-t-[0.5px] pt-1">
                  <span>Estimated Total</span>
                  <span>₦{Number(selectedOrder.estimatedTotal).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Tracking info */}
              <div className="text-[10px] text-neutral-400 flex flex-col gap-0.5 italic">
                <span>Created at: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                {selectedOrder.whatsappOpenedAt && (
                  <span>WhatsApp conversation initiated at: {new Date(selectedOrder.whatsappOpenedAt).toLocaleString()}</span>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleOpenWhatsApp(selectedOrder)}
                className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <MessageSquare size={14} />
                <span>Contact on WhatsApp</span>
              </button>

            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
              <Calendar size={24} className="mb-2" />
              <p className="text-xs">Select an order reference code to inspect detailed specifications.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
