import React, { useEffect, useState, useCallback } from 'react';
import { X, ShoppingBag, MessageSquare, Layers, Bookmark, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

interface ProductModalProps {
  slug: string | null;
  onClose: () => void;
  onNavigate?: (slug: string) => void; // for clicking related products inside modal
}

export const ProductModal: React.FC<ProductModalProps> = ({ slug, onClose, onNavigate }) => {
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { toast } = useToast();

  // Fetch product whenever slug changes
  useEffect(() => {
    if (!slug) {
      setProduct(null);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setProduct(null);
      setActiveImageIndex(0);
      setSelectedSize('');
      setQuantity(1);

      try {
        const res = await api.getProductBySlug(slug);
        if (res.success) {
          setProduct(res.product);

          // Fetch up to 3 related products (same category, excluding this one)
          const relRes = await api.getProducts({ category: res.product.category.slug });
          if (relRes.success) {
            setRelatedProducts(
              relRes.products.filter((p: any) => p.id !== res.product.id).slice(0, 4)
            );
          }
        }
      } catch (err) {
        console.error('ProductModal fetch error:', err);
        toast('Product not found or unavailable.', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (slug) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [slug]);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize) {
      toast('Please select a shoe size before adding to cart.', 'error');
      return;
    }
    const primaryImage = product.images[0]?.url || '';
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
      slug: product.slug,
    });
    toast(`${product.name} (Size ${selectedSize}) added to cart.`, 'success');
  }, [product, selectedSize, quantity, addToCart, toast]);

  const handleWhatsAppContact = useCallback(() => {
    if (!product) return;
    const msg = `Hello ARGYR,\n\nI would like to ask about the availability of:\n\n${product.name}\nSKU: ${product.sku}\n\nThank you.`;
    window.open(`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [product]);

  const prevImage = () => setActiveImageIndex(i => Math.max(0, i - 1));
  const nextImage = () => {
    if (product) setActiveImageIndex(i => Math.min(product.images.length - 1, i + 1));
  };

  const isOpen = !!slug;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
          >
            <motion.div
              className="
                pointer-events-auto
                relative w-full sm:max-w-5xl bg-white dark:bg-neutral-950
                sm:rounded-none border-thin shadow-2xl
                flex flex-col
                max-h-[92vh] sm:max-h-[90vh]
                overflow-hidden
              "
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-neutral-200 dark:border-neutral-800 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400">
                  {loading ? 'Loading...' : product ? `${product.category?.name} / ${product.gender}` : ''}
                </span>
                <div className="flex items-center gap-3">
                  {product && (
                    <Link
                      to={`/shop/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>Full page</span>
                    </Link>
                  )}
                  <button
                    onClick={onClose}
                    id="product-modal-close"
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                ) : product ? (
                  <div className="flex flex-col">
                    {/* Main product layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* LEFT: Images */}
                      <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={activeImageIndex}
                            src={product.images[activeImageIndex]?.url || 'https://via.placeholder.com/600'}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            initial={{ opacity: 0, scale: 1.03 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </AnimatePresence>

                        {/* Prev/Next arrows */}
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              disabled={activeImageIndex === 0}
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm text-neutral-900 dark:text-white disabled:opacity-30 hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={nextImage}
                              disabled={activeImageIndex === product.images.length - 1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm text-neutral-900 dark:text-white disabled:opacity-30 hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </>
                        )}

                        {/* Thumbnail dots */}
                        {product.images.length > 1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {product.images.map((_: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                  activeImageIndex === idx
                                    ? 'bg-white scale-125'
                                    : 'bg-white/50 hover:bg-white/80'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Out of stock badge */}
                        {product.stockQuantity === 0 && (
                          <span className="absolute top-4 left-4 z-10 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[9px] uppercase tracking-widest font-bold px-3 py-1">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* RIGHT: Info */}
                      <div className="flex flex-col gap-5 p-6 md:p-8 overflow-y-auto">
                        {/* Title & Price */}
                        <div className="flex flex-col gap-1.5">
                          <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-wide text-neutral-900 dark:text-white">
                            {product.name}
                          </h2>
                          <div className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                            ₦{Number(product.price).toLocaleString()}
                          </div>
                        </div>

                        {/* Bulk pricing notice */}
                        {product.bulkPrice && (
                          <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border-thin text-xs">
                            <span className="font-bold uppercase tracking-wider text-brand-clay dark:text-brand-gold block mb-1">
                              Bulk pricing available
                            </span>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              Buy <span className="font-bold">{product.bulkMinimumQuantity}+ pairs</span> at{' '}
                              <span className="font-bold">₦{Number(product.bulkPrice).toLocaleString()}</span>/pair
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm font-light leading-relaxed text-neutral-600 dark:text-neutral-300 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-4">
                          {product.description}
                        </p>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 dark:bg-neutral-900/40 p-3 border-thin">
                          <div className="flex items-center gap-1.5">
                            <Layers size={12} className="text-neutral-400" />
                            <span className="text-neutral-400">Material:</span>
                            <span className="font-semibold">{product.material}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bookmark size={12} className="text-neutral-400" />
                            <span className="text-neutral-400">SKU:</span>
                            <span className="font-semibold tracking-wider">{product.sku}</span>
                          </div>
                          {product.collection && (
                            <div className="col-span-2 flex items-center gap-1.5">
                              <span className="text-neutral-400">Collection:</span>
                              <span className="font-semibold">{product.collection}</span>
                            </div>
                          )}
                        </div>

                        {/* Size Selection */}
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-baseline">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
                              Select Size
                            </h3>
                            {selectedSize && (
                              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                                Size: {selectedSize}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {product.sizes.map((sz: string) => (
                              <button
                                key={sz}
                                onClick={() => setSelectedSize(sz)}
                                disabled={product.stockQuantity === 0}
                                className={`w-11 h-11 border-thin text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                  selectedSize === sz
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold scale-105 shadow-sm'
                                    : 'hover:border-neutral-400 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quantity */}
                        {product.stockQuantity > 0 && (
                          <div className="flex items-center gap-4">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
                              Qty:
                            </h3>
                            <div className="flex items-center border-thin">
                              <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                              >
                                −
                              </button>
                              <span className="px-4 text-xs font-bold font-mono">{quantity}</span>
                              <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-2 pt-2 border-t-[0.5px] border-neutral-200 dark:border-neutral-800">
                          {product.stockQuantity === 0 ? (
                            <>
                              <button
                                disabled
                                className="w-full py-3.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 text-xs uppercase tracking-widest font-bold cursor-not-allowed"
                              >
                                Currently Unavailable
                              </button>
                              <button
                                onClick={handleWhatsAppContact}
                                className="w-full py-3.5 border-thin text-xs uppercase tracking-widest font-bold hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
                              >
                                <MessageSquare size={13} />
                                <span>Ask Availability on WhatsApp</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleAddToCart}
                              id="product-modal-add-to-cart"
                              className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <ShoppingBag size={13} />
                              <span>Add to Shopping Bag</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                      <div className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 px-6 md:px-8 py-8">
                        <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-neutral-900 dark:text-white">
                          You may also like
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {relatedProducts.map(rel => {
                            const relImg = rel.images[0]?.url || 'https://via.placeholder.com/400';
                            return (
                              <button
                                key={rel.id}
                                onClick={() => onNavigate ? onNavigate(rel.slug) : undefined}
                                className="group flex flex-col gap-2 text-left cursor-pointer"
                              >
                                <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 border-thin overflow-hidden">
                                  <img
                                    src={relImg}
                                    alt={rel.name}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-400"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-brand-clay dark:group-hover:text-brand-gold transition-colors leading-tight">
                                    {rel.name}
                                  </p>
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    ₦{Number(rel.price).toLocaleString()}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
