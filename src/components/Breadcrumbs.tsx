import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const handleItemClick = (e: React.MouseEvent, item: BreadcrumbItem) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return; // Allow new tab navigation
    }
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`text-xs text-slate-500 dark:text-zinc-400 select-none ${className}`}
    >
      <ol 
        className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        <li 
          className="flex items-center gap-1.5"
          itemProp="itemListElement" 
          itemScope 
          itemType="https://schema.org/ListItem"
        >
          <a
            href="/"
            onClick={(e) => {
              if (items[0]?.onClick) {
                handleItemClick(e, items[0]);
              }
            }}
            className="flex items-center gap-1 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            itemProp="item"
          >
            <Home className="w-3.5 h-3.5" />
            <span itemProp="name">Home</span>
          </a>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 2;

          return (
            <li 
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
            >
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-600 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span 
                  className="font-medium text-slate-800 dark:text-zinc-200 truncate max-w-[220px] sm:max-w-xs"
                  itemProp="name"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleItemClick(e, item)}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors truncate max-w-[180px] sm:max-w-xs"
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </a>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
