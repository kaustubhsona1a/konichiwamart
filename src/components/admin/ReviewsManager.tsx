import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  UploadCloud, 
  Search, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  Sparkles, 
  X,
  FileText,
  AlertCircle,
  ThumbsUp,
  Camera
} from 'lucide-react';
import { Review, Product } from '../../types';
import { formatReviewTime } from '../../data/reviews';

interface ReviewsManagerProps {
  products: Product[];
  reviews: Review[];
  onReviewsChange: (reviews: Review[]) => void;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  products,
  reviews,
  onReviewsChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [skinType, setSkinType] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [verified, setVerified] = useState(true);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | '2days' | '3days' | '1week' | '2weeks' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
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

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFormat, setBulkFormat] = useState<'csv' | 'json'>('csv');
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Delete confirmation
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.reviews)) {
          onReviewsChange(data.reviews);
          showToast(`Synced ${data.reviews.length} reviews from server`);
        }
      }
    } catch {
      showToast('Error syncing reviews');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !headline.trim() || !comment.trim()) {
      setFormError('Please fill in Author Name, Headline, and Detailed Comment.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // Determine target ISO creation date
    let targetIso = new Date().toISOString();
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (dateOption === 'yesterday') {
      targetIso = new Date(now - ONE_DAY).toISOString();
    } else if (dateOption === '2days') {
      targetIso = new Date(now - 2 * ONE_DAY).toISOString();
    } else if (dateOption === '3days') {
      targetIso = new Date(now - 3 * ONE_DAY).toISOString();
    } else if (dateOption === '1week') {
      targetIso = new Date(now - 7 * ONE_DAY).toISOString();
    } else if (dateOption === '2weeks') {
      targetIso = new Date(now - 14 * ONE_DAY).toISOString();
    } else if (dateOption === 'custom' && customDate) {
      const parsed = Date.parse(customDate);
      if (!isNaN(parsed)) {
        targetIso = new Date(parsed).toISOString();
      }
    }

    const matchedProduct = products.find(p => p.id === selectedProductId || p.slug === selectedProductId);

    const payload = {
      author: author.trim(),
      location: location.trim() || 'Verified Buyer',
      rating,
      verified,
      productId: selectedProductId || products[0]?.id || 'general',
      productName: matchedProduct ? matchedProduct.title : 'Japanese Skincare Essential',
      skinType: skinType.trim() || 'All Skin Types',
      headline: headline.trim(),
      comment: comment.trim(),
      imageUrl: reviewImage || undefined,
      createdAt: targetIso
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.review) {
          onReviewsChange([data.review, ...reviews]);
          setIsAddModalOpen(false);
          showToast('Review created and published successfully!');
          // Reset fields
          setAuthor('');
          setLocation('');
          setSkinType('');
          setHeadline('');
          setComment('');
          setReviewImage('');
          setDateOption('today');
          setCustomDate('');
        }
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to submit review');
      }
    } catch {
      setFormError('Network error connecting to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    setBulkError('');
    if (!bulkInputText.trim()) {
      setBulkError('Please paste your CSV rows or JSON array.');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      let parsedReviews: any[] = [];

      if (bulkFormat === 'json') {
        const raw = JSON.parse(bulkInputText);
        if (!Array.isArray(raw)) throw new Error('Input must be a JSON array of review objects.');
        parsedReviews = raw;
      } else {
        // Parse CSV format:
        // Format: Author, Location, Product, Rating, Headline, Comment, DaysAgo
        const lines = bulkInputText.split('\n').map(l => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip header row if user included it
          if (i === 0 && line.toLowerCase().includes('author') && line.toLowerCase().includes('headline')) {
            continue;
          }
          const parts = line.split('|').length > 1 ? line.split('|') : line.split(',');
          if (parts.length >= 4) {
            const rAuthor = (parts[0] || '').trim();
            const rLocation = (parts[1] || '').trim();
            const rProd = (parts[2] || '').trim();
            const rRating = parseInt((parts[3] || '5').trim(), 10) || 5;
            const rHead = (parts[4] || '').trim();
            const rComm = (parts.slice(5).join(',') || '').trim();

            const matchedProduct = products.find(p => 
              p.id === rProd || 
              (p.slug && p.slug === rProd) || 
              p.title.toLowerCase().includes(rProd.toLowerCase())
            );

            parsedReviews.push({
              author: rAuthor || 'Verified Customer',
              location: rLocation || 'Verified Buyer',
              productId: matchedProduct ? matchedProduct.id : (products[0]?.id || 'general'),
              productName: matchedProduct ? matchedProduct.title : 'Japanese Skincare Essential',
              rating: rRating,
              headline: rHead || 'Excellent Japanese Formula',
              comment: rComm || rHead || 'Great results and fast shipping.',
              verified: true,
              createdAt: new Date(Date.now() - i * 24 * 3600 * 1000).toISOString()
            });
          }
        }
      }

      if (parsedReviews.length === 0) {
        throw new Error('No valid review rows could be extracted. Please check the format.');
      }

      const res = await fetch('/api/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: parsedReviews })
      });

      if (res.ok) {
        const data = await res.json();
        await handleRefresh();
        setIsBulkModalOpen(false);
        setBulkInputText('');
        showToast(`Successfully uploaded ${data.count || parsedReviews.length} reviews!`);
      } else {
        const err = await res.json();
        setBulkError(err.error || 'Bulk upload failed on server');
      }
    } catch (e: any) {
      setBulkError(e.message || 'Failed to parse review data.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewToDelete.id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onReviewsChange(reviews.filter(r => r.id !== reviewToDelete.id));
        showToast('Review removed permanently.');
      }
    } catch {
      showToast('Error deleting review');
    } finally {
      setReviewToDelete(null);
    }
  };

  // Filter reviews
  const filtered = reviews.filter(rev => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        rev.author.toLowerCase().includes(q) ||
        rev.headline.toLowerCase().includes(q) ||
        rev.comment.toLowerCase().includes(q) ||
        (rev.productName && rev.productName.toLowerCase().includes(q)) ||
        rev.location.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Product filter
    if (selectedProductFilter !== 'All') {
      if (rev.productId !== selectedProductFilter) return false;
    }

    // Rating filter
    if (selectedRatingFilter !== 'All') {
      if (rev.rating !== parseInt(selectedRatingFilter, 10)) return false;
    }

    return true;
  });

  // Calculate statistics
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1) 
    : '5.0';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const verifiedCount = reviews.filter(r => r.verified).length;

  return (
    <div className="space-y-6 text-left">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold py-3 px-5 rounded-full shadow-2xl flex items-center gap-2 border border-pink-500/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reviews</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Live on Storefront
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <span>{avgRating}</span>
            <div className="flex text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Out of 5.0 stars
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5-Star Ratings</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{fiveStarCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {totalCount > 0 ? `${Math.round((fiveStarCount / totalCount) * 100)}% of total` : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Buyers</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{verifiedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Authenticated
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search author, comments, headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          {/* Product Filter */}
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 max-w-[180px]"
          >
            <option value="All">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Star Filter */}
          <select
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
          </select>
        </div>

        {/* Buttons: Add, Bulk Upload, Refresh */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh from server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk Upload</span>
          </button>

          <button
            onClick={() => {
              if (products.length > 0 && !selectedProductId) {
                setSelectedProductId(products[0].id);
              }
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 space-y-3">
          <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No reviews found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {reviews.length === 0
              ? 'No reviews have been uploaded yet. Click "+ Add Review" or "Bulk Upload" to populate customer feedback.'
              : 'Try clearing your search or filter parameters to see all reviews.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rev) => {
            const targetProd = products.find(p => p.id === rev.productId || (p.slug && p.slug === rev.productId));
            return (
              <div 
                key={rev.id} 
                className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top Bar: Stars, Date, Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 ml-1">
                        {rev.rating}.0
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatReviewTime(rev)}
                      </span>
                      <button
                        onClick={() => setReviewToDelete(rev)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="font-bold text-sm text-slate-900 mt-2">
                    &ldquo;{rev.headline}&rdquo;
                  </h4>

                  {/* Comment */}
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                    {rev.comment}
                  </p>

                  {/* Customer Photo */}
                  {rev.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={rev.imageUrl} 
                        alt="Customer photo" 
                        className="w-full max-h-36 object-cover rounded-lg border border-stone-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Associated Product */}
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                    {targetProd?.image && (
                      <img 
                        src={targetProd.image} 
                        alt={targetProd.title} 
                        className="w-7 h-7 rounded-lg object-cover border border-stone-200 shrink-0" 
                      />
                    )}
                    <div className="truncate flex-1">
                      <div className="text-[10.5px] font-bold text-slate-800 truncate">
                        {rev.productName || targetProd?.title || 'Japanese Skincare Essential'}
                      </div>
                      <div className="text-[9.5px] text-slate-400">
                        Product ID: {rev.productId || 'general'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Author Details & Helpful count */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                      <span>{rev.author}</span>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {rev.location} {rev.skinType ? `• ${rev.skinType}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{rev.helpfulCount || 0} helpful</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Upload / Add Customer Review</h3>
                <p className="text-[11px] text-slate-500">Post a verified review that appears on the website immediately</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Rating & Verified Buyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rating *
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-100 text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-600 ml-1.5">{rating} Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verified Badge
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 font-medium">Show &ldquo;✓ Verified Buyer&rdquo; badge</span>
                  </label>
                </div>
              </div>

              {/* Author & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pooja Malhotra"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>

              {/* Skin Type / Tag */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skin Type / Concern Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oily / Humid Climate or Combination Skin"
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Review Timeline / Date Anchor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Timeline Anchor (Automatically advances every single day)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'today', label: 'Today (Just now)' },
                    { id: 'yesterday', label: '1 day ago' },
                    { id: '2days', label: '2 days ago' },
                    { id: '3days', label: '3 days ago' },
                    { id: '1week', label: '1 week ago' },
                    { id: 'custom', label: 'Custom Date' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDateOption(opt.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        dateOption === opt.id
                          ? 'bg-pink-50 text-pink-700 border-pink-500 font-bold'
                          : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {dateOption === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-2 w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900"
                  />
                )}
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unbelievable texture, no sticky residue!"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share detailed experience regarding texture, scent, packaging, or skin improvements..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-pink-600" />
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
                  className="w-full text-xs file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer text-slate-500"
                />
                {reviewImage && (
                  <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-stone-200 shadow-2xs">
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

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Bulk Upload Customer Reviews</h3>
                <p className="text-[11px] text-slate-500">Import multiple reviews at once via CSV or JSON</p>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {bulkError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Format Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkFormat('csv')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    bulkFormat === 'csv'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  CSV Format
                </button>
                <button
                  type="button"
                  onClick={() => setBulkFormat('json')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    bulkFormat === 'json'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  JSON Format
                </button>
              </div>

              {/* Helper format guidance */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-pink-600" />
                  <span>Expected Format:</span>
                </div>
                {bulkFormat === 'csv' ? (
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-stone-200 text-slate-700">
                    Author, City, Product Title or ID, Rating (1-5), Headline, Detailed Comment
                  </p>
                ) : (
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-stone-200 text-slate-700">
                    [{'{"author": "...", "location": "...", "productId": "...", "rating": 5, "headline": "...", "comment": "..."}'}]
                  </p>
                )}
              </div>

              {/* Input Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Review Data:
                </label>
                <textarea
                  rows={8}
                  placeholder={
                    bulkFormat === 'csv'
                      ? 'Priya S, Mumbai, Biore UV, 5, Amazing texture, Absorbs instantly without any white cast!\nRohan K, Pune, Keana Rice Mask, 5, Pores disappear, The rice extract essence is so calming.'
                      : '[\n  {\n    "author": "Anjali R",\n    "location": "Bengaluru",\n    "rating": 5,\n    "headline": "Authentic Japan stock",\n    "comment": "Shipped fast with authentic seals."\n  }\n]'
                  }
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={isBulkSubmitting}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isBulkSubmitting ? 'Importing...' : 'Import All Reviews'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-stone-200 p-5 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Delete Review?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete the review by &ldquo;{reviewToDelete.author}&rdquo;? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer border border-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md shadow-rose-600/20"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
