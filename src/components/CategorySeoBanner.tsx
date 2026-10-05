import React from 'react';
import { Sparkles, ArrowLeft, BookOpen } from 'lucide-react';
import { SeoCategoryInfo, SEO_BRANDS, SEO_GUIDES } from '../data/seoContent';
import { Breadcrumbs } from './Breadcrumbs';

interface CategorySeoBannerProps {
  category: SeoCategoryInfo;
  productCount: number;
  onBackToAll?: () => void;
  onNavigateHome?: () => void;
  onNavigateBrand?: (slug: string) => void;
  onNavigateGuide?: (slug: string) => void;
}

export const CategorySeoBanner: React.FC<CategorySeoBannerProps> = ({
  category,
  productCount,
  onBackToAll,
  onNavigateHome,
  onNavigateBrand,
  onNavigateGuide
}) => {
  const categoryGuides = Object.values(SEO_GUIDES).filter(g => 
    (category.relatedGuideSlugs && category.relatedGuideSlugs.includes(g.slug)) ||
    g.relatedCategorySlug === category.slug
  );

  return (
    <div className="mb-6 sm:mb-8 rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent border border-pink-200/60 dark:border-pink-500/20 backdrop-blur-md relative overflow-hidden text-left shadow-xs">
      {/* Decorative ambient Japanese wave glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-400/15 dark:bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Collections', href: '/#collection', onClick: onBackToAll },
            { label: category.name }
          ]}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[11px] font-semibold tracking-wide border border-pink-200 dark:border-pink-800">
            <Sparkles className="w-3 h-3 text-pink-500" />
            <span>{category.badge || '100% Authentic Tokyo Import'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-zinc-50">
            {category.h1}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
            {category.introText}
          </p>

          {/* Top Brands in Category */}
          {category.relatedBrandSlugs && category.relatedBrandSlugs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Top Brands:</span>
              {category.relatedBrandSlugs.map(bSlug => {
                const b = SEO_BRANDS[bSlug];
                if (!b) return null;
                return (
                  <a
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                        e.preventDefault();
                        onNavigateBrand(b.slug);
                      }
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 transition-colors"
                  >
                    {b.name}
                  </a>
                );
              })}
            </div>
          )}

          {/* Related Guides for this Category */}
          {categoryGuides.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-pink-500" />
                <span>Guide:</span>
              </span>
              {categoryGuides.map(g => (
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

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-lg font-bold text-slate-900 dark:text-zinc-100 font-serif">
              {productCount}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Available
            </div>
          </div>

          {onBackToAll && (
            <button
              onClick={onBackToAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 bg-white/60 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:border-pink-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Products</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
