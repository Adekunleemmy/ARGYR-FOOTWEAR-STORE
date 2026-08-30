import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkMinimumQuantity, setBulkMinimumQuantity] = useState(10);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [gender, setGender] = useState('UNISEX');
  const [material, setMaterial] = useState('');
  const [collection, setCollection] = useState('');
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [status, setStatus] = useState('DRAFT');

  // Sizes checklist
  const sizesList = ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Images list
  const [images, setImages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Auto generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditMode) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .trim()
        .replace(/\s+/g, '-'); // replace spaces with hyphens
      setSlug(generatedSlug);
    }
  };

  // Load categories and product details (if edit mode)
  useEffect(() => {
    const initForm = async () => {
      setLoading(true);
      try {
        const catRes = await api.adminGetCategories();
        if (catRes.success) {
          setCategories(catRes.categories);
        }

        if (isEditMode) {
          // In standard flow we can grab single details. Let's use the catalog slug or search by id.
          // Wait, backend API has GET /api/products/:slug. We can find by listing and filtering by ID!
          const prodListRes = await api.adminGetProducts();
          if (prodListRes.success) {
            const product = prodListRes.products.find((p: any) => p.id === id);
            if (product) {
              setName(product.name);
              setSlug(product.slug);
              setSku(product.sku);
              setDescription(product.description);
              setShortDescription(product.shortDescription);
              setPrice(String(product.price));
              setBulkPrice(product.bulkPrice ? String(product.bulkPrice) : '');
              setBulkMinimumQuantity(product.bulkMinimumQuantity);
              setStockQuantity(product.stockQuantity);
              setCategoryId(product.categoryId);
              setGender(product.gender);
              setMaterial(product.material);
              setCollection(product.collection || '');
              setFeatured(product.featured);
              setNewArrival(product.newArrival);
              setBestSeller(product.bestSeller);
              setStatus(product.status);
              setSelectedSizes(product.sizes);
              setImages(product.images);
            } else {
              toast("Product details not found.", "error");
              navigate('../products');
            }
          }
        }
      } catch (err: any) {
        toast("Failed to initialize product form.", "error");
      } finally {
        setLoading(false);
      }
    };
    initForm();
  }, [id, isEditMode, navigate, toast]);

  const handleSizeToggle = (sz: string) => {
    setSelectedSizes(prev =>
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast("Image must be smaller than 5MB.", "error");
        return;
      }

      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await api.adminUploadImage(formData);
        if (res.success) {
          // Add to images list with correct sortOrder
          const nextOrder = images.length;
          setImages(prev => [
            ...prev,
            { url: res.url, altText: name, sortOrder: nextOrder, publicId: null }
          ]);
          toast("Image uploaded successfully.", "success");
        }
      } catch (err: any) {
        toast(err.message || "Failed to upload image.", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      // Re-sort orders dynamically
      return updated.map((img, i) => ({ ...img, sortOrder: i }));
    });
  };

  const setPrimaryImage = (idx: number) => {
    setImages(prev => {
      const target = prev[idx];
      const filtered = prev.filter((_, i) => i !== idx);
      // Put target at index 0 and reorder rest
      const updated = [target, ...filtered];
      return updated.map((img, i) => ({ ...img, sortOrder: i }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !sku || !description || !shortDescription || !price || !categoryId || !material) {
      toast("Please fill in all required product fields.", "error");
      return;
    }

    if (selectedSizes.length === 0) {
      toast("Please select at least one shoe size fit option.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        sku,
        description,
        shortDescription,
        price: Number(price),
        bulkPrice: bulkPrice ? Number(bulkPrice) : null,
        bulkMinimumQuantity: Number(bulkMinimumQuantity),
        stockQuantity: Number(stockQuantity),
        categoryId,
        gender,
        material,
        collection: collection || null,
        featured,
        newArrival,
        bestSeller,
        status,
        sizes: selectedSizes,
        images
      };

      let res;
      if (isEditMode) {
        res = await api.adminUpdateProduct(id!, payload);
      } else {
        res = await api.adminCreateProduct(payload);
      }

      if (res.success) {
        toast(`Product ${isEditMode ? 'updated' : 'created'} successfully.`, "success");
        navigate('../products');
      }
    } catch (err: any) {
      toast(err.message || "Failed to save product.", "error");
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
      
      {/* Back button */}
      <Link
        to="../products"
        className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-semibold transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to products</span>
      </Link>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          {isEditMode ? 'Edit Product' : 'Add Product'}
        </h1>
        <span className="text-xs text-neutral-400">{isEditMode ? 'Modify catalog item properties' : 'Register a new shoe silhouette'}</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT BLOCK: FIELD OPTIONS (SPAN 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-white dark:bg-neutral-900 border-thin p-6 shadow-sm">
          
          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Product Name</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. ARGYR Atelier Oxford"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="argyr-atelier-oxford"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ARG-FOR-002"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full cursor-pointer dark:bg-neutral-900"
                required
              >
                <option value="" className="dark:bg-neutral-950">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-neutral-950">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Gender fit</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full cursor-pointer dark:bg-neutral-900"
              >
                <option value="UNISEX" className="dark:bg-neutral-950">Unisex</option>
                <option value="MEN" className="dark:bg-neutral-950">Men</option>
                <option value="WOMEN" className="dark:bg-neutral-950">Women</option>
                <option value="KIDS" className="dark:bg-neutral-950">Kids</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Material Sourced</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Suede leather"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Collection (Optional)</label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="e.g. Atelier Classics"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Refined Goodyear-welted shoe in box calf leather."
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Long Editorial Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive narrative about sizing, silhouette structure, and sole options..."
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full h-32 resize-none leading-relaxed"
              required
            />
          </div>

          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800 mt-4">
            Size Specifications
          </h3>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Available Sizing Fit checklist</span>
            <div className="flex flex-wrap gap-2">
              {sizesList.map(sz => {
                const checked = selectedSizes.includes(sz);
                return (
                  <button
                    type="button"
                    key={sz}
                    onClick={() => handleSizeToggle(sz)}
                    className={`w-10 h-10 border-thin text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      checked
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold'
                        : 'text-neutral-500 dark:text-neutral-400 hover:border-neutral-400'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING, STOCK, IMAGES & CONTROLS (SPAN 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* PRICING & STOCK */}
          <div className="bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800">
              Inventory & Costing
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Regular Price (₦)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="120000"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Bulk Discount Price (₦ - Optional)</label>
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="105000"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Min Quantity for Bulk</label>
              <input
                type="number"
                value={bulkMinimumQuantity}
                onChange={(e) => setBulkMinimumQuantity(Number(e.target.value))}
                placeholder="10"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Catalog Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                placeholder="20"
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-500">Visibility Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full cursor-pointer dark:bg-neutral-900"
              >
                <option value="DRAFT" className="dark:bg-neutral-950">Draft (Invisible)</option>
                <option value="ACTIVE" className="dark:bg-neutral-950">Active (Visible)</option>
                <option value="OUT_OF_STOCK" className="dark:bg-neutral-950">Out of Stock</option>
              </select>
            </div>

            {/* Badges flags */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t-[0.5px] border-neutral-200 dark:border-neutral-800">
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="accent-neutral-900 dark:accent-white"
                />
                <span>Featured product</span>
              </label>

              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newArrival}
                  onChange={(e) => setNewArrival(e.target.checked)}
                  className="accent-neutral-900 dark:accent-white"
                />
                <span>New Arrival</span>
              </label>

              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bestSeller}
                  onChange={(e) => setBestSeller(e.target.checked)}
                  className="accent-neutral-900 dark:accent-white"
                />
                <span>Best Seller</span>
              </label>
            </div>

          </div>

          {/* PRODUCT IMAGES MANAGER */}
          <div className="bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800">
              Shoe Photography Gallery
            </h3>

            {/* Drag click upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-thin border-dashed p-6 text-center flex flex-col items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors"
            >
              {uploadingImage ? (
                <Loader2 className="animate-spin text-neutral-400" size={18} />
              ) : (
                <Upload className="text-neutral-400" size={18} />
              )}
              <span className="text-[11px] uppercase tracking-wider font-semibold">Upload Photo</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Uploaded Images List */}
            {images.length > 0 && (
              <div className="flex flex-col gap-2.5 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-3 p-2 bg-neutral-50 dark:bg-neutral-950 border-thin text-xs items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 aspect-[4/5] bg-neutral-200 border-thin overflow-hidden shrink-0">
                        <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold font-mono">Order: {img.sortOrder}</span>
                        {img.sortOrder === 0 && (
                          <span className="text-[8px] bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-1 py-0.2 font-bold uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Set Primary Button */}
                      {img.sortOrder !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="px-2 py-1 border-thin text-[9px] uppercase tracking-widest font-bold hover:bg-white dark:hover:bg-neutral-850 cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}
                      
                      {/* Delete Image */}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 hover:text-red-500 text-neutral-400 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={saving}
              className="py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              <span>{saving ? "Saving specifications..." : "Save Product Settings"}</span>
            </button>

            <Link
              to="../products"
              className="py-3.5 border-thin text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-widest font-bold hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors text-center w-full"
            >
              Cancel changes
            </Link>
          </div>

        </div>

      </form>
    </div>
  );
};
