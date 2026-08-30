import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-100 dark:bg-neutral-900 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Section */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <Link to="/" className="text-xl font-editorial tracking-[0.25em] font-bold text-neutral-900 dark:text-white">
            ARGYR
          </Link>
          <p className="text-sm max-w-sm leading-relaxed">
            Distinguished footwear meticulously designed and handcrafted in Nigeria. Melding ancestral leathercraft skills with sleek, contemporary structural design.
          </p>
        </div>

        {/* Navigation Link Groups */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-neutral-900 dark:text-white font-semibold mb-4">
            Platform
          </h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link to="/shop" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Browse Collection
              </Link>
            </li>
            <li>
              <Link to="/custom" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Custom Footwear Request
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Our Story
              </Link>
            </li>
          </ul>
        </div>

        {/* Administration & Contact Links */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-neutral-900 dark:text-white font-semibold mb-4">
            Office
          </h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <span className="hover:cursor-default">Lagos, Nigeria</span>
            </li>
            <li>
              <Link to="/admin" className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1.5 font-medium">
                Admin Console
              </Link>
            </li>
            <li>
              <a 
                href="https://wa.me/2348000000000" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Direct WhatsApp Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Notice */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-t-[0.5px] border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <span>&copy; {currentYear} ARGYR Footwear. All rights reserved.</span>
        <span className="tracking-wide">Crafted for presence.</span>
      </div>
    </footer>
  );
};
