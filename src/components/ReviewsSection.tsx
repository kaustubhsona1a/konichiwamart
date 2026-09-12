import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquarePlus, 
  X, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Review, Product } from '../types';
import { INITIAL_REVIEWS } from '../data/reviews';
import { PRODUCTS } from '../data/products';

interface ReviewsSectionProps {
  onSelectProduct?: (product: Product) => void;
}

const STORAGE_KEY = 'konichiwa_customer_reviews';

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ onSelectProduct }) => {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
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
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews]);

  const handleHelpful = (reviewId: string) => {
    if (helpfulVotes[reviewId]) return;

    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: true }));
  };

  const handleOpenProduct = (productId: string) => {
    if (!onSelectProduct) return;
    const found = PRODUCTS.find(p => p.id === productId);
    if (found) onSelectProduct(found);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !headline.trim() || !comment.trim()) {
      setFormError('Please fill in your name, headline, and review thoughts.');
      return;
    }

    const matchedProduct = PRODUCTS.find(p => p.id === selectedProductId);
    const newReview: Review = {
      id: `user-rev-${Date.now()}`,
      author: author.trim(),
      location: location.trim() || 'Verified Customer',
      rating,
      date: 'Just now',
      verified: true,
      productId: selectedProductId,
      productName: matchedProduct ? matchedProduct.title : 'Japanese Skincare Product',
      skinType: skinType.trim() || 'All Skin Types',
      headline: headline.trim(),
      comment: comment.trim(),
      helpfulCount: 0
    };

    setReviews(prev => [newReview, ...prev]);
    setIsWriteModalOpen(false);

    // Reset fields
    setAuthor('');
    setLocation('');
    setSkinType('');
    setHeadline('');
    setComment('');
    setFormError('');

    // Trigger toast notification
    setToastMessage('Thank you! Your verified review has been published.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredReviews = selectedProductFilter === 'All'
    ? reviews
    : reviews.filter(r => r.productId === selectedProductFilter);

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-10 sm:py-16 border-t border-pink-100/70">
      
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
              <span>{reviews.length} Verified Reviews from Tokyo Import Batches</span>
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
          All Reviews ({reviews.length})
        </button>

        {PRODUCTS.map(product => {
          const count = reviews.filter(r => r.productId === product.id).length;
          return (
            <button
              key={product.id}
              onClick={() => setSelectedProductFilter(product.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
                selectedProductFilter === product.id
                  ? 'bg-pink-600 text-white border-pink-600 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800/90 hover:bg-pink-50/40 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium'
              }`}
            >
              {product.title.split(' ')[0]} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">No reviews yet for this product</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Be the first to share your experience with this Tokyo skincare essential!</p>
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
                {/* Header: Stars & Date */}
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
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{rev.date}</span>
                </div>

                {/* Review Headline */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  "{rev.headline}"
                </h3>

                {/* Comment Text */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>

                {/* Associated Product Pill */}
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Write a Review</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Share your experience with Japanese skincare</p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Product Select */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-pink-500"
                >
                  {PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.volume})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 dark:fill-slate-800 text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g., Best lightweight sunscreen for Indian weather"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Detailed Comments */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Review
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell others how the texture felt, your skin results, scent, and authenticity..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-pink-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Author & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Priya S."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City, State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Skin Type */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Skin Type (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Combination, Oily, Sensitive"
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-sm shadow-pink-600/25 transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
