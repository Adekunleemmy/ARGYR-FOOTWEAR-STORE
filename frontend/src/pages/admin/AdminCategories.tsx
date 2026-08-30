import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load categories.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  };

  const handleEditClick = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setSortOrder(String(cat.sortOrder));
    setActive(cat.active);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setSortOrder('0');
    setActive(true);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }

    try {
      const res = await api.adminDeleteCategory(id);
      if (res.success) {
        toast(`Category "${catName}" deleted successfully.`, "success");
        loadCategories();
      }
    } catch (err: any) {
      toast(err.message || "Failed to delete category.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast("Please provide both name and slug.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        description: description || null,
        sortOrder: Number(sortOrder),
        active,
        image: null
      };

      let res;
      if (editingId) {
        res = await api.adminUpdateCategory(editingId, payload);
      } else {
        res = await api.adminCreateCategory(payload);
      }

      if (res.success) {
        toast(`Category ${editingId ? 'updated' : 'created'} successfully.`, "success");
        handleCancelEdit();
        loadCategories();
      }
    } catch (err: any) {
      toast(err.message || "Failed to save category.", "error");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Categories</h1>
        <span className="text-xs text-neutral-400">Classify your shoe products catalog</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: LIST (SPAN 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border-thin overflow-x-auto shadow-sm">
          {categories.length === 0 ? (
            <p className="text-xs text-neutral-400 py-12 text-center">No categories registered.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-950 border-thin-b uppercase text-neutral-400 tracking-wider font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4 text-center">Sort Order</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-thin-b hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="p-4 font-semibold text-neutral-900 dark:text-white">{cat.name}</td>
                    <td className="p-4 font-mono">{cat.slug}</td>
                    <td className="p-4 text-center font-mono">{cat.sortOrder}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        cat.active ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-800'
                      }`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditClick(cat)}
                          className="p-2 border-thin hover:bg-neutral-150 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 cursor-pointer"
                          title="Edit category"
                        >
                          <Edit2 size={12} />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 border-thin border-red-200 hover:bg-red-50 text-red-500 cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT COLUMN: CREATE/EDIT FORM (SPAN 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800">
            {editingId ? 'Edit Category' : 'Create Category'}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Formal"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="formal"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe category..."
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full h-20 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 cursor-pointer py-1.5">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-neutral-900 dark:accent-white"
              />
              <span>Active (visible in public shop menu)</span>
            </label>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t-[0.5px] border-neutral-200 dark:border-neutral-800">
              <button
                type="submit"
                disabled={saving}
                className="py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full"
              >
                {saving ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                <span>{saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2.5 border-thin text-xs text-neutral-500 uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer text-center w-full"
                >
                  Cancel Edit
                </button>
              )}
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
