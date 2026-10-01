import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquarePlus, 
  X, 
  Sparkles,
  ShieldCheck,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Review, Product } from '../types';
import { INITIAL_REVIEWS, formatReviewTime } from '../data/reviews';
import { PRODUCTS } from '../data/products';

interface ReviewsSectionProps {
  onSelectProduct?: (product: Product) => void;
  products?: Product[];
  reviews?: Review[];
  onAddReview?: (review: Review) => void;
}

const STORAGE_KEY = 'konichiwa_customer_reviews_v5';

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ 
  onSelectProduct, 
  products,
  reviews: externalReviews,
  onAddReview
}) => {
  const activeProducts = products && products.length > 0 ? products : PRODUCTS;

  const [reviews, setReviews] = useState<Review[]>(() => {
    if (externalReviews && externalReviews.length > 0) {
      return externalReviews;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_REVIEWS;
  });

  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('All');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [skinType, setSkinType] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(activeProducts[0]?.id || PRODUCTS[0].id);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setReviewImage(canvas.toDataURL('image/jpeg', 0.82));
        }
        setIsCompressingPhoto(false);
      };
      img.onerror = () => setIsCompressingPhoto(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsCompressingPhoto(false);
    reader.readAsDataURL(file);
  };

  // Sync external reviews if provided
  useEffect(() => {
    if (externalReviews && externalReviews.length > 0) {
      setReviews(externalReviews);
    }
  }, [externalReviews]);

  // Fetch verified reviews from server on mount so Chrome and all devices get live reviews
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => {
        if (!isCancelled && data?.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.reviews));
          } catch {}
        }
      })
      .catch(() => {});
    return () => { isCancelled = true; };
  }, []);

  // Persist reviews locally as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {}
  }, [reviews]);

  // All reviews sorted newest first based on timestamp / createdAt
  const displayedReviews = [...reviews].sort((a, b) => {
    const timeA = (typeof a.timestamp === 'number' && !isNaN(a.timestamp))
      ? a.timestamp
      : (a.createdAt ? Date.parse(a.createdAt) : 0);
    const timeB = (typeof b.timestamp === 'number' && !isNaN(b.timestamp))
      ? b.timestamp
      : (b.createdAt ? Date.parse(b.createdAt) : 0);
    return timeB - timeA;
  });

  // Filter products: show products that have reviews
  const productsWithReviews = activeProducts.filter(product => {
    return displayedReviews.some(
      r => r.productId === product.id || (product.slug && r.productId === product.slug)
    );
  });

  // If selected filter product no longer has reviews, fallback to 'All'
  useEffect(() => {
    if (selectedProductFilter !== 'All') {
      const match = productsWithReviews.some(
        p => p.id === selectedProductFilter || (p.slug && p.slug === selectedProductFilter)
      );
      if (!match) {
        setSelectedProductFilter('All');
      }
    }
  }, [productsWithReviews, selectedProductFilter]);

  const handleHelpful = async (reviewId: string) => {
    if (helpfulVotes[reviewId]) return;

    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
    );
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: true }));
    try {
      await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, { method: 'POST' });
    } catch {}
  };

  const handleOpenProduct = (productId?: string) => {
    if (!onSelectProduct || !productId) return;
    const found = activeProducts.find(p => p.id === productId || p.slug === productId);
    if (found) onSelectProduct(found);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !headline.trim() || !comment.trim()) {
      setFormError('Please fill in your name, headline, and review thoughts.');
      return;
    }

    setIsSubmitting(true);
    const matchedProduct = activeProducts.find(p => p.id === selectedProductId || p.slug === selectedProductId);
    const nowIso = new Date().toISOString();
    const newReview: Review = {
      id: `user-rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: author.trim(),
      location: location.trim() || 'Verified Customer',
      rating,
      date: 'Just now',
      createdAt: nowIso,
      timestamp: Date.now(),
      verified: true,
      productId: selectedProductId,
      productName: matchedProduct ? matchedProduct.title : 'Japanese Skincare Essential',
      skinType: skinType.trim() || 'All Skin Types',
      headline: headline.trim(),
      comment: comment.trim(),
      helpfulCount: 0,
      imageUrl: reviewImage || undefined,
      status: 'approved'
    };

    // Optimistic local update
    setReviews(prev => [newReview, ...prev]);
    setIsWriteModalOpen(false);

    // Persist to server API & Supabase
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.review) {
          setReviews(prev => prev.map(r => r.id === newReview.id ? data.review : r));
        }
      }
    } catch (err) {
      console.warn('[Review Submit] Server sync notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    if (onAddReview) {
      onAddReview(newReview);
    }

    // Reset fields
    setAuthor('');
    setLocation('');
    setSkinType('');
    setHeadline('');
    setComment('');
    setReviewImage('');
    setFormError('');

    // Trigger toast notification
    setToastMessage('Thank you! Your verified review has been published.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredReviews = selectedProductFilter === 'All'
    ? displayedReviews
    : displayedReviews.filter(r => {
        if (r.productId === selectedProductFilter) return true;
        const matched = activeProducts.find(p => p.id === selectedProductFilter || p.slug === selectedProductFilter || (p.dbId && p.dbId === selectedProductFilter));
        if (matched) {
          return r.productId === matched.id || (matched.slug && r.productId === matched.slug) || (matched.dbId && r.productId === matched.dbId);
        }
        return false;
      });

  const averageRating = (
    displayedReviews.reduce((acc, r) => acc + r.rating, 0) / (displayedReviews.length || 1)
  ).toFixed(1);

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-10 sm:py-16 border-t border-pink-100/70 dark:border-zinc-800">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold py-3 px-5 rounded-full shadow-2xl flex items-center gap-2 border border-pink-500/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Rating Overview */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Reviews
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-900 dark:text-white ml-1">{averageRating}</span>
              <span className="text-slate-400">/ 5.0</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{displayedReviews.length} Verified Customer Reviews from Japan Batches</span>
            </div>
          </div>
        </div>

        {/* Action Button: Write a Review */}
        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 text-xs font-semibold border border-pink-200/90 dark:border-slate-700 shadow-xs hover:border-pink-300 dark:hover:border-pink-500/40 transition-all cursor-pointer flex-shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Product Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedProductFilter('All')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
            selectedProductFilter === 'All'
              ? 'bg-pink-600 text-white border-pink-600 font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-800/90 hover:bg-pink-50/40 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium'
          }`}
        >
          All Reviews ({displayedReviews.length})
        </button>

        {productsWithReviews.map(product => {
          const count = displayedReviews.filter(
            r => r.productId === product.id || (product.slug && r.productId === product.slug)
          ).length;
          const isSelected = selectedProductFilter === product.id || selectedProductFilter === product.slug;
          const shortTitle = product.title.split(' ').slice(0, 2).join(' ');
          return (
            <button
              key={product.id}
              onClick={() => setSelectedProductFilter(product.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'bg-pink-600 text-white border-pink-600 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800/90 hover:bg-pink-50/40 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium'
              }`}
            >
              {shortTitle} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">No reviews yet for this product</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Be the first to share your experience with this Japan skincare essential!</p>
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer"
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white/95 dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-pink-100/90 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header: Stars & Dynamic Relative Timeline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 dark:fill-slate-800 text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Dynamic Timeline - Updates automatically every single day */}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {formatReviewTime(rev)}
                  </span>
                </div>

                {/* Review Headline */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  &ldquo;{rev.headline}&rdquo;
                </h3>

                {/* Comment Text */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>

                {/* Associated Product Pill */}
                {rev.productName && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleOpenProduct(rev.productId)}
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100/80 dark:hover:bg-pink-900/60 px-2.5 py-1 rounded-lg border border-pink-200/50 dark:border-pink-800/50 transition-colors cursor-pointer"
                      title="Click to view product details"
                    >
                      <Sparkles className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                      <span className="truncate max-w-[200px]">{rev.productName}</span>
                    </button>
                  </div>
                )}

                {/* Customer Photo */}
                {rev.imageUrl && (
                  <div className="pt-2">
                    <img 
                      src={rev.imageUrl} 
                      alt="Customer review photo" 
                      className="w-full max-h-48 object-cover rounded-xl border border-pink-100 dark:border-zinc-800 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Reviewer Info & Helpful Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-[11.5px]">
                    <span>{rev.author}</span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {rev.location} {rev.skinType ? `• ${rev.skinType}` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleHelpful(rev.id)}
                  disabled={helpfulVotes[rev.id]}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    helpfulVotes[rev.id]
                      ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Mark as helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{rev.helpfulCount}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-pink-50/50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Write a Verified Review</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Share your real results with the community</p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitReview} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {formError}
                </div>
              )}

              {/* Product selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Rating *
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 dark:fill-zinc-800 text-slate-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              {/* Name & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhika S."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, MH"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>

              {/* Skin Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skin Type / Concern (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Combination, Textured, Humid Climate"
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Holy grail sunscreen, zero white cast!"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe texture, absorption, how it felt after application, packaging authentic seals, delivery speed..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                    <span>Upload Product Photo (Optional)</span>
                  </span>
                  {isCompressingPhoto && (
                    <span className="text-[10px] text-pink-600 font-medium">Compressing photo...</span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isCompressingPhoto}
                  className="w-full text-xs file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-50 dark:file:bg-zinc-800 file:text-pink-700 dark:file:text-pink-300 hover:file:bg-pink-100 dark:hover:file:bg-zinc-700 cursor-pointer text-slate-500 dark:text-slate-400"
                />
                {reviewImage && (
                  <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-pink-200 dark:border-zinc-700 shadow-2xs">
                    <img src={reviewImage} alt="Review upload preview" className="w-24 h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => setReviewImage('')}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                      title="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
