import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useToast } from '../../components/Toast';

export const AccountProfile: React.FC = () => {
  const { customer, updateProfile } = useCustomerAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(customer?.firstName || '');
  const [lastName, setLastName] = useState(customer?.lastName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [marketingOptIn, setMarketingOptIn] = useState(customer?.marketingOptIn || false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [newAddressOpen, setNewAddressOpen] = useState(false);

  // New address form state
  const [recipientName, setRecipientName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [stateRegion, setStateRegion] = useState('');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName);
      setLastName(customer.lastName);
      setPhone(customer.phone || '');
      setMarketingOptIn(Boolean(customer.marketingOptIn));
    }
  }, [customer]);

  const loadAddresses = async () => {
    try {
      const res = await api.getCustomerProfile();
      if (res.success && res.customer) {
        setAddresses(res.customer.addresses || []);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        phone,
        marketingOptIn
      });
      toast("Profile updated successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await api.addCustomerAddress({
        recipientName,
        phone: addressPhone,
        country,
        stateRegion: stateRegion || null,
        city,
        addressLine,
        postalCode: postalCode || null,
        isDefault
      });

      if (res.success) {
        toast("Delivery address saved.", "success");
        setNewAddressOpen(false);
        // Reset form
        setRecipientName('');
        setAddressPhone('');
        setStateRegion('');
        setCity('');
        setAddressLine('');
        setPostalCode('');
        setIsDefault(false);
        loadAddresses();
      }
    } catch (err: any) {
      toast(err.message || "Failed to save address.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Remove this delivery address?")) return;
    try {
      await api.deleteCustomerAddress(id);
      toast("Address removed.", "success");
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      toast(err.message || "Failed to delete address.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* 1. PERSONAL INFORMATION (SPAN 5) */}
      <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-6">
          Personal Information
        </h2>

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Email Address (Read-only)</label>
            <input
              type="email"
              value={customer?.email || ''}
              disabled
              className="w-full bg-neutral-100 dark:bg-neutral-950/50 border-[0.5px] border-neutral-200 dark:border-neutral-800 py-2.5 px-3 text-xs text-neutral-500 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
              className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-white"
            />
            <span className="text-[11px] text-neutral-500 leading-tight">
              Subscribed to ARGYR editorial releases & bespoke updates.
            </span>
          </label>

          <button
            type="submit"
            disabled={savingProfile}
            className="mt-4 w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>

      {/* 2. SAVED ADDRESSES (SPAN 7) */}
      <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400">
            Delivery Addresses ({addresses.length})
          </h2>

          <button
            onClick={() => setNewAddressOpen(!newAddressOpen)}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-neutral-900 dark:text-white hover:underline"
          >
            <Plus size={14} />
            <span>{newAddressOpen ? "Cancel" : "Add Address"}</span>
          </button>
        </div>

        {/* New Address Form */}
        {newAddressOpen && (
          <form onSubmit={handleAddAddress} className="bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-6 mb-6 flex flex-col gap-3 animate-in fade-in duration-200">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white mb-2">
              New Delivery Address
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  placeholder="Full name"
                  className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Contact Phone</label>
                <input
                  type="tel"
                  value={addressPhone}
                  onChange={(e) => setAddressPhone(e.target.value)}
                  required
                  placeholder="+234..."
                  className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Street Address</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                required
                placeholder="House / Building, Street, Area"
                className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Lagos"
                  className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">State / Region</label>
                <input
                  type="text"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="e.g. Lagos State"
                  className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  placeholder="Nigeria"
                  className="w-full bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-3.5 h-3.5 accent-neutral-900 dark:accent-white"
              />
              <span className="text-[11px] text-neutral-500">Set as default delivery address</span>
            </label>

            <button
              type="submit"
              disabled={savingAddress}
              className="mt-2 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity"
            >
              {savingAddress ? "Saving..." : "Save Address"}
            </button>
          </form>
        )}

        {/* Addresses List */}
        {loadingAddresses ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={20} />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center italic">
            No saved addresses found. Add an address for effortless checkout.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map(addr => (
              <div
                key={addr.id}
                className="border-[0.5px] border-neutral-200 dark:border-neutral-800 p-4 flex items-start justify-between gap-4"
              >
                <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <strong className="text-neutral-900 dark:text-white font-bold uppercase tracking-wider">
                      {addr.recipientName}
                    </strong>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1">{addr.addressLine}</p>
                  <p>{addr.city}{addr.stateRegion ? `, ${addr.stateRegion}` : ''}, {addr.country}</p>
                  <p className="text-neutral-400 text-[11px] mt-1">Phone: {addr.phone}</p>
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                  title="Remove address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
