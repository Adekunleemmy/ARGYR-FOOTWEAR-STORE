import React, { useEffect, useState } from 'react';
import { Loader2, Sliders, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Settings State
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [defaultCountry, setDefaultCountry] = useState('Nigeria');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.adminGetSettings();
        if (res.success) {
          setWhatsappNumber(res.settings.WHATSAPP_BUSINESS_NUMBER || '');
          setStoreEmail(res.settings.STORE_EMAIL || '');
          setStoreName(res.settings.STORE_NAME || '');
          setDefaultCurrency(res.settings.DEFAULT_CURRENCY || 'NGN');
          setDefaultCountry(res.settings.DEFAULT_COUNTRY || 'Nigeria');
        }
      } catch (err: any) {
        toast("Failed to load settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber || !storeEmail || !storeName) {
      toast("Please fill in all required settings fields.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        WHATSAPP_BUSINESS_NUMBER: whatsappNumber,
        STORE_EMAIL: storeEmail,
        STORE_NAME: storeName,
        DEFAULT_CURRENCY: defaultCurrency,
        DEFAULT_COUNTRY: defaultCountry
      };

      const res = await api.adminUpdateSettings(payload);
      if (res.success) {
        toast("Store settings updated successfully.", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to save settings.", "error");
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
    <div className="flex flex-col gap-8 max-w-xl">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Store Settings</h1>
        <span className="text-xs text-neutral-400">Configure business parameters</span>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-6 shadow-sm">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-450 dark:text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <Sliders size={14} />
          <span>Operational configurations</span>
        </h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-500">Business WhatsApp Phone Number</label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 2348000000000"
            className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full font-mono font-semibold"
            required
          />
          <span className="text-[10px] text-neutral-400 leading-normal">
            Must contain only digits and start with the country code (e.g., 234 for Nigeria) with no leading zeros, plus symbols, or hyphens.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-500">Business Email Address</label>
          <input
            type="email"
            value={storeEmail}
            onChange={(e) => setStoreEmail(e.target.value)}
            placeholder="e.g. info@argyr.com"
            className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-500">Store Brand Name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="ARGYR"
            className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Primary Currency Code</label>
            <input
              type="text"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              placeholder="NGN"
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full font-bold"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Default Catalog Country</label>
            <input
              type="text"
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              placeholder="Nigeria"
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
          <span>{saving ? 'Updating parameters...' : 'Update Console Settings'}</span>
        </button>

      </form>
    </div>
  );
};
