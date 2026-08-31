import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Box, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { PageTransition } from '../components/PageTransition';
import { ProductModal } from '../components/ProductModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalSlug, setActiveModalSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.getProducts({ featured: 'true' });
        if (res.success) {
          setFeaturedProducts(res.products.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <>
    <PageTransition>
      <div className="w-full flex flex-col overflow-x-hidden">
        {/* 1. HERO SECTION */}
        <section className="relative h-[90vh] bg-neutral-900 overflow-hidden flex items-center">
          {/* Visual Background image (Editorial shoe photo) */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img 
              src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1920&q=80" 
              alt="ARGYR premium footwear" 
              className="w-full h-full object-cover object-center select-none"
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 0.4 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/20" />
          </div>

          <motion.div 
            className="max-w-7xl mx-auto px-6 w-full relative z-10 text-white flex flex-col gap-6 md:max-w-3xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span 
              className="text-xs uppercase tracking-[0.3em] font-semibold text-brand-gold"
              variants={itemVariants}
            >
              Nigerian Luxury Footwear
            </motion.span>
            <motion.h1 
              className="text-5xl md:text-7xl font-bold leading-none tracking-tight font-serif"
              variants={itemVariants}
            >
              Crafted for your presence.
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-neutral-300 max-w-xl font-light leading-relaxed"
              variants={itemVariants}
            >
              Distinctive ready-to-wear, handmade, and bespoke footwear. Engineered around premium materials and refined proportions to deliver absolute confidence.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mt-4"
              variants={itemVariants}
            >
              <Link 
                to="/shop" 
                className="px-8 py-4 bg-white text-neutral-950 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors text-center shadow-lg hover:shadow-xl duration-300"
              >
                Shop Collection
              </Link>
              <Link 
                to="/custom" 
                className="px-8 py-4 border-[0.5px] border-white text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-950 transition-all text-center"
              >
                Bespoke Design Studio
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. VALUE PROPOSITIONS */}
        <section className="border-thin-b bg-white dark:bg-neutral-950">
          <motion.div 
            className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 text-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            <motion.div 
              className="p-8 flex items-start gap-4 border-thin-b md:border-b-0 md:border-thin-r hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors duration-300 cursor-default"
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <ShieldCheck className="text-brand-clay dark:text-brand-gold shrink-0" size={24} />
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-xs mb-1.5 text-neutral-900 dark:text-white">Goodyear Welted Quality</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Each pair is engineered using superior welt construction methodologies for exceptional durability and structure.</p>
              </div>
            </motion.div>
            <motion.div 
              className="p-8 flex items-start gap-4 border-thin-b md:border-b-0 md:border-thin-r hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors duration-300 cursor-default"
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Sparkles className="text-brand-clay dark:text-brand-gold shrink-0" size={24} />
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-xs mb-1.5 text-neutral-900 dark:text-white">Bespoke Customization</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Collaborate with our atelier artisans. Change leathers, soles, colors, and emboss initials on any model.</p>
              </div>
            </motion.div>
            <motion.div 
              className="p-8 flex items-start gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors duration-300 cursor-default"
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Box className="text-brand-clay dark:text-brand-gold shrink-0" size={24} />
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-xs mb-1.5 text-neutral-900 dark:text-white">Bulk Delivery Options</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">We support bulk sizing requests for events, uniforms, and corporate clients with indicative tier pricing.</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. FEATURED PRODUCTS COLLECTION */}
        <section className="max-w-7xl mx-auto px-6 py-24 w-full">
          <motion.div 
            className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-clay dark:text-brand-gold font-bold">Curated Edit</span>
              <h2 className="text-3xl md:text-5xl font-bold">Atelier Highlights</h2>
            </div>
            <Link 
              to="/shop" 
              className="text-xs uppercase tracking-widest font-semibold hover:text-brand-clay dark:hover:text-brand-gold flex items-center gap-1.5 transition-colors group"
            >
              <span>View Catalog</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-neutral-400" size={24} />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
            >
              {featuredProducts.map(product => {
                const primaryImage = product.images[0]?.url || 'https://via.placeholder.com/600';
                const secondaryImage = product.images[1]?.url || primaryImage;

                return (
                  <motion.div key={product.id} variants={itemVariants}>
                    <button
                      onClick={() => setActiveModalSlug(product.slug)}
                      className="group flex flex-col gap-4 text-left cursor-pointer w-full"
                    >
                      <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 overflow-hidden border-thin">
                        <img 
                          src={primaryImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 z-10"
                        />
                        {product.images[1] && (
                          <img 
                            src={secondaryImage} 
                            alt={product.name} 
                            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20"
                          />
                        )}
                        {product.stockQuantity === 0 && (
                          <span className="absolute top-4 left-4 z-30 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[9px] uppercase tracking-widest font-bold px-2 py-1">
                            Out of stock
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase text-neutral-400 tracking-wider">
                            {product.category.name}
                          </span>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-brand-clay dark:group-hover:text-brand-gold transition-colors">
                            {product.name}
                          </h3>
                        </div>
                        <span className="text-sm font-medium">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* 4. CUSTOM STUDIO TEASER SECTION */}
        <section className="bg-neutral-900 dark:bg-neutral-900 text-white py-24 border-thin-y overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="relative aspect-[4/3] bg-neutral-800 border-[0.5px] border-neutral-700 overflow-hidden"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img 
                src="https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=80" 
                alt="Atelier workspace tools" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
            <motion.div 
              className="flex flex-col gap-6 items-start"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-bold">Atelier Consultation</span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight font-serif">Have something specific in mind?</h2>
              <p className="text-neutral-300 text-sm md:text-base leading-relaxed font-light">
                Collaborate directly with our master craftsmen. Bring your dream shoe concept to life. Simply configure your preferences for silhouette style, size, color, leather material, and add reference photos. We will consult with you directly on WhatsApp to finalize the build spec and deliver your unique custom order.
              </p>
              <Link 
                to="/custom" 
                className="px-8 py-4 bg-white text-neutral-950 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors duration-300 text-center"
              >
                Bring Your Idea to Life
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 5. BULK BUYING TEASER SECTION */}
        <section className="bg-white dark:bg-neutral-950 py-24 border-thin-b overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="flex flex-col gap-6 items-start order-2 md:order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-xs uppercase tracking-[0.25em] text-brand-clay dark:text-brand-gold font-bold">Wholesale Channel</span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight font-serif">Custom Bulk Sizing</h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed font-light">
                We cater to wholesale buyers, wedding events, and corporate client programs. Configurable bulk discount prices are available for orders starting from 5 to 10 pairs. Review pricing models across the shop catalog and begin a bulk conversation directly via WhatsApp.
              </p>
              <Link 
                to="/shop" 
                className="px-8 py-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity text-center"
              >
                Shop in Bulk
              </Link>
            </motion.div>
            <motion.div 
              className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 border-thin order-1 md:order-2 overflow-hidden"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img 
                src="https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=80" 
                alt="Multiple shoe pairs presentation" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>

    {/* Product Quick-View Modal */}
    <ProductModal
      slug={activeModalSlug}
      onClose={() => setActiveModalSlug(null)}
      onNavigate={(slug) => setActiveModalSlug(slug)}
    />
    </>
  );
};
