import React from 'react';
import { Sparkles, Globe, Shield, UserCheck, Asterisk } from 'lucide-react';
import type { FormState } from '../types/cert.ts';

interface PresetsBarProps {
  onApplyPreset: (presetKey: string) => void;
  currentMode: FormState['mode'];
}

export const PresetsBar: React.FC<PresetsBarProps> = ({ onApplyPreset }) => {
  const presets = [
    {
      id: 'localhost',
      title: 'Localhost Dev Server',
      desc: 'CN: localhost, SAN: 127.0.0.1, ::1',
      icon: Globe,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
    },
    {
      id: 'root_ca',
      title: 'Enterprise Root CA',
      desc: 'cA: TRUE, keyCertSign, cRLSign',
      icon: Shield,
      color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400',
    },
    {
      id: 'wildcard',
      title: 'Wildcard Domain',
      desc: 'CN: *.example.internal, serverAuth',
      icon: Asterisk,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400',
    },
    {
      id: 'mtls',
      title: 'Client mTLS Auth',
      desc: 'clientAuth, digitalSignature',
      icon: UserCheck,
      color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400',
    },
  ];

  return (
    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick-Fill Presets</span>
        </div>
        <span className="text-[11px] text-slate-500">Click to instantly populate standards-compliant profiles</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {presets.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p.id)}
              className={`flex items-start space-x-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/90 text-left transition-all ${p.color} group`}
            >
              <div className="mt-0.5 p-1 rounded bg-slate-800/80 group-hover:bg-slate-700/80">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {p.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
