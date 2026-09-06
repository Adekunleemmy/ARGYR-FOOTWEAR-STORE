import React, { useEffect, useState } from 'react';
import { Loader2, Sliders, Mail, Trash2, Clock, CreditCard } from 'lucide-react';
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
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('7–14 days');

  // System status
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Notification emails
  const [notificationEmails, setNotificationEmails] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await api.adminGetSettings();
      if (res.success) {
        setWhatsappNumber(res.settings.WHATSAPP_BUSINESS_NUMBER || '');
        setStoreEmail(res.settings.STORE_EMAIL || '');
        setStoreName(res.settings.STORE_NAME || '');
        setDefaultCurrency(res.settings.DEFAULT_CURRENCY || 'NGN');
        setDefaultCountry(res.settings.DEFAULT_COUNTRY || 'Nigeria');
        setDeliveryTimeframe(res.settings.ESTIMATED_DELIVERY_TIMEFRAME || '7–14 days');
        setSystemStatus(res.systemStatus);
        setNotificationEmails(res.notificationEmails || []);
      }
    } catch (err: any) {
      toast("Failed to load settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

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
        DEFAULT_COUNTRY: defaultCountry,
        ESTIMATED_DELIVERY_TIMEFRAME: deliveryTimeframe
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

  const handleAddNotificationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAddingEmail(true);
    try {
      const res = await api.adminAddNotificationEmail(newEmail.trim());
      if (res.success) {
        toast("Notification recipient added.", "success");
        setNotificationEmails(prev => [...prev, res.notificationEmail]);
        setNewEmail('');
      }
    } catch (err: any) {
      toast(err.message || "Failed to add notification email.", "error");
    } finally {
      setAddingEmail(false);
    }
  };

  const handleDeleteNotificationEmail = async (id: string) => {
    try {
      await api.adminDeleteNotificationEmail(id);
      toast("Recipient removed.", "success");
      setNotificationEmails(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      toast(err.message || "Failed to remove recipient.", "error");
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
    <div className="flex flex-col gap-10 max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Store & System Settings
        </h1>
        <span className="text-xs text-neutral-400">
          Configure business parameters, delivery timeframes, gateway status, and notification alerts
        </span>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
              <CreditCard size={18} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white block">
                Flutterwave Gateway
              </span>
              <span className="text-[11px] text-neutral-400">
                {systemStatus?.isFlutterwaveConfigured ? "Connected (Live/Test Mode)" : "Configuration Required"}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
              systemStatus?.isFlutterwaveConfigured
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {systemStatus?.isFlutterwaveConfigured ? "Ready" : "Pending Keys"}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
              <Mail size={18} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white block">
                Email Delivery
              </span>
              <span className="text-[11px] text-neutral-400">
                {systemStatus?.isEmailConfigured ? "SMTP Connected" : "Console Logging Mode"}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
              systemStatus?.isEmailConfigured
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            {systemStatus?.isEmailConfigured ? "Active" : "Simulated"}
          </span>
        </div>
      </div>

      {/* Main Operational Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-6 shadow-sm">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b-[0.5px] pb-3 border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <Sliders size={14} />
          <span>Operational Configurations</span>
        </h3>

        {/* Expected Delivery Timeframe */}
        <div className="flex flex-col gap-1.5 bg-neutral-50 dark:bg-neutral-950 p-4 border-[0.5px] border-neutral-200 dark:border-neutral-800">
          <label className="text-[10px] uppercase font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <Clock size={12} />
            <span>Expected Delivery Timeframe</span>
          </label>
          <input
            type="text"
            value={deliveryTimeframe}
            onChange={(e) => setDeliveryTimeframe(e.target.value)}
            placeholder="e.g. 7–14 days"
            className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none font-bold"
            required
          />
          <span className="text-[11px] text-neutral-500 mt-1">
            Displayed across product pages, checkout order summaries, and email confirmations. Updating here immediately updates customer-facing messaging without code redeployment.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Business WhatsApp Phone</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. 2348000000000"
              className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Primary Store Email</label>
            <input
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              placeholder="orders@argyrworldwide.com"
              className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Store Brand Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none font-bold"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Default Currency</label>
            <input
              type="text"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Default Country</label>
            <input
              type="text"
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Store Settings"}
        </button>
      </form>

      {/* Additional Notification Recipients Section */}
      <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-2">
            <Mail size={14} />
            <span>Order Notification Alert Recipients</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Whenever a customer completes payment for an order, notifications are dispatched to these emails in addition to the primary store email.
          </p>
        </div>

        {/* Add recipient form */}
        <form onSubmit={handleAddNotificationEmail} className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="e.g. sales@argyrworldwide.com"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none"
          />
          <button
            type="submit"
            disabled={addingEmail || !newEmail.trim()}
            className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase font-bold tracking-wider hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {addingEmail ? "..." : "Add Email"}
          </button>
        </form>

        {/* Recipients list */}
        <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800 border-[0.5px] border-neutral-200 dark:border-neutral-800">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/50 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-900 dark:text-white">{storeEmail} (Primary)</span>
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Store Email</span>
          </div>
          {notificationEmails.map(rec => (
            <div key={rec.id} className="p-3 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300">{rec.email}</span>
              <button
                type="button"
                onClick={() => handleDeleteNotificationEmail(rec.id)}
                className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                title="Remove recipient"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
