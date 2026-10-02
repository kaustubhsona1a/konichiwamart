import React from 'react';
import { Clock, Calendar, User, ArrowLeft, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { SeoGuideInfo } from '../data/seoContent';
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
  onEdit,
  isOperator
}) => {
  // Collect recommended products if defined in sections
  const recommendedSlugs = new Set<string>();
  guide.sections.forEach(s => {
    (s.recommendedProductSlugs || []).forEach(slug => recommendedSlugs.add(slug));
  });

  const matchedProducts = allProducts.filter(p => 
    recommendedSlugs.has(p.id) || 
    (p.slug && recommendedSlugs.has(p.slug))
  );

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Skincare Guides', href: '/#collection', onClick: onBackToStore },
          { label: guide.title }
        ]}
      />

      {/* Guide Header */}
      <header className="space-y-4 pb-6 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>{guide.category}</span>
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

      {/* Back to store navigation */}
      <div className="pt-6 flex justify-center">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore All Japanese Skincare</span>
        </button>
      </div>
    </article>
  );
};
