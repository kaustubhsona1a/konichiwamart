import React from 'react';
import { Sparkles, MapPin, Calendar, ArrowLeft, BookOpen } from 'lucide-react';
import { SeoBrandInfo, SEO_CATEGORIES, SEO_GUIDES } from '../data/seoContent';
import { Product, ProductShade } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCard } from './ProductCard';

interface BrandLandingPageProps {
  brand: SeoBrandInfo;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, shade?: ProductShade) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onBackToStore: () => void;
  onNavigateCategory?: (categorySlug: string) => void;
  onNavigateGuide?: (guideSlug: string) => void;
  onEdit?: (product: Product) => void;
  isOperator?: boolean;
}

export const BrandLandingPage: React.FC<BrandLandingPageProps> = ({
  brand,
  products,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onBackToStore,
  onNavigateCategory,
  onNavigateGuide,
  onEdit,
  isOperator
}) => {
  const brandGuides = Object.values(SEO_GUIDES).filter(g => 
    (brand.relatedGuideSlugs && brand.relatedGuideSlugs.includes(g.slug)) ||
    (g.relatedBrandSlugs && g.relatedBrandSlugs.includes(brand.slug))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8 animate-in fade-in duration-300">
      {/* Brand Header Banner */}
      <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent border border-pink-200/70 dark:border-pink-500/20 backdrop-blur-md relative overflow-hidden shadow-xs">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-pink-400/15 dark:bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Brands', href: '/#collection', onClick: onBackToStore },
              { label: brand.name }
            ]}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold border border-pink-200 dark:border-pink-800">
                {brand.japaneseName}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-pink-500" />
                <span>{brand.countryOfOrigin}</span>
              </span>
              {brand.foundingYear && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-pink-500" />
                  <span>Est. {brand.foundingYear}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-zinc-50">
              {brand.h1}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
              {brand.brandStory}
            </p>

            {brand.relatedCategorySlugs && brand.relatedCategorySlugs.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Categories:</span>
                {brand.relatedCategorySlugs.map(catSlug => {
                  const cat = SEO_CATEGORIES[catSlug];
                  if (!cat) return null;
                  return (
                    <a
                      key={cat.slug}
                      href={`/collections/${cat.slug}`}
                      onClick={(e) => {
                        if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                          e.preventDefault();
                          onNavigateCategory(cat.slug);
                        }
                      }}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 transition-colors"
                    >
                      {cat.name}
                    </a>
                  );
                })}
              </div>
            )}

            {brandGuides.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-pink-500" />
                  <span>Guide:</span>
                </span>
                {brandGuides.map(g => (
                  <a
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                        e.preventDefault();
                        onNavigateGuide(g.slug);
                      }
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50/90 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors"
                  >
                    {g.h1}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 font-serif">
                {products.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                Tokyo Stock
              </div>
            </div>

            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 bg-white/70 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 hover:border-pink-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-zinc-100">
            {brand.name} Tokyo Products in India ({products.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            100% Genuine Direct Imports
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
            <p className="text-slate-600 dark:text-zinc-400 mb-4 text-sm">
              New shipment of {brand.name} is currently en route from Tokyo.
            </p>
            <button
              onClick={onBackToStore}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md cursor-pointer"
            >
              Explore Full Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={isWishlisted(product.id)}
                onEdit={isOperator ? onEdit : undefined}
                isOperator={Boolean(isOperator)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
