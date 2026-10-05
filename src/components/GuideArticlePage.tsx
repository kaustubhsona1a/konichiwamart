import React from 'react';
import { Clock, Calendar, User, ArrowLeft, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { SeoGuideInfo, SEO_CATEGORIES, SEO_GUIDES } from '../data/seoContent';
import { Product, ProductShade } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCard } from './ProductCard';

interface GuideArticlePageProps {
  guide: SeoGuideInfo;
  allProducts: Product[];
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

export const GuideArticlePage: React.FC<GuideArticlePageProps> = ({
  guide,
  allProducts,
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
  // Determine related category info
  const categorySlug = guide.relatedCategorySlug || 'skincare';
  const categoryInfo = SEO_CATEGORIES[categorySlug] || SEO_CATEGORIES['skincare'];

  // Collect recommended products if defined in sections
  const recommendedSlugs = new Set<string>();
  guide.sections.forEach(s => {
    (s.recommendedProductSlugs || []).forEach(slug => recommendedSlugs.add(slug.toLowerCase()));
  });

  const matchedProducts = allProducts.filter(p => {
    if (!p) return false;
    const id = p.id.toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    return recommendedSlugs.has(id) || (slug && recommendedSlugs.has(slug));
  });

  // Other related guides
  const otherGuides = Object.values(SEO_GUIDES).filter(g => g.slug !== guide.slug).slice(0, 3);

  const handleCategoryClick = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
      e.preventDefault();
      onNavigateCategory(categorySlug);
    }
  };

  const handleGuideClick = (slug: string, e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
      e.preventDefault();
      onNavigateGuide(slug);
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb linking Home > Category > Guide */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/', onClick: onBackToStore },
          { 
            label: categoryInfo.name, 
            href: `/collections/${categorySlug}`, 
            onClick: onNavigateCategory ? () => onNavigateCategory(categorySlug) : undefined 
          },
          { label: guide.title }
        ]}
      />

      {/* Guide Header */}
      <header className="space-y-4 pb-6 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/collections/${categorySlug}`}
            onClick={handleCategoryClick}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-semibold hover:bg-pink-200 dark:hover:bg-pink-900/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>{categoryInfo.name}</span>
          </a>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{guide.category}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-tight">
          {guide.h1}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
          {guide.excerpt}
        </p>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 pt-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-pink-500" />
            <span>{guide.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            <span>Updated {guide.updatedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-pink-500" />
            <span>{guide.readTime}</span>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <div className="space-y-8 prose dark:prose-invert max-w-none text-slate-700 dark:text-zinc-300">
        {guide.sections.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-zinc-100">
              {section.heading}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300 whitespace-pre-line">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {/* Recommended Products in Guide */}
      {matchedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Recommended in this Guide</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400">Authentic Tokyo Imports</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            {matchedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={isWishlisted(p.id)}
                onEdit={onEdit}
                isOperator={isOperator}
              />
            ))}
          </div>
        </div>
      )}

      {/* Explore Category Call-to-Action */}
      <div className="p-6 rounded-3xl bg-pink-50/60 dark:bg-zinc-900/60 border border-pink-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Explore {categoryInfo.name} in India
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Discover our full range of Tokyo-imported {categoryInfo.name.toLowerCase()} with fast 3-5 day delivery.
          </p>
        </div>
        <a
          href={`/collections/${categorySlug}`}
          onClick={handleCategoryClick}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
        >
          <span>View {categoryInfo.name}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Related Skincare Guides */}
      {otherGuides.length > 0 && (
        <div className="pt-6 border-t border-slate-200/80 dark:border-zinc-800 space-y-3">
          <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-pink-500" />
            <span>More Japanese Skincare Guides</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherGuides.map(og => (
              <a
                key={og.slug}
                href={`/guides/${og.slug}`}
                onClick={(e) => handleGuideClick(og.slug, e)}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-500/40 transition-colors block text-left shadow-2xs group"
              >
                <div className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-1">
                  {og.category}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-2">
                  {og.h1}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {og.excerpt}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Back to store navigation */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:border-pink-300 text-slate-700 dark:text-zinc-300 hover:text-pink-600 text-xs font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Konichiwa Mart Store</span>
        </button>
      </div>
    </article>
  );
};
