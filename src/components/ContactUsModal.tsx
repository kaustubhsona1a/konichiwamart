import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Instagram, 
  Send, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instagramHandle?: string;
  instagramUrl?: string;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  isOpen,
  onClose,
  instagramHandle = '@konichiwa.mart',
  instagramUrl = 'https://www.instagram.com'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    topic: 'Product Inquiry',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Save contact inquiry locally for reference
      try {
        const stored = localStorage.getItem('km_inquiries') || '[]';
        const list = JSON.parse(stored);
        list.unshift({
          ...formData,
          id: `inq_${Date.now()}`,
          date: new Date().toISOString()
        });
        localStorage.setItem('km_inquiries', JSON.stringify(list));
      } catch {}
    }, 600);
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      contact: '',
      topic: 'Product Inquiry',
      message: ''
    });
    setIsSubmitted(false);
  };

  return (
    <div 
      id="contact-us-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-pink-100/70 bg-gradient-to-b from-pink-50/50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
                Contact Konichiwa<span className="text-pink-600">_Mart</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 uppercase tracking-wider">
                Support Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              We are here to assist with products, order status, or skincare consultations.
            </p>
          </div>

          <button
            id="contact-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-100 hover:text-pink-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Contact Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-left">
          
          {/* Quick Direct Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* WhatsApp */}
            <a
              id="contact-channel-whatsapp"
              href="https://wa.me/919820012345?text=Hi%20Konichiwa%20Mart%2C%20I%20have%20an%20inquiry%20regarding%20Japanese%20skincare%20products"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">WhatsApp Chat</span>
                <span className="text-xs font-bold text-slate-900 block truncate">+91 98200 12345</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Instant live response</span>
              </div>
            </a>

            {/* Email */}
            <a
              id="contact-channel-email"
              href="mailto:support@konichiwamart.in"
              className="p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-50 border border-rose-200/80 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 block">Email Support</span>
                <span className="text-xs font-bold text-slate-900 block truncate">support@konichiwamart.in</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Replies within 2 hours</span>
              </div>
            </a>

            {/* Instagram */}
            <a
              id="contact-channel-instagram"
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-50 border border-purple-200/80 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Instagram DM</span>
                <span className="text-xs font-bold text-slate-900 block truncate">{instagramHandle}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Community & updates</span>
              </div>
            </a>

          </div>

          {/* Operating Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>
                <strong>Working Hours:</strong> Monday – Saturday, 10:00 AM – 7:00 PM IST
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>
                <strong>Dispatch Facility:</strong> Andheri East, Mumbai 400069
              </span>
            </div>
          </div>

          {/* Message Inquiry Form */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Send a Direct Message</span>
              </h3>
              <span className="text-[11px] text-slate-400">All fields required</span>
            </div>

            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Message Received Arigatō!</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Our Tokyo skincare desk has received your note and will reach out to <strong>{formData.contact}</strong> promptly.
                </p>
                <button
                  onClick={handleResetForm}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-100/50 cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone Number or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210 or name@example.com"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    What can we help you with?
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="Product Inquiry">Product Recommendation & Ingredients</option>
                    <option value="Order & Tracking">Order Status & Courier Tracking</option>
                    <option value="Authenticity Check">Authenticity Verification & Batch Code</option>
                    <option value="Gifting / Bulk">Gifting, Corporate & Bulk Sourcing</option>
                    <option value="Other">General Feedback or Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about your skincare goal or any question regarding our Tokyo direct catalog..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-3.5 h-3.5 text-pink-500" />
            <span>Direct Line: +91 98200 12345</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
