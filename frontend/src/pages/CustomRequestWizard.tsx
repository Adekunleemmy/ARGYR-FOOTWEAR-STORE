import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Upload, X, Check, Loader2, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { PageTransition } from '../components/PageTransition';

export const CustomRequestWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Form Fields State
  const [categoryName, setCategoryName] = useState('Oxford');
  const [productId, setProductId] = useState(''); // referenced product
  const [gender, setGender] = useState('UNISEX');
  const [shoeSize, setShoeSize] = useState('42');
  const [preferredColour, setPreferredColour] = useState('');
  const [preferredMaterial, setPreferredMaterial] = useState('Calf Leather');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Upload Previews State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Load products list for reference on mount
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.getProducts();
        if (res.success) {
          setProductsList(res.products);
        }
      } catch (e) {
        console.error("Failed to load products list:", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      
      // Limit to 5 files total
      if (selectedFiles.length + filesArr.length > 5) {
        toast("You can upload a maximum of 5 reference images.", "error");
        return;
      }

      // Check size limit: 5MB per file
      const overSizeLimit = filesArr.some(file => file.size > 5 * 1024 * 1024);
      if (overSizeLimit) {
        toast("Each image must be smaller than 5MB.", "error");
        return;
      }

      setSelectedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    // Validate current step fields
    if (step === 1 && !categoryName) {
      toast("Please specify a shoe category.", "error");
      return;
    }
    if (step === 2) {
      if (!shoeSize) {
        toast("Please select a shoe size.", "error");
        return;
      }
      if (!preferredColour) {
        toast("Please describe your preferred color.", "error");
        return;
      }
      if (!preferredMaterial) {
        toast("Please specify a leather or fabric material.", "error");
        return;
      }
    }
    if (step === 3 && description.trim().length < 10) {
      toast("Please describe your custom request in detail (min 10 characters).", "error");
      return;
    }
    if (step === 5) {
      if (!customerName) {
        toast("Please provide your name.", "error");
        return;
      }
      if (!customerPhone || customerPhone.length < 5) {
        toast("Please provide a valid WhatsApp phone number.", "error");
        return;
      }
      if (!country) {
        toast("Please provide your country.", "error");
        return;
      }
      if (!city) {
        toast("Please provide your city.", "error");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmitCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName);
      formData.append('customerPhone', customerPhone);
      if (customerEmail) formData.append('customerEmail', customerEmail);
      if (productId) formData.append('productId', productId);
      formData.append('categoryName', categoryName);
      formData.append('gender', gender);
      formData.append('shoeSize', shoeSize);
      formData.append('preferredColour', preferredColour);
      formData.append('preferredMaterial', preferredMaterial);
      formData.append('quantity', String(quantity));
      formData.append('description', description);
      if (additionalNotes) formData.append('additionalNotes', additionalNotes);
      formData.append('country', country);
      formData.append('city', city);
      if (deliveryAddress) formData.append('deliveryAddress', deliveryAddress);

      // Append image files
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await api.createCustomRequest(formData);
      if (res.success) {
        setSuccessData(res.request);
        toast("Your custom shoe request has been successfully registered.", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to submit request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getRefProductName = () => {
    const found = productsList.find(p => p.id === productId);
    return found ? found.name : 'None';
  };

  // SUCCESS STATE VIEW
  if (successData) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center rounded-none shadow-md">
          <Check size={28} />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide">Request Received</h1>
        <div className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
          Ref: {successData.requestReference}
        </div>
        <p className="text-sm text-neutral-500 leading-relaxed font-light">
          Your ARGYR custom shoe request has been registered in our database. To complete the consultation and discuss pricing, payment, and delivery options, click the button below to message us directly on WhatsApp.
        </p>
        <a
          href={successData.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-8 py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity flex items-center justify-center gap-2 w-full"
        >
          <MessageSquare size={14} />
          <span>Continue on WhatsApp</span>
        </a>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-16 w-full flex flex-col gap-10">
      
      {/* Header Statement */}
      <div className="flex flex-col gap-2 border-thin-b pb-6">
        <div className="flex items-center gap-2 text-brand-clay dark:text-brand-gold text-xs uppercase tracking-widest font-bold">
          <Sparkles size={14} />
          <span>Bespoke Consultation Wizard</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide">Tell us what you're imagining.</h1>
        <span className="text-xs text-neutral-400">Step {step} of 6</span>
      </div>

      <form onSubmit={handleSubmitCustomRequest} className="flex flex-col gap-8">
        
        {/* STEP 1: STYLE / REFERENCE */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                01. What category of shoe style?
              </h2>
              <p className="text-xs text-neutral-400">Select the broad style silhouette you would like designed.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Oxford", "Derby", "Loafer", "Chelsea Boot", "Runner Sneaker", "Slide sandal", "Other"].map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategoryName(cat)}
                  className={`border-thin py-3 text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    categoryName === cat 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold border-neutral-900 dark:border-white' 
                      : 'hover:border-neutral-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
                Reference an existing product? (Optional)
              </label>
              {loadingProducts ? (
                <span className="text-xs text-neutral-400">Loading catalog references...</span>
              ) : (
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full cursor-pointer dark:bg-neutral-900"
                >
                  <option value="" className="dark:bg-neutral-950">None - Custom build from scratch</option>
                  {productsList.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-neutral-950">
                      Based on: {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
                Gender Fit
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["UNISEX", "MEN", "WOMEN", "KIDS"].map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`border-thin py-2 text-xs uppercase tracking-widest ${
                      gender === g ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold border-neutral-900' : ''
                    }`}
                  >
                    {g.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREFERENCES */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                02. Size and Leather material details
              </h2>
              <p className="text-xs text-neutral-400">Specify your size fit and choice of material textures.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Shoe Size</label>
              <div className="flex flex-wrap gap-2">
                {["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"].map(sz => (
                  <button
                    type="button"
                    key={sz}
                    onClick={() => setShoeSize(sz)}
                    className={`w-11 h-11 border-thin text-xs font-semibold flex items-center justify-center ${
                      shoeSize === sz ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold border-neutral-900' : ''
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Preferred Colour</label>
              <input
                type="text"
                placeholder="e.g. Chestnut Tan, Forest Green blocks, Matte Black"
                value={preferredColour}
                onChange={(e) => setPreferredColour(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Preferred Material</label>
              <input
                type="text"
                placeholder="e.g. Suede leather, Box calf leather, Grained pebbled leather"
                value={preferredMaterial}
                onChange={(e) => setPreferredMaterial(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Quantity:</span>
              <div className="flex items-center border-thin">
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold font-mono">{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CUSTOMISATION DESCRIPTION */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                03. Customization Details
              </h2>
              <p className="text-xs text-neutral-400">Describe your ideas. Write in natural language what customizations you want.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
                Explain your customization requirements (Min 10 chars)
              </label>
              <textarea
                placeholder="e.g. 'I want the outsole changed to a black lugged rubber driver sole. Also, I would like my initials (A.S) hot-stamped in gold on the outer heel counter.'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full h-32 resize-none leading-relaxed"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
                Additional Instructions (Optional)
              </label>
              <textarea
                placeholder="Any special requests or sizing requirements (e.g. wide fit, extra arch support)..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full h-24 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 4: IMAGE UPLOADS */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                04. Upload reference photos
              </h2>
              <p className="text-xs text-neutral-400">Upload up to 5 photos (designs, sketches, or color schemes) under 5MB each.</p>
            </div>

            {/* Custom Drag and drop area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-thin border-dashed p-8 text-center flex flex-col items-center gap-3 cursor-pointer hover:bg-neutral-100/40 dark:hover:bg-neutral-900/40 transition-colors"
            >
              <Upload className="text-neutral-400" size={24} />
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-850 dark:text-neutral-200">
                Click to browse photo assets
              </div>
              <span className="text-[10px] text-neutral-400">Accepted formats: JPG, JPEG, PNG, WEBP (Max 5MB)</span>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/jpeg, image/jpg, image/png, image/webp"
                className="hidden"
              />
            </div>

            {/* Image Previews */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-2">
                {selectedFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative w-24 aspect-square border-thin overflow-hidden">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-none cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: CONTACT INFORMATION */}
        {step === 5 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                05. Contact & Delivery Address
              </h2>
              <p className="text-xs text-neutral-400">Provide coordinate details for delivery and consultation.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Your Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">WhatsApp Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +2348012345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Country</label>
                <input
                  type="text"
                  placeholder="Nigeria"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">City</label>
                <input
                  type="text"
                  placeholder="e.g. Lagos"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">Delivery Address (Optional)</label>
              <input
                type="text"
                placeholder="Specify your door-step delivery details"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="bg-transparent border-thin px-4 py-3 text-xs text-neutral-900 dark:text-white outline-none w-full"
              />
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW SUMMARY */}
        {step === 6 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm uppercase tracking-wider font-semibold text-neutral-900 dark:text-white">
                06. Review Design specifications
              </h2>
              <p className="text-xs text-neutral-400">Review your customized build specifications before submitting.</p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900/40 border-thin p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Silhouette Style</span>
                  <span className="font-semibold text-sm">{categoryName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Ref Product</span>
                  <span className="font-semibold text-sm">{getRefProductName()}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Size / Gender</span>
                  <span className="font-semibold text-sm">{shoeSize} / {gender}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Quantity</span>
                  <span className="font-semibold text-sm">{quantity} pair(s)</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Color Preference</span>
                  <span className="font-semibold text-sm">{preferredColour}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase mb-0.5">Material choice</span>
                  <span className="font-semibold text-sm">{preferredMaterial}</span>
                </div>
              </div>

              <div className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-3 mt-1">
                <span className="text-neutral-400 block uppercase mb-1">Customization Concept</span>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono">
                  "{description}"
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-3">
                  <span className="text-neutral-400 block uppercase mb-2">Attached Images ({selectedFiles.length})</span>
                  <div className="flex gap-2">
                    {selectedFiles.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-[10px] uppercase font-mono">
                        {f.name.slice(0, 12)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-3">
                <span className="text-neutral-400 block uppercase mb-1">Customer Coordinate details</span>
                <div className="flex flex-col gap-1">
                  <span>Name: <strong className="font-semibold">{customerName}</strong></span>
                  <span>WhatsApp: <strong className="font-semibold">{customerPhone}</strong></span>
                  <span>Delivery to: <strong className="font-semibold">{city}, {country}</strong></span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 text-center leading-normal">
              Submitting this form registers your enquiry inside our studio. You will receive a prefilled message layout to open WhatsApp, where our design team will finalize terms, pricing, and confirm delivery.
            </p>
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex justify-between items-center border-t-[0.5px] border-neutral-200 dark:border-neutral-800 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 border-thin text-xs uppercase tracking-widest font-bold hover:bg-neutral-100 dark:hover:bg-neutral-850 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-4 bg-brand-clay text-white text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer ml-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Submitting specs...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Register Design Request</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
    </PageTransition>
  );
};
