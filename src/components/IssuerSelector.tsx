import React, { useRef } from 'react';
import { Vault, Upload, KeyRound, AlertCircle } from 'lucide-react';
import type { SavedCA } from '../types/cert.ts';

interface IssuerSelectorProps {
  issuerSource: 'vault' | 'custom';
  onSourceChange: (source: 'vault' | 'custom') => void;
  vaultCAs: SavedCA[];
  selectedVaultCaId: string;
  onSelectVaultCa: (id: string) => void;
  customCertPem: string;
  onCustomCertPemChange: (pem: string) => void;
  customKeyPem: string;
  onCustomKeyPemChange: (pem: string) => void;
  customPassphrase: string;
  onCustomPassphraseChange: (pass: string) => void;
}

export const IssuerSelector: React.FC<IssuerSelectorProps> = ({
  issuerSource,
  onSourceChange,
  vaultCAs,
  selectedVaultCaId,
  onSelectVaultCa,
  customCertPem,
  onCustomCertPemChange,
  customKeyPem,
  onCustomKeyPemChange,
  customPassphrase,
  onCustomPassphraseChange,
}) => {
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const keyFileInputRef = useRef<HTMLInputElement>(null);

  const handleCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        onCustomCertPemChange(ev.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        onCustomKeyPemChange(ev.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/30 space-y-4 shadow-lg shadow-indigo-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-indigo-300 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Signing Authority (Issuer CA)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Select an existing Root/Intermediate CA to sign and issue this certificate
          </p>
        </div>

        {/* Source Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onSourceChange('vault')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
              issuerSource === 'vault'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>CA Vault ({vaultCAs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange('custom')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
              issuerSource === 'custom'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Paste</span>
          </button>
        </div>
      </div>

      {issuerSource === 'vault' ? (
        <div className="space-y-3">
          {vaultCAs.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-indigo-900/60 rounded-lg bg-indigo-950/10 p-4">
              <p className="text-xs text-indigo-200 font-medium">Your Local CA Vault is currently empty.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Switch to <strong className="text-emerald-400">Root / Intermediate CA</strong> mode above, generate a Root CA, and click &quot;Save to CA Vault&quot;, or switch to &quot;Upload / Paste&quot;.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Choose Signing CA from Vault
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {vaultCAs.map(ca => {
                  const isSelected = ca.id === selectedVaultCaId;
                  return (
                    <button
                      key={ca.id}
                      type="button"
                      onClick={() => onSelectVaultCa(ca.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-xs font-semibold text-white truncate flex items-center space-x-2">
                          <span>{ca.name}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                              SELECTED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {ca.subjectDN}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Expires: {new Date(ca.notAfter).toLocaleDateString()}</span>
                          <span className="font-mono">SHA-256: {ca.fingerprintSha256.substring(0, 14)}...</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Custom Upload/Paste */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Issuer Cert */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-200">
                  Issuer Certificate (<code className="text-indigo-300">.pem / .crt</code>)
                </label>
                <button
                  type="button"
                  onClick={() => certFileInputRef.current?.click()}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <input
                  type="file"
                  ref={certFileInputRef}
                  onChange={handleCertFileUpload}
                  accept=".pem,.crt,.cer"
                  className="hidden"
                />
              </div>
              <textarea
                rows={5}
                value={customCertPem}
                onChange={e => onCustomCertPemChange(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Issuer Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-200">
                  Issuer Private Key (<code className="text-indigo-300">.key / .pem</code>)
                </label>
                <button
                  type="button"
                  onClick={() => keyFileInputRef.current?.click()}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <input
                  type="file"
                  ref={keyFileInputRef}
                  onChange={handleKeyFileUpload}
                  accept=".key,.pem"
                  className="hidden"
                />
              </div>
              <textarea
                rows={5}
                value={customKeyPem}
                onChange={e => onCustomKeyPemChange(e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Issuer Private Key Passphrase <span className="text-slate-500">(if encrypted)</span>
            </label>
            <input
              type="password"
              value={customPassphrase}
              onChange={e => onCustomPassphraseChange(e.target.value)}
              placeholder="Leave empty if the issuer key is unencrypted"
              className="w-full sm:w-1/2 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              All signing operations occur 100% in your local browser sandbox memory. Your private keys never touch any network or server.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
