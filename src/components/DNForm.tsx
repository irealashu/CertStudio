import React from 'react';
import type { SubjectDN } from '../types/cert.ts';
import { ISO_COUNTRY_CODES } from '../utils/countryCodes.ts';

interface DNFormProps {
  subject: SubjectDN;
  onChange: (subject: SubjectDN) => void;
}

export const DNForm: React.FC<DNFormProps> = ({ subject, onChange }) => {
  const updateField = (field: keyof SubjectDN, value: string) => {
    let sanitized = value;
    if (field === 'country') {
      sanitized = value.toUpperCase().slice(0, 2);
    }
    onChange({
      ...subject,
      [field]: sanitized,
    });
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>Subject Distinguished Name (DN)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Defines the identity and ownership entity encoded in the X.509 certificate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Common Name (Required) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Common Name (<code className="text-emerald-400">CN</code>) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={subject.commonName}
            onChange={e => updateField('commonName', e.target.value)}
            placeholder="e.g. localhost, *.example.com, or My Internal CA"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
          />
          {!subject.commonName.trim() && (
            <p className="text-[11px] text-rose-400 mt-1">Common Name (CN) is mandatory in RFC 5280.</p>
          )}
        </div>

        {/* Organization */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Organization (<code className="text-slate-400">O</code>)
          </label>
          <input
            type="text"
            value={subject.organization || ''}
            onChange={e => updateField('organization', e.target.value)}
            placeholder="e.g. Acme Security Corp"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Organizational Unit */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Organizational Unit (<code className="text-slate-400">OU</code>)
          </label>
          <input
            type="text"
            value={subject.organizationalUnit || ''}
            onChange={e => updateField('organizationalUnit', e.target.value)}
            placeholder="e.g. DevOps / Infrastructure"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Country Code Dropdown */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-200">
              Country Code (<code className="text-slate-400">C</code>)
            </label>
            <span className="text-[10px] text-slate-400">ISO 3166-1 Alpha-2</span>
          </div>
          <select
            value={subject.country || ''}
            onChange={e => updateField('country', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          >
            <option value="">-- None / Unspecified --</option>
            {ISO_COUNTRY_CODES.map(item => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* State / Province */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            State / Province (<code className="text-slate-400">ST</code>)
          </label>
          <input
            type="text"
            value={subject.state || ''}
            onChange={e => updateField('state', e.target.value)}
            placeholder="e.g. California"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Locality / City */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Locality / City (<code className="text-slate-400">L</code>)
          </label>
          <input
            type="text"
            value={subject.locality || ''}
            onChange={e => updateField('locality', e.target.value)}
            placeholder="e.g. San Francisco"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Email Address (<code className="text-slate-400">emailAddress</code>)
          </label>
          <input
            type="email"
            value={subject.emailAddress || ''}
            onChange={e => updateField('emailAddress', e.target.value)}
            placeholder="e.g. admin@example.com"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
          />
        </div>
      </div>
    </div>
  );
};
