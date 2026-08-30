import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, MessageSquare, ArrowLeft, Layers, Bookmark } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Selection States
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getProductBySlug(slug);
        if (res.success) {
          setProduct(res.product);
          setActiveImageIndex(0);
          setSelectedSize('');
          setQuantity(1);

          // Fetch related products (same category)
          const relatedRes = await api.getProducts({ category: res.product.category.slug });
          if (relatedRes.success) {
            // Filter out current product
            const filtered = relatedRes.products.filter((p: any) => p.id !== res.product.id);
            setRelatedProducts(filtered.slice(0, 3)); // show max 3
          }
        }
      } catch (err) {
        console.error("Error fetching product detail:", err);
        toast("Product not found or unavailable.", "error");
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [slug, navigate, toast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stockQuantity === 0;
  const isBulkPriceAvailable = product.bulkPrice !== null;
  const bulkThreshold = product.bulkMinimumQuantity;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast("Please select a shoe size before adding to cart.", "error");
      return;
    }

    const primaryImage = product.images[0]?.url || 'https://via.placeholder.com/600';

    addToCart({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      bulkPrice: product.bulkPrice ? Number(product.bulkPrice) : null,
      bulkMinimumQuantity: product.bulkMinimumQuantity,
      selectedSize,
      selectedColour: null,
      quantity,
      imageUrl: primaryImage,
      slug: product.slug
    });

    toast(`${product.name} (Size ${selectedSize}) added to cart.`, "success");
  };

  const handleWhatsAppContact = () => {
    const textMessage = `Hello ARGYR,\n\nI would like to ask about the availability of the following shoe:\n\n${product.name}\nSKU: ${product.sku}\n\nThank you.`;
    // Fallback static business number, dynamically load setting if active
    const number = "2348000000000";
    const url = `https://wa.me/${number}?text=${encodeURIComponent(textMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full flex flex-col gap-16">
      {/* Back to Shop Nav */}
      <Link 
        to="/shop" 
        className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-semibold transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to collection</span>
      </Link>

      {/* Main product display grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* LEFT COLUMN: IMAGES */}
        <div className="flex flex-col gap-4">
          {/* Active Image Window */}
          <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 border-thin overflow-hidden">
            <img 
              src={product.images[activeImageIndex]?.url || 'https://via.placeholder.com/600'} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
            />
            {isOutOfStock && (
              <span className="absolute top-4 left-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[10px] uppercase tracking-widest font-bold px-3 py-1">
                Out of Stock
              </span>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 aspect-[4/5] border-[0.5px] overflow-hidden shrink-0 cursor-pointer ${
                    activeImageIndex === idx 
                      ? 'border-neutral-950 dark:border-white' 
                      : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INFORMATION */}
        <div className="flex flex-col gap-6">
          {/* Metadata & Title */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-brand-clay dark:text-brand-gold font-bold tracking-widest">
              {product.category.name} / {product.gender}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-wide text-neutral-900 dark:text-white">
              {product.name}
            </h1>
            <div className="text-xl font-medium mt-1">
              ₦{Number(product.price).toLocaleString()}
            </div>
          </div>

          {/* Bulk pricing notice banner */}
          {isBulkPriceAvailable && (
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border-thin flex flex-col gap-1 text-xs">
              <span className="font-bold uppercase tracking-wider text-brand-clay dark:text-brand-gold">
                Bulk pricing option active
              </span>
              <p className="text-neutral-500 dark:text-neutral-400">
                Purchase <span className="font-bold">{bulkThreshold}+ pairs</span> at the rate of <span className="font-bold">₦{Number(product.bulkPrice).toLocaleString()}</span> per pair. Subtotal is recalculated automatically inside your shopping bag.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-2 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-6">
            <p className="text-sm font-light leading-relaxed text-neutral-600 dark:text-neutral-300">
              {product.description}
            </p>
          </div>

          {/* Specifications List */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 dark:bg-neutral-900/40 p-4 border-thin">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-neutral-400" />
              <span className="text-neutral-400">Material:</span>
              <span className="font-semibold">{product.material}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark size={14} className="text-neutral-400" />
              <span className="text-neutral-400">SKU:</span>
              <span className="font-semibold tracking-wider">{product.sku}</span>
            </div>
            {product.collection && (
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-neutral-400">Collection:</span>
                <span className="font-semibold">{product.collection}</span>
              </div>
            )}
          </div>

          {/* Sizes Options Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
                Select Size
              </h3>
              {selectedSize && (
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                  Size selected: {selectedSize}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz: string) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-12 h-12 border-thin text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold scale-102 shadow-sm'
                      : 'hover:border-neutral-400 text-neutral-700 dark:text-neutral-300'
                  }`}
                  disabled={isOutOfStock}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
                Quantity:
              </h3>
              <div className="flex items-center border-thin">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold font-mono">{quantity}</span>
                <button 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3.5 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Checkout / Add buttons */}
          <div className="flex flex-col gap-3 mt-4 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-6">
            {isOutOfStock ? (
              <div className="flex flex-col gap-2">
                <button
                  disabled
                  className="w-full py-4 bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 text-xs uppercase tracking-widest font-bold cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
                <button
                  onClick={handleWhatsAppContact}
                  className="w-full py-4 border-thin text-xs uppercase tracking-widest font-bold hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Ask Availability on WhatsApp</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Add to Shopping Bag</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-16 mt-8">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-10">
            Explore similar shoes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {relatedProducts.map(rel => {
              const relImage = rel.images[0]?.url || 'https://via.placeholder.com/600';
              return (
                <Link 
                  key={rel.id} 
                  to={`/shop/${rel.slug}`} 
                  className="group flex flex-col gap-4"
                >
                  <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 border-thin overflow-hidden">
                    <img
                      src={relImage}
                      alt={rel.name}
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs uppercase font-bold text-neutral-900 dark:text-white group-hover:text-brand-clay dark:group-hover:text-brand-gold transition-colors">
                      {rel.name}
                    </h3>
                    <span className="text-xs font-semibold">
                      ₦{Number(rel.price).toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};
