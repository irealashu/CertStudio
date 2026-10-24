import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Layers, CheckSquare, Square } from 'lucide-react';
import type { SANItem, BasicConstraintsOptions, KeyUsageOptions, ExtKeyUsageOptions } from '../types/cert.ts';

interface ExtensionsFormProps {
  sans: SANItem[];
  onSansChange: (sans: SANItem[]) => void;
  basicConstraints: BasicConstraintsOptions;
  onBasicConstraintsChange: (bc: BasicConstraintsOptions) => void;
  keyUsage: KeyUsageOptions;
  onKeyUsageChange: (ku: KeyUsageOptions) => void;
  extKeyUsage: ExtKeyUsageOptions;
  onExtKeyUsageChange: (eku: ExtKeyUsageOptions) => void;
}

export const ExtensionsForm: React.FC<ExtensionsFormProps> = ({
  sans,
  onSansChange,
  basicConstraints,
  onBasicConstraintsChange,
  keyUsage,
  onKeyUsageChange,
  extKeyUsage,
  onExtKeyUsageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'sans' | 'bc' | 'ku' | 'eku'>('sans');
  const [collapsed, setCollapsed] = useState(false);

  const addSan = (type: SANItem['type'] = 'DNS', value: string = '') => {
    onSansChange([
      ...sans,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        value,
      },
    ]);
  };

  const removeSan = (id: string) => {
    onSansChange(sans.filter(s => s.id !== id));
  };

  const updateSan = (id: string, updates: Partial<SANItem>) => {
    onSansChange(
      sans.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const toggleKeyUsage = (key: keyof Omit<KeyUsageOptions, 'critical'>) => {
    onKeyUsageChange({
      ...keyUsage,
      [key]: !keyUsage[key],
    });
  };

  const toggleExtKeyUsage = (key: keyof Omit<ExtKeyUsageOptions, 'critical'>) => {
    onExtKeyUsageChange({
      ...extKeyUsage,
      [key]: !extKeyUsage[key],
    });
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              X.509 v3 Extensions
            </h3>
            <p className="text-xs text-slate-400">
              Configure SANs, Basic Constraints, Key Usage, and Extended Key Usage flags
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded"
          aria-label={collapsed ? 'Expand extensions' : 'Collapse extensions'}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {/* Subtabs */}
          <div className="flex space-x-1 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('sans')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'sans'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Subject Alt Names (SAN) ({sans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bc')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'bc'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Basic Constraints
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ku')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'ku'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Key Usage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('eku')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'eku'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Ext Key Usage (EKU)
            </button>
          </div>

          {/* TAB 1: SANs */}
          {activeTab === 'sans' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Alternative domains and IP addresses (Required for modern browser TLS)
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => addSan('DNS', 'localhost')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                  >
                    + localhost
                  </button>
                  <button
                    type="button"
                    onClick={() => addSan('IP', '127.0.0.1')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                  >
                    + 127.0.0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => addSan('DNS', '')}
                    className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Entry</span>
                  </button>
                </div>
              </div>

              {sans.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  No Subject Alternative Names defined yet. Click &quot;Add Entry&quot; or quick buttons above.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sans.map(s => (
                    <div key={s.id} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <select
                        value={s.type}
                        onChange={e => updateSan(s.id, { type: e.target.value as SANItem['type'] })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                      >
                        <option value="DNS">DNS</option>
                        <option value="IP">IP</option>
                        <option value="URI">URI</option>
                        <option value="Email">Email</option>
                      </select>

                      <input
                        type="text"
                        value={s.value}
                        onChange={e => updateSan(s.id, { value: e.target.value })}
                        placeholder={s.type === 'IP' ? 'e.g. 192.168.1.1' : s.type === 'DNS' ? 'e.g. *.example.com' : 'Value'}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={() => removeSan(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        aria-label="Remove SAN"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Basic Constraints */}
          {activeTab === 'bc' && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Certificate Authority (<code className="text-emerald-400">cA</code>)</span>
                  <span className="text-[11px] text-slate-400">Can this certificate issue and sign other subordinate certificates?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={basicConstraints.cA}
                    onChange={e => onBasicConstraintsChange({ ...basicConstraints, cA: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-xs font-medium text-slate-200 block">Mark Critical</span>
                  <span className="text-[11px] text-slate-400">Clients MUST reject if unrecognized (standard for CA certificates)</span>
                </div>
                <input
                  type="checkbox"
                  checked={basicConstraints.critical}
                  onChange={e => onBasicConstraintsChange({ ...basicConstraints, critical: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {basicConstraints.cA && (
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-200 mb-1">
                    Path Length Constraint (<code className="text-slate-400">pathLenConstraint</code>)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Maximum number of intermediate CAs that may follow. Leave blank for unlimited.
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={basicConstraints.pathLenConstraint ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      onBasicConstraintsChange({ ...basicConstraints, pathLenConstraint: v });
                    }}
                    placeholder="Unlimited (None)"
                    className="w-48 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Key Usage */}
          {activeTab === 'ku' && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-300 font-medium">RFC 5280 Key Usages</span>
                <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyUsage.critical}
                    onChange={e => onKeyUsageChange({ ...keyUsage, critical: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mark Critical</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'digitalSignature', label: 'digitalSignature', desc: 'Entity authentication & integrity' },
                  { key: 'nonRepudiation', label: 'nonRepudiation', desc: 'Commitment of data origin' },
                  { key: 'keyEncipherment', label: 'keyEncipherment', desc: 'RSA key transport/encryption' },
                  { key: 'dataEncipherment', label: 'dataEncipherment', desc: 'Direct data ciphering' },
                  { key: 'keyAgreement', label: 'keyAgreement', desc: 'Diffie-Hellman key exchange' },
                  { key: 'keyCertSign', label: 'keyCertSign', desc: 'Sign child certificates (CA)' },
                  { key: 'cRLSign', label: 'cRLSign', desc: 'Sign revocation lists (CRL)' },
                ].map(item => {
                  const isChecked = !!keyUsage[item.key as keyof KeyUsageOptions];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleKeyUsage(item.key as keyof Omit<KeyUsageOptions, 'critical'>)}
                      className={`flex items-start space-x-2 p-2 rounded border text-left transition-all ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-medium">{item.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Extended Key Usage (EKU) */}
          {activeTab === 'eku' && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Extended Key Usages (Application Specific)</span>
                <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extKeyUsage.critical}
                    onChange={e => onExtKeyUsageChange({ ...extKeyUsage, critical: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mark Critical</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'serverAuth', label: 'serverAuth', name: 'TLS Web Server Authentication' },
                  { key: 'clientAuth', label: 'clientAuth', name: 'TLS Web Client Authentication (mTLS)' },
                  { key: 'codeSigning', label: 'codeSigning', name: 'Code Signing' },
                  { key: 'emailProtection', label: 'emailProtection', name: 'E-mail Protection (S/MIME)' },
                  { key: 'timeStamping', label: 'timeStamping', name: 'Trusted Timestamping' },
                ].map(item => {
                  const isChecked = !!extKeyUsage[item.key as keyof ExtKeyUsageOptions];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleExtKeyUsage(item.key as keyof Omit<ExtKeyUsageOptions, 'critical'>)}
                      className={`flex items-start space-x-2 p-2 rounded border text-left transition-all ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-medium">{item.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{item.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
