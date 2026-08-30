import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load products list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive "${name}"? This removes it from the public catalog but keeps historical order integrity.`)) {
      return;
    }

    try {
      const res = await api.adminArchiveProduct(id);
      if (res.success) {
        toast(`"${name}" has been successfully archived.`, "success");
        // Reload
        loadProducts();
      }
    } catch (err: any) {
      toast(err.message || "Failed to archive product.", "error");
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
      
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Products</h1>
          <span className="text-xs text-neutral-400">Manage catalog inventory items</span>
        </div>
        <Link
          to="../products/new"
          className="flex items-center gap-2 px-5 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Products table list */}
      {products.length === 0 ? (
        <div className="border-thin bg-white dark:bg-neutral-900 p-12 text-center flex flex-col items-center gap-4">
          <AlertCircle size={28} className="text-neutral-300" />
          <h3 className="text-sm font-bold uppercase tracking-wider">No products found</h3>
          <p className="text-xs text-neutral-500 max-w-sm">Add your first premium shoe to begin selling.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border-thin overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 border-thin-b uppercase text-neutral-400 tracking-wider font-semibold">
                <th className="p-4 w-16">Image</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const primaryImage = p.images[0]?.url || 'https://via.placeholder.com/100';
                return (
                  <tr key={p.id} className="border-thin-b hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="p-4">
                      <div className="w-10 aspect-[4/5] bg-neutral-100 dark:bg-neutral-950 border-thin overflow-hidden">
                        <img src={primaryImage} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold tracking-wider text-neutral-900 dark:text-neutral-100">{p.sku}</td>
                    <td className="p-4 font-semibold text-neutral-900 dark:text-white">{p.name}</td>
                    <td className="p-4">{p.category.name}</td>
                    <td className="p-4 font-mono font-medium">₦{Number(p.price).toLocaleString()}</td>
                    <td className="p-4 text-center font-mono">{p.stockQuantity}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        p.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <Link
                          to={`../products/edit/${p.id}`}
                          className="p-2 border-thin hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 size={12} />
                        </Link>
                        {/* Archive Button */}
                        <button
                          onClick={() => handleArchive(p.id, p.name)}
                          className="p-2 border-thin border-red-200 hover:bg-red-50 text-red-500 cursor-pointer"
                          title="Archive product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
