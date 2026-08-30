import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { api } from '../services/api';

interface ShopProps {
  searchOpen: boolean;
  onSearchClose: () => void;
}

export const Shop: React.FC<ShopProps> = ({ searchOpen, onSearchClose }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Trigger search from navbar toggle
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Load Categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.getCategories();
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedGender) params.gender = selectedGender;
        if (selectedSize) params.size = selectedSize;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (selectedSort) params.sort = selectedSort;

        const res = await api.getProducts(params);
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300); // debounce API requests for search query

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory, selectedGender, selectedSize, minPrice, maxPrice, selectedSort]);

  const sizesOptions = ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedGender('');
    setSelectedSize('');
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    setSelectedSort('newest');
    onSearchClose();
  };

  const hasActiveFilters = 
    selectedCategory !== '' || 
    selectedGender !== '' || 
    selectedSize !== '' || 
    minPrice !== '' || 
    maxPrice !== '' || 
    searchQuery !== '';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
      {/* Search Bar Overlay Panel */}
      {searchOpen && (
        <div className="w-full flex items-center gap-4 bg-neutral-100 dark:bg-neutral-900 p-4 border-thin animate-in slide-in-from-top duration-200">
          <Search size={18} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Type SKU, category, name, or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white border-none outline-none placeholder:text-neutral-400"
            autoFocus
          />
          <button onClick={onSearchClose} className="p-1 hover:opacity-85 text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Context Bar */}
      <div className="flex items-center justify-between border-thin-b pb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide">Catalog</h1>
          <span className="text-xs text-neutral-400 tracking-wider">
            Showing {products.length} products
          </span>
        </div>
        
        {/* Mobile Filter Button */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="md:hidden flex items-center gap-2 border-thin px-4 py-2.5 text-xs uppercase tracking-widest font-semibold cursor-pointer"
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
        </button>

        {/* Sort Selector Dropdown */}
        <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
          <span className="text-neutral-400">Sort by:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-transparent text-neutral-900 dark:text-white border-none outline-none font-bold py-1 cursor-pointer"
          >
            <option value="newest" className="dark:bg-neutral-950">Newest</option>
            <option value="price_asc" className="dark:bg-neutral-950">Price: Low to High</option>
            <option value="price_desc" className="dark:bg-neutral-950">Price: High to Low</option>
            <option value="name_asc" className="dark:bg-neutral-950">Name: A to Z</option>
            <option value="name_desc" className="dark:bg-neutral-950">Name: Z to A</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* DESKTOP FILTER PANEL */}
        <aside className="hidden md:flex flex-col gap-8 w-64 shrink-0">
          {/* Categories */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">Category</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`text-left text-xs uppercase tracking-wider ${selectedCategory === '' ? 'text-brand-clay dark:text-brand-gold font-bold' : 'text-neutral-500 hover:text-neutral-950 dark:hover:text-white'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`text-left text-xs uppercase tracking-wider ${selectedCategory === cat.slug ? 'text-brand-clay dark:text-brand-gold font-bold' : 'text-neutral-500 hover:text-neutral-950 dark:hover:text-white'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">Gender</h3>
            <div className="flex flex-col gap-2">
              {['MEN', 'WOMEN', 'KIDS', 'UNISEX'].map(gender => (
                <label key={gender} className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === gender}
                    onChange={() => setSelectedGender(gender)}
                    className="accent-neutral-900 dark:accent-white"
                  />
                  <span>{gender.toLowerCase()}</span>
                </label>
              ))}
              {selectedGender && (
                <button onClick={() => setSelectedGender('')} className="text-left text-[10px] text-brand-clay dark:text-brand-gold uppercase tracking-wider underline">
                  Clear gender
                </button>
              )}
            </div>
          </div>

          {/* Sizes */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">Shoe Size</h3>
            <div className="grid grid-cols-4 gap-2">
              {sizesOptions.map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                  className={`border-thin py-2 text-xs transition-colors cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold'
                      : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">Price Range (₦)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-transparent border-thin px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none placeholder:text-neutral-500"
              />
              <span className="text-neutral-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent border-thin px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 w-full py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </aside>

        {/* PRODUCTS GRID */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4 animate-pulse">
                  <div className="aspect-[4/5] bg-neutral-200 dark:bg-neutral-800 border-thin" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-2/3" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center border-thin p-8">
              <h3 className="text-base uppercase tracking-widest font-semibold mb-2">No shoes found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-6">
                We couldn't find any products matching your current search criteria or filter combinations.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 border-thin text-xs uppercase tracking-widest font-bold hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 cursor-pointer"
              >
                Reset Catalog Browse
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => {
                const isOutOfStock = product.stockQuantity === 0;
                const primaryImage = product.images[0]?.url || 'https://via.placeholder.com/600';
                const secondaryImage = product.images[1]?.url || primaryImage;

                return (
                  <Link 
                    key={product.id} 
                    to={`/shop/${product.slug}`} 
                    className="group flex flex-col gap-4"
                  >
                    <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 border-thin overflow-hidden">
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 z-10"
                      />
                      {product.images[1] && (
                        <img
                          src={secondaryImage}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"
                        />
                      )}
                      
                      {/* Sale badge or stock alerts */}
                      {isOutOfStock ? (
                        <span className="absolute top-4 left-4 z-30 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[9px] uppercase tracking-widest font-bold px-2 py-1">
                          Out of stock
                        </span>
                      ) : product.featured ? (
                        <span className="absolute top-4 left-4 z-30 bg-brand-clay text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase text-neutral-400 tracking-wider">
                          {product.category.name}
                        </span>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-brand-clay dark:group-hover:text-brand-gold transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTERS SIDE DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end md:hidden animate-in fade-in duration-200">
          <div className="w-80 bg-white dark:bg-neutral-900 h-full p-6 overflow-y-auto flex flex-col gap-8 animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-thin-b pb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider">Filters</h2>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest font-bold">Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 text-xs border-thin uppercase tracking-wider ${selectedCategory === '' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold' : ''}`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1.5 text-xs border-thin uppercase tracking-wider ${selectedCategory === cat.slug ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest font-bold">Gender</h3>
              <div className="flex flex-col gap-2">
                {['MEN', 'WOMEN', 'KIDS', 'UNISEX'].map(gender => (
                  <label key={gender} className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 cursor-pointer">
                    <input
                      type="radio"
                      name="gender_mobile"
                      checked={selectedGender === gender}
                      onChange={() => setSelectedGender(gender)}
                    />
                    <span>{gender.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shoe Sizes */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest font-bold">Shoe Size</h3>
              <div className="grid grid-cols-4 gap-2">
                {sizesOptions.map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                    className={`border-thin py-2 text-xs transition-colors ${
                      selectedSize === sz ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : ''
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest font-bold">Price Bounds (₦)</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-transparent border-thin px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-transparent border-thin px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Reset / Apply Buttons */}
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => {
                  setMobileFiltersOpen(false);
                }}
                className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold"
              >
                Apply Filters
              </button>
              
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full py-3 border-thin text-neutral-600 dark:text-neutral-400 text-xs uppercase tracking-widest font-bold"
              >
                Reset Filters
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
