import React, { useState } from 'react';
import { RefreshCw, Eye, EyeOff, ShieldAlert, Calendar } from 'lucide-react';
import type { KeySize, DigestAlgorithm } from '../types/cert.ts';
import { generateRandomSerial } from '../utils/cryptoEngine.ts';

interface CryptoParamsFormProps {
  keySize: KeySize;
  onKeySizeChange: (size: KeySize) => void;
  digest: DigestAlgorithm;
  onDigestChange: (digest: DigestAlgorithm) => void;
  serialNumberHex: string;
  onSerialChange: (serial: string) => void;
  notBeforeDate: string;
  onNotBeforeChange: (date: string) => void;
  notAfterDate: string;
  onNotAfterChange: (date: string) => void;
  passphrase: string;
  onPassphraseChange: (passphrase: string) => void;
}

export const CryptoParamsForm: React.FC<CryptoParamsFormProps> = ({
  keySize,
  onKeySizeChange,
  digest,
  onDigestChange,
  serialNumberHex,
  onSerialChange,
  notBeforeDate,
  onNotBeforeChange,
  notAfterDate,
  onNotAfterChange,
  passphrase,
  onPassphraseChange,
}) => {
  const [showPass, setShowPass] = useState(false);

  const setDuration = (days: number) => {
    const base = notBeforeDate ? new Date(notBeforeDate) : new Date();
    const future = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    onNotAfterChange(future.toISOString().split('T')[0]);
  };

  const handleRegenerateSerial = () => {
    onSerialChange(generateRandomSerial());
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4">
      <div className="border-b border-slate-800/80 pb-2.5">
        <h3 className="text-sm font-semibold text-slate-100">
          Cryptographic Parameters &amp; Validity
        </h3>
        <p className="text-xs text-slate-400">
          RSA key generation, hashing algorithm, positive serial number, and lifetime duration
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RSA Key Size */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">
            RSA Key Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onKeySizeChange(2048)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                keySize === 2048
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              2048-bit
              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Standard TLS</span>
            </button>
            <button
              type="button"
              onClick={() => onKeySizeChange(4096)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                keySize === 4096
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              4096-bit
              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">High Security / CA</span>
            </button>
          </div>
        </div>

        {/* Digest Algorithm */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">
            Signature Digest Algorithm
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['SHA-256', 'SHA-384', 'SHA-512'] as DigestAlgorithm[]).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onDigestChange(d)}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                  digest === d
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Serial Number */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-200">
              128-bit Serial Number (Hexadecimal)
            </label>
            <button
              type="button"
              onClick={handleRegenerateSerial}
              className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
          <input
            type="text"
            value={serialNumberHex}
            onChange={e => onSerialChange(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
            placeholder="HEX SERIAL NUMBER"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Validity Dates */}
        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-200 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Validity Period</span>
            </label>
            <div className="flex items-center space-x-1 text-[11px]">
              <span className="text-slate-500 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => setDuration(90)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                90 Days
              </button>
              <button
                type="button"
                onClick={() => setDuration(365)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                1 Year
              </button>
              <button
                type="button"
                onClick={() => setDuration(365 * 3)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                3 Years
              </button>
              <button
                type="button"
                onClick={() => setDuration(365 * 10)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                10 Years
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] text-slate-400 mb-1">Not Before (Activation)</span>
              <input
                type="date"
                value={notBeforeDate}
                onChange={e => onNotBeforeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 mb-1">Not After (Expiration)</span>
              <input
                type="date"
                value={notAfterDate}
                onChange={e => onNotAfterChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Passphrase for PFX & Encrypted Private Key */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-200">
              Export / Key Passphrase <span className="text-slate-500">(Optional)</span>
            </label>
            <span className="text-[10px] text-slate-500">Protects .pfx / .p12 archive &amp; PKCS#8 key</span>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={e => onPassphraseChange(e.target.value)}
              placeholder="Leave empty for unencrypted key / passwordless archive"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label={showPass ? 'Hide passphrase' : 'Show passphrase'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passphrase && (
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Passphrase encryption active for PKCS#12 bundle and encrypted private key (.key).</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
