import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminCustomRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetCustomRequests();
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load custom requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await api.adminUpdateCustomRequestStatus(id, status);
      if (res.success) {
        toast(`Request status updated to ${status}.`, "success");
        setRequests((prev: any[]) =>
          prev.map(req => (req.id === id ? { ...req, status } : req))
        );
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest((prev: any) => ({ ...prev, status }));
        }
      }
    } catch (err: any) {
      toast(err.message || "Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenWhatsApp = (req: any) => {
    // Generate prefilled custom shoe request layout for seller-initiated contact
    let message = `Hello,\n\nI am contacting you regarding your ARGYR custom shoe request.\n\n`;
    message += `Reference Request: ${req.requestReference}\n`;
    message += `Shoe Silhouette: ${req.categoryName}\n`;
    message += `Size: ${req.shoeSize}\n`;
    message += `Preferred Colour: ${req.preferredColour}\n`;
    message += `Preferred Material: ${req.preferredMaterial}\n`;
    message += `Quantity: ${req.quantity} pair(s)\n\n`;
    message += `Customisation description:\n"${req.description}"\n\n`;
    message += `I have reviewed your design request and would like to discuss availability, pricing, and confirm delivery details.`;

    const customerPhoneClean = req.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Custom Requests</h1>
        <span className="text-xs text-neutral-400">Review bespoke footwear design submissions</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: REQUESTS TABLE (SPAN 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border-thin overflow-x-auto shadow-sm">
          {requests.length === 0 ? (
            <p className="text-xs text-neutral-400 py-12 text-center">No custom requests found.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-950 border-thin-b uppercase text-neutral-400 tracking-wider font-semibold">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Shoe Style</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`border-thin-b hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 cursor-pointer ${
                      selectedRequest?.id === req.id ? 'bg-neutral-50 dark:bg-neutral-950' : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-semibold tracking-wider text-neutral-900 dark:text-neutral-100">
                      {req.requestReference}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-neutral-900 dark:text-white">{req.customerName}</span>
                        <span className="text-[10px] text-neutral-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 uppercase tracking-wider text-[10px]">
                      {req.categoryName} ({req.shoeSize})
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={req.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(req.id, e.target.value);
                        }}
                        disabled={updatingId === req.id}
                        className="bg-transparent border-[0.5px] border-neutral-300 dark:border-neutral-700 text-[10px] uppercase font-bold py-1 px-2 outline-none cursor-pointer dark:bg-neutral-900"
                      >
                        <option value="NEW" className="dark:bg-neutral-950">New</option>
                        <option value="REVIEWING" className="dark:bg-neutral-950">Reviewing</option>
                        <option value="ACCEPTED" className="dark:bg-neutral-950">Accepted</option>
                        <option value="REJECTED" className="dark:bg-neutral-950">Rejected</option>
                        <option value="COMPLETED" className="dark:bg-neutral-950">Completed</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhatsApp(req);
                        }}
                        className="p-2 border-thin text-brand-clay dark:text-brand-gold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center ml-auto cursor-pointer"
                        title="Contact Customer on WhatsApp"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED VIEW (SPAN 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border-thin p-6 flex flex-col gap-6 shadow-sm">
          {selectedRequest ? (
            <div className="flex flex-col gap-5 text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start border-thin-b pb-3">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-semibold tracking-wider font-mono text-neutral-900 dark:text-white">
                    {selectedRequest.requestReference}
                  </h3>
                  <span className="text-[10px] text-neutral-400">Received: {new Date(selectedRequest.createdAt).toLocaleString()}</span>
                </div>

                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  selectedRequest.status === 'NEW' ? 'bg-purple-100 text-purple-800' :
                  selectedRequest.status === 'REVIEWING' ? 'bg-blue-100 text-blue-800' :
                  selectedRequest.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  'bg-neutral-200 text-neutral-800'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>

              {/* Customer Coordinates */}
              <div className="flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-950 p-4 border-thin">
                <h4 className="text-[10px] uppercase font-bold text-neutral-450 dark:text-neutral-400">Customer Coordinates</h4>
                <div className="flex flex-col gap-1.5 leading-relaxed text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">{selectedRequest.customerName}</span>
                  <span className="flex items-center gap-1.5"><Phone size={12} /> {selectedRequest.customerPhone}</span>
                  {selectedRequest.customerEmail && <span className="flex items-center gap-1.5"><Mail size={12} /> {selectedRequest.customerEmail}</span>}
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} /> {selectedRequest.city}, {selectedRequest.country}
                    {selectedRequest.deliveryAddress ? ` (Address: ${selectedRequest.deliveryAddress})` : ''}
                  </span>
                </div>
              </div>

              {/* Design specifications */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-neutral-50 dark:bg-neutral-950 p-4 border-thin">
                <div>
                  <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Silhouette Category</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{selectedRequest.categoryName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Sizes / Gender fit</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{selectedRequest.shoeSize} / {selectedRequest.gender}</span>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Color preference</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{selectedRequest.preferredColour}</span>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Material texture</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{selectedRequest.preferredMaterial}</span>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Build quantity</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{selectedRequest.quantity} pair(s)</span>
                </div>
                {selectedRequest.referenceProduct && (
                  <div>
                    <span className="text-neutral-400 uppercase block mb-0.5 text-[9px]">Reference Product</span>
                    <span className="font-semibold text-neutral-900 dark:text-white text-[11px] truncate block">
                      {selectedRequest.referenceProduct.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Description concept text */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[10px] uppercase font-bold text-neutral-450 dark:text-neutral-400">Customization Concept</h4>
                <p className="p-3 bg-neutral-50 dark:bg-neutral-950 border-thin font-mono leading-relaxed text-neutral-750 dark:text-neutral-250">
                  "{selectedRequest.description}"
                </p>
              </div>

              {/* Additional notes */}
              {selectedRequest.additionalNotes && (
                <div className="flex flex-col gap-1">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-450 dark:text-neutral-400">Additional Sizing Notes</h4>
                  <p className="p-3 bg-neutral-50 dark:bg-neutral-950 border-thin italic leading-relaxed text-neutral-600 dark:text-neutral-350">
                    "{selectedRequest.additionalNotes}"
                  </p>
                </div>
              )}

              {/* Image Attachments Lightbox */}
              {selectedRequest.images.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-450 dark:text-neutral-400">
                    Image Attachments ({selectedRequest.images.length})
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedRequest.images.map((img: any) => (
                      <button
                        type="button"
                        key={img.id}
                        onClick={() => setActiveLightboxImage(img.url)}
                        className="w-16 h-16 bg-neutral-100 dark:bg-neutral-955 border-thin overflow-hidden cursor-pointer hover:border-neutral-400 transition-colors"
                      >
                        <img src={img.url} alt="Custom request sketch" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Contact Button */}
              <button
                onClick={() => handleOpenWhatsApp(selectedRequest)}
                className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <MessageSquare size={14} />
                <span>Contact on WhatsApp</span>
              </button>

            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
              <Sparkles size={24} className="mb-2" />
              <p className="text-xs">Select a request reference code to inspect detailed design specs.</p>
            </div>
          )}
        </div>

      </div>

      {/* LIGHTBOX OVERLAY WINDOW */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full flex items-center justify-center">
            <img 
              src={activeLightboxImage} 
              alt="Bespoke attachment full screen" 
              className="max-w-full max-h-[85vh] object-contain border-[0.5px] border-neutral-700 shadow-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
};
