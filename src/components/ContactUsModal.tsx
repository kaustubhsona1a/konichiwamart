import React, { useState } from 'react';
import { 
  X, 
  Mail, 
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
  instagramHandle = '@konichiwa_mart',
  instagramUrl = 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    topic: 'Product Inquiry',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock background body scroll when open and handle ESC
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 sm:my-auto">
        
        {/* Top Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-pink-100/70 dark:border-zinc-800 bg-gradient-to-b from-pink-50/50 to-white dark:from-zinc-850 dark:to-zinc-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-zinc-100 tracking-tight">
                Contact Konichiwa<span className="text-pink-600 dark:text-pink-400">_Mart</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 uppercase tracking-wider border border-pink-200 dark:border-pink-800">
                Support Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              We are here to assist with products, order status, or skincare consultations.
            </p>
          </div>

          <button
            id="contact-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-pink-100 dark:hover:bg-zinc-700 hover:text-pink-600 dark:hover:text-pink-400 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-700"
            aria-label="Close Contact Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-left">
          
          {/* Quick Direct Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Email */}
            <a
              id="contact-channel-email"
              href="mailto:info@konichiwamart.com"
              className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 block">Email Support</span>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block truncate">info@konichiwamart.com</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">Replies within 2 hours</span>
              </div>
            </a>

            {/* Instagram */}
            <a
              id="contact-channel-instagram"
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-purple-200/80 dark:border-purple-900/60 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">Instagram DM</span>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block truncate">{instagramHandle}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">Community & updates</span>
              </div>
            </a>

          </div>

          {/* Operating Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-300">
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
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Send a Direct Message</span>
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">All fields required</span>
            </div>

            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-2 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Message Received Arigatō!</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Our Japan skincare desk has received your note and will reach out to <strong>{formData.contact}</strong> promptly.
                </p>
                <button
                  onClick={handleResetForm}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/50 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Phone Number or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210 or name@example.com"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    What can we help you with?
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30"
                  >
                    <option value="Product Inquiry">Product Recommendation & Ingredients</option>
                    <option value="Order & Tracking">Order Status & Courier Tracking</option>
                    <option value="Authenticity Check">Authenticity Verification & Batch Code</option>
                    <option value="Gifting / Bulk">Gifting, Corporate & Bulk Sourcing</option>
                    <option value="Other">General Feedback or Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Your Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about your skincare goal or any question regarding our Japan direct catalog..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 resize-none"
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
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <Mail className="w-3.5 h-3.5 text-pink-500" />
            <span>Support: info@konichiwamart.com</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
