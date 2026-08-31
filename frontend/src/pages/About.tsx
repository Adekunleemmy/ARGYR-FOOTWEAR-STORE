import React from 'react';
import { PageTransition } from '../components/PageTransition';

export const About: React.FC = () => {
  return (
    <PageTransition>
    <div className="w-full flex flex-col">
      {/* Editorial Header */}
      <section className="bg-white dark:bg-neutral-950 border-thin-b">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col gap-6 max-w-3xl">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-clay dark:text-brand-gold">
            Atelier Ethos
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-none tracking-tight">
            Craftsmanship with purpose.
          </h1>
          <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-light mt-4">
            Founded with a vision to build footwear that commands presence, ARGYR is a Nigerian premium shoe atelier. We combine structural silhouettes with the fine, time-honored techniques of traditional leathercrafting.
          </p>
        </div>
      </section>

      {/* Main Narrative Blocks */}
      <section className="bg-neutral-50 dark:bg-neutral-900/40 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] bg-neutral-200 border-thin overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80" 
              alt="Atelier leather work close up" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest text-brand-clay dark:text-brand-gold font-bold">The Construct</span>
              <h2 className="text-2xl md:text-4xl font-bold">Goodyear Welt Construction</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                Goodyear welting is the gold standard of shoe manufacturing. It involves sewing a leather strip (the welt) to the upper and insole, which is then stitched directly to the outsole. This double-stitch barrier ensures complete water-resistance and allows the shoe to be completely resoled repeatedly, extending its lifecycle indefinitely.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest text-brand-clay dark:text-brand-gold font-bold">The Sourcing</span>
              <h2 className="text-2xl md:text-4xl font-bold">Premium Materials</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                We select box-calf leathers, buttery suedes, and full-grain hides sourced from ethical tanneries. Every hide undergoes rigorous quality checks before reaching our workbench, ensuring a flawless grain structure that patinas beautifully over years of wear.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest text-brand-clay dark:text-brand-gold font-bold">The Origin</span>
              <h2 className="text-2xl md:text-4xl font-bold">Designed & Made in Nigeria</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                Our atelier is located in Lagos, Nigeria, where we employ and train local artisans. We are committed to fostering the development of premium manufacturing skillsets within West Africa, ensuring that our products reflect a sophisticated contemporary African identity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="bg-white dark:bg-neutral-950 py-24 text-center border-thin-y">
        <div className="max-w-3xl mx-auto px-6 flex flex-col gap-6">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">Atelier Signature</span>
          <p className="text-xl md:text-3xl font-editorial italic text-neutral-850 dark:text-neutral-200 leading-normal">
            "A shoe is not merely an accessory. It is the architectural foundation of your posture, carrying your weight and defining your presence in any room."
          </p>
        </div>
      </section>
    </div>
    </PageTransition>
  );
};
