import React, { useState, useRef } from 'react';
import { 
  Video, 
  Plus, 
  ExternalLink, 
  RotateCcw, 
  Check, 
  Trash2, 
  Edit3, 
  X, 
  Upload, 
  Play, 
  Eye, 
  Heart, 
  Package, 
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Instagram
} from 'lucide-react';
import { ReelItem, Product } from '../../types';
import { INITIAL_REELS, extractInstagramCode, KONICHIWA_INSTAGRAM_URL } from '../../data/reels';
import { formatINR } from '../../data/pincodes';

interface ReelsManagerProps {
  reels: ReelItem[];
  onUpdateReels: (updatedReels: ReelItem[]) => void;
  products: Product[];
}

export const ReelsManager: React.FC<ReelsManagerProps> = ({
  reels,
  onUpdateReels,
  products
}) => {
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [quickLinkState, setQuickLinkState] = useState<Record<string, { videoUrl: string; instagramUrl: string }>>({});
  const [savedSuccessMap, setSavedSuccessMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtered reels list
  const filteredReels = reels.filter(r => 
    r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.creatorHandle.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.caption.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Quick link change handler
  const handleQuickUrlChange = (id: string, field: 'videoUrl' | 'instagramUrl', value: string) => {
    setQuickLinkState(prev => ({
      ...prev,
      [id]: {
        videoUrl: field === 'videoUrl' ? value : (prev[id]?.videoUrl ?? (reels.find(r => r.id === id)?.videoUrl || '')),
        instagramUrl: field === 'instagramUrl' ? value : (prev[id]?.instagramUrl ?? (reels.find(r => r.id === id)?.instagramUrl || ''))
      }
    }));
  };

  // Save quick link changes directly
  const handleSaveQuickLink = (id: string) => {
    const current = quickLinkState[id];
    const target = reels.find(r => r.id === id);
    if (!target) return;

    const newVideoUrl = current ? current.videoUrl : (target.videoUrl || '');
    const newInstaUrl = current ? current.instagramUrl : (target.instagramUrl || '');

    const updated = reels.map(r => {
      if (r.id === id) {
        return {
          ...r,
          videoUrl: newVideoUrl,
          instagramUrl: newInstaUrl
        };
      }
      return r;
    });

    onUpdateReels(updated);
    setSavedSuccessMap(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSavedSuccessMap(prev => ({ ...prev, [id]: false }));
    }, 2000);
    showToast(`Updated reel link for "${target.title}"! Changes are live.`);
  };

  // Delete Reel
  const handleDeleteReel = (id: string) => {
    const target = reels.find(r => r.id === id);
    const updated = reels.filter(r => r.id !== id);
    onUpdateReels(updated);
    setConfirmDeleteId(null);
    showToast(`Removed reel "${target?.title || id}".`);
  };

  // Reset to default sample reels
  const handleResetDefaults = () => {
    if (window.confirm('Reset all reels to default community videos? This will overwrite custom links.')) {
      onUpdateReels(INITIAL_REELS);
      showToast('Reset reels to default showcase!');
    }
  };

  // Save full modal edit
  const handleSaveModalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReel) return;

    if (isAddingNew) {
      const newReels = [...reels, editingReel];
      onUpdateReels(newReels);
      showToast(`Added new reel "${editingReel.title}"!`);
    } else {
      const updated = reels.map(r => r.id === editingReel.id ? editingReel : r);
      onUpdateReels(updated);
      showToast(`Updated "${editingReel.title}" successfully!`);
    }

    setEditingReel(null);
    setIsAddingNew(false);
  };

  // Handle Thumbnail File Upload with compression
  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingReel) return;

    setIsUploadingThumb(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setEditingReel(prev => prev ? ({ ...prev, videoThumb: compressed }) : null);
        }
        setIsUploadingThumb(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Start Adding a new reel
  const handleStartAddNew = () => {
    const defaultProduct = products[0];
    const newReel: ReelItem = {
      id: `reel_${Date.now()}`,
      creatorHandle: '@konichiwa_mart',
      creatorName: 'Konichiwa Team',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      location: 'Japan',
      title: 'New Skincare Routine Spotlight',
      caption: 'Watch how this Japanese essential absorbs in seconds with real application steps.',
      views: '1.2M',
      likes: 85000,
      commentsCount: 420,
      audioTrack: 'Gentle Glow ASMR - Japan Skincare',
      productId: defaultProduct ? defaultProduct.id : 'senka-perfect-whip',
      videoThumb: defaultProduct ? defaultProduct.image : 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      instagramUrl: KONICHIWA_INSTAGRAM_URL,
      tags: ['#JapaneseSkincare', '#AuthenticBeauty']
    };
    setEditingReel(newReel);
    setIsAddingNew(true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-100 text-pink-700">
              <Video className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
              COMMUNITY REELS & VIDEO LINKS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Update reel links, video streams, Instagram web URLs, cover photos, and tagged catalog products. All updates are securely persisted to the server (<code className="text-pink-600 font-mono bg-pink-50 px-1 py-0.5 rounded">/api/reels</code>) and cached locally so every customer on any device sees them instantly.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-600 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Reset to default reels"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleStartAddNew}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Reel</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SEARCH AND COUNTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-pink-100 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search reels by title, creator, or caption..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Active Reels: <strong className="text-pink-600 font-bold">{reels.length}</strong></span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-slate-400">Supports direct MP4 videos & Instagram links</span>
        </div>
      </div>

      {/* REELS LIST CARDS */}
      <div className="space-y-4">
        {filteredReels.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-pink-100 space-y-3">
            <Video className="w-10 h-10 text-pink-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No reels found</div>
            <p className="text-xs text-slate-400">Try adjusting your search or add a new video reel.</p>
          </div>
        ) : (
          filteredReels.map((reel, idx) => {
            const currentVideoUrl = quickLinkState[reel.id]?.videoUrl !== undefined 
              ? quickLinkState[reel.id].videoUrl 
              : (reel.videoUrl || '');

            const currentInstaUrl = quickLinkState[reel.id]?.instagramUrl !== undefined 
              ? quickLinkState[reel.id].instagramUrl 
              : (reel.instagramUrl || '');

            const taggedProduct = products.find(p => p.id === reel.productId);
            const isSaved = savedSuccessMap[reel.id];

            return (
              <div 
                key={reel.id}
                className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 shadow-xs hover:border-pink-200 transition-all space-y-4"
              >
                {/* Upper Row: Preview & Details & Edit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                  
                  {/* Left: Thumbnail & Core Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Vertical 9:16 Thumbnail */}
                    <div className="relative w-16 sm:w-20 aspect-[9/14] rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-stone-200 shadow-2xs group">
                      {reel.videoUrl && !reel.videoUrl.includes('instagram.com') ? (
                        <video src={reel.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img 
                          src={reel.videoThumb} 
                          alt={reel.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white opacity-80" />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded-sm font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">{reel.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-700 font-semibold border border-pink-200/60">
                          {reel.views} views
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{reel.creatorHandle}</span>
                        <span>({reel.creatorName})</span>
                        <span className="text-stone-300">•</span>
                        <span>{reel.location}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {reel.caption}
                      </p>

                      {/* Tagged Product badge */}
                      {taggedProduct && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Tagged Product:</span>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-xs text-slate-800">
                            <img 
                              src={taggedProduct.image} 
                              alt={taggedProduct.title}
                              className="w-4 h-4 rounded object-contain bg-white p-0.5"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-medium truncate max-w-[150px]">{taggedProduct.title}</span>
                            <span className="font-bold text-pink-600">{formatINR(taggedProduct.price)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingReel({ ...reel });
                        setIsAddingNew(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Full Details</span>
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(reel.id)}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete reel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Quick Links Inputs */}
                <div className="pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                  {/* Video Stream URL Input */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Video / Reel Stream URL</span>
                      {currentVideoUrl && (
                        <a 
                          href={currentVideoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-pink-600 hover:underline flex items-center gap-0.5 normal-case font-normal"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test link</span>
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={currentVideoUrl}
                      onChange={(e) => handleQuickUrlChange(reel.id, 'videoUrl', e.target.value)}
                      placeholder="https://.../video.mp4 or Instagram reel link"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 font-mono focus:outline-none focus:border-pink-500 focus:bg-white"
                    />
                  </div>

                  {/* Instagram Web URL Input */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-500" />
                        <span>Instagram Web Link</span>
                      </span>
                      {currentInstaUrl && (
                        <a 
                          href={currentInstaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-pink-600 hover:underline flex items-center gap-0.5 normal-case font-normal"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open IG</span>
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={currentInstaUrl}
                      onChange={(e) => handleQuickUrlChange(reel.id, 'instagramUrl', e.target.value)}
                      placeholder="https://www.instagram.com/reel/..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 font-mono focus:outline-none focus:border-pink-500 focus:bg-white"
                    />
                  </div>

                  {/* Save Quick Links Button */}
                  <div className="md:col-span-3 pt-4 sm:pt-4">
                    <button
                      onClick={() => handleSaveQuickLink(reel.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-pink-600 hover:bg-pink-500 text-white active:scale-95'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved Live!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Update Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Warning */}
                {confirmDeleteId === reel.id && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-800 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Are you sure you want to delete "{reel.title}"?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-stone-200 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteReel(reel.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* EDIT / ADD REEL MODAL                                                     */}
      {/* ========================================================================= */}
      {editingReel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-pink-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isAddingNew ? 'Add New Community Video Reel' : 'Edit Reel Details & Links'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fill in the video URL, thumbnail cover, creator details, and tagged product.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingReel(null);
                  setIsAddingNew(false);
                }}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModalEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Row 1: Title & Tagged Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Reel Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReel.title}
                    onChange={(e) => setEditingReel({ ...editingReel, title: e.target.value })}
                    placeholder="e.g. The Viral Whipped Foam Method"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Tagged Catalog Product *
                  </label>
                  <select
                    value={editingReel.productId}
                    onChange={(e) => setEditingReel({ ...editingReel, productId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({formatINR(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Video URL & Instagram Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Video / Stream URL *</span>
                    {editingReel.videoUrl && (
                      <a
                        href={editingReel.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline flex items-center gap-0.5 normal-case font-normal text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Preview link</span>
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={editingReel.videoUrl || ''}
                    onChange={(e) => setEditingReel({ ...editingReel, videoUrl: e.target.value })}
                    placeholder="https://.../video.mp4 or Instagram reel link"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 font-mono focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Direct MP4, WebM video, or Instagram reel link.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
                      <span>Instagram Web Link (Optional)</span>
                    </span>
                    {editingReel.instagramUrl && (
                      <a
                        href={editingReel.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline flex items-center gap-0.5 normal-case font-normal text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open IG</span>
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={editingReel.instagramUrl || ''}
                    onChange={(e) => setEditingReel({ ...editingReel, instagramUrl: e.target.value })}
                    placeholder="https://www.instagram.com/reel/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 font-mono focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Customer can tap "Watch on Instagram" to view in app.
                  </span>
                </div>
              </div>

              {/* Row 3: Cover Thumbnail */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Reel Cover Thumbnail *</span>
                  <span className="text-[10px] text-slate-400 normal-case font-normal">Aspect ratio: 9:16 recommended</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-900 border border-stone-300 flex-shrink-0 relative">
                    {editingReel.videoUrl && !editingReel.videoUrl.includes('instagram.com') ? (
                      <video src={editingReel.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img
                        src={editingReel.videoThumb}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      required
                      value={editingReel.videoThumb}
                      onChange={(e) => setEditingReel({ ...editingReel, videoThumb: e.target.value })}
                      placeholder="Image URL https://..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleThumbUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingThumb}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-stone-100 text-slate-700 border border-stone-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{isUploadingThumb ? 'Optimizing...' : 'Upload Image File'}</span>
                      </button>
                      <span className="text-[10px] text-slate-400">or paste any web image URL above</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Creator Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Creator Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReel.creatorHandle}
                    onChange={(e) => setEditingReel({ ...editingReel, creatorHandle: e.target.value })}
                    placeholder="@japan_daily_glow"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Creator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReel.creatorName}
                    onChange={(e) => setEditingReel({ ...editingReel, creatorName: e.target.value })}
                    placeholder="Hana Tanaka"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Location Tag
                  </label>
                  <input
                    type="text"
                    value={editingReel.location}
                    onChange={(e) => setEditingReel({ ...editingReel, location: e.target.value })}
                    placeholder="Japan, Mumbai, Delhi..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Caption */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Reel Caption & Experience *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingReel.caption}
                  onChange={(e) => setEditingReel({ ...editingReel, caption: e.target.value })}
                  placeholder="Describe the application technique, texture, or skin result..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>

              {/* Row 6: Stats & Audio Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Audio Track Name
                  </label>
                  <input
                    type="text"
                    value={editingReel.audioTrack}
                    onChange={(e) => setEditingReel({ ...editingReel, audioTrack: e.target.value })}
                    placeholder="Gentle Lather ASMR - Japan Skincare"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Displayed Views (e.g. 2.4M)
                  </label>
                  <input
                    type="text"
                    value={editingReel.views}
                    onChange={(e) => setEditingReel({ ...editingReel, views: e.target.value })}
                    placeholder="1.8M"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReel(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-600/20 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAddingNew ? 'Create & Add Reel' : 'Save Reel Changes'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
