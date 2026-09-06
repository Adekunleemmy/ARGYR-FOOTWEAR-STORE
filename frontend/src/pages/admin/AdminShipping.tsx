import React, { useEffect, useState } from 'react';
import { Edit, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminShipping: React.FC = () => {
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: number; description: string; active: boolean; currency: string }>({
    name: '',
    price: 0,
    description: '',
    active: true,
    currency: 'NGN'
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadShippingMethods = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetShippingMethods();
      if (res.success) {
        setShippingMethods(res.shippingMethods);
      }
    } catch (err: any) {
      toast("Failed to load shipping regions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const handleStartEdit = (method: any) => {
    setEditingId(method.id);
    setEditForm({
      name: method.name,
      price: Number(method.price),
      description: method.description || '',
      active: method.active,
      currency: method.currency || 'NGN'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await api.adminUpdateShippingMethod(id, editForm);
      if (res.success) {
        toast("Shipping region updated successfully.", "success");
        setShippingMethods(prev =>
          prev.map(m => (m.id === id ? { ...m, ...editForm, price: editForm.price } : m))
        );
        setEditingId(null);
      }
    } catch (err: any) {
      toast(err.message || "Failed to update shipping region.", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return '₦' + Number(price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
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
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Shipping Configuration
        </h1>
        <span className="text-xs text-neutral-400">
          Configure delivery regions, authoritative pricing and activation states
        </span>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-950 p-4 border-[0.5px] border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
        <AlertCircle size={16} className="text-neutral-900 dark:text-white shrink-0 mt-0.5" />
        <span>
          <strong>Authoritative Snapshot Guarantee:</strong> Updating shipping prices only applies to new checkouts. Existing and historical customer orders retain their original booked shipping fee snapshot.
        </span>
      </div>

      {/* Shipping Methods Table */}
      <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-[0.5px] border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
              <th className="py-4 px-6">Region Name</th>
              <th className="py-4 px-6">Description</th>
              <th className="py-4 px-6">Delivery Fee</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {shippingMethods.map(method => {
              const isEditing = editingId === method.id;

              if (isEditing) {
                return (
                  <tr key={method.id} className="bg-neutral-50/50 dark:bg-neutral-950/50">
                    <td className="py-4 px-6">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-1.5 px-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-1.5 px-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-neutral-400">₦</span>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-1.5 px-2.5 text-xs text-neutral-900 dark:text-white outline-none w-28 font-mono font-bold"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={editForm.active ? "true" : "false"}
                        onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                        className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-1.5 px-2.5 text-xs text-neutral-900 dark:text-white outline-none"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(method.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[11px] uppercase font-bold tracking-wider hover:opacity-85 transition-opacity"
                        >
                          {saving ? "..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 border-[0.5px] border-neutral-300 dark:border-neutral-700 text-[11px] uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={method.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="py-4 px-6 font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    {method.name}
                  </td>
                  <td className="py-4 px-6 text-neutral-500 max-w-xs">
                    {method.description || '—'}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-neutral-900 dark:text-white">
                    {formatPrice(method.price)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                        method.active
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {method.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleStartEdit(method)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border-[0.5px] border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white text-[11px] uppercase tracking-wider font-semibold transition-colors"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
