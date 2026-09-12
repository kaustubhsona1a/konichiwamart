import React from 'react';
import { 
  Sparkles, 
  Droplet,
  Lock
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface FooterProps {
  onOpenSecurityGuide?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin
}) => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/75 text-slate-600 text-xs pt-12 pb-10 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Clean Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200/70">
          
          {/* Brand & Mission */}
          <div className="space-y-2 text-left max-w-md">
            <div className="flex items-center gap-3">
              <KonichiwaMartLogo size={52} />
              <span className="font-serif tracking-tight text-2xl text-slate-900 font-black">
                Konichiwa<span className="text-pink-600">_Mart</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct Japanese Skincare Import Dispensary. Delivering 100% authentic, factory-sealed skincare essentials directly from Tokyo.
            </p>
          </div>

          {/* Clean Quality Highlights */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>100% Tokyo Imports</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-xs">
              <Droplet className="w-3.5 h-3.5 text-pink-500" />
              <span>Gentle Formulations</span>
            </div>
          </div>

          {/* Authentic Guarantee */}
          <div className="text-xs text-slate-500 font-medium">
            <span>Direct Tokyo Dispensary</span>
          </div>

        </div>

        {/* Bottom Strip with Hidden Operator Entry Key */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Konichiwa_Mart. All rights reserved. Authentic Japanese Skincare Essentials.
          </div>

          {/* Discreet Operator Access Button */}
          <div className="flex items-center gap-3">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-[11px] text-slate-400 hover:text-pink-600 flex items-center gap-1 opacity-60 hover:opacity-100 transition-all cursor-pointer p-1"
                title="Store Operator Access (Ctrl+Shift+A)"
              >
                <Lock className="w-3 h-3" />
                <span>Staff Access</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
