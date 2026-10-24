import React from 'react';
import { ShieldCheck, FileKey, Search, Vault, Lock } from 'lucide-react';
import type { ActiveTab } from '../types/cert.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  vaultCount: number;
  onOpenVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  vaultCount,
  onOpenVault,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">CertStudio</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                X.509 RFC 5280
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              OpenSSL Certificate Studio &amp; True Binary Exporter
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onTabChange('generator')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'generator'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileKey className="w-3.5 h-3.5" />
            <span>Certificate Generator</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('decoder')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'decoder'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Decoder &amp; Inspector</span>
          </button>
        </nav>

        {/* Right actions: CA Vault & Security Pill */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenVault}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-200 font-medium transition-colors shadow-sm"
          >
            <Vault className="w-3.5 h-3.5 text-amber-400" />
            <span>CA Vault</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {vaultCount}
            </span>
          </button>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>100% Client-Side Crypto</span>
          </div>
        </div>
      </div>
    </header>
  );
};
