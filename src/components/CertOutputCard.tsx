import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ShieldCheck,
  Key,
  Layers,
  FileCode,
  Package,
  Vault,
  Hash,
} from 'lucide-react';
import type { GeneratedCertificateResult, CertMode } from '../types/cert.ts';

interface CertOutputCardProps {
  result: GeneratedCertificateResult;
  mode: CertMode;
  onSaveToVault?: () => void;
  isSavedToVault?: boolean;
}

export const CertOutputCard: React.FC<CertOutputCardProps> = ({
  result,
  mode,
  onSaveToVault,
  isSavedToVault = false,
}) => {
  const [activePemView, setActivePemView] = useState<'cert' | 'key' | 'encKey' | 'chain'>('cert');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadTextFile = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBinaryFile = (buffer: Uint8Array, filename: string, mimeType: string) => {
    const blob = new Blob([buffer as unknown as BlobPart], {
      type: mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const baseFilename = (result.subjectDN.match(/CN=([^,]+)/)?.[1] || 'cert')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');

  return (
    <div className="bg-slate-900/90 rounded-xl border border-emerald-500/30 p-5 space-y-4 shadow-xl shadow-emerald-950/20">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Certificate Generated Successfully</h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RFC 5280 Valid
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
              {result.subjectDN}
            </p>
          </div>
        </div>

        {/* Action: Save to CA Vault if Root CA */}
        {mode === 'root_ca' && onSaveToVault && (
          <button
            type="button"
            onClick={onSaveToVault}
            disabled={isSavedToVault}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isSavedToVault
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>{isSavedToVault ? 'Saved in CA Vault' : 'Save to CA Vault'}</span>
          </button>
        )}
      </div>

      {/* Cryptographic Metadata Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">KEY SIZE</span>
          <span className="font-mono font-semibold text-slate-200">{result.keySize}-bit RSA</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">SIGNATURE DIGEST</span>
          <span className="font-mono font-semibold text-emerald-400">{result.digest}</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">SERIAL NUMBER</span>
          <span className="font-mono text-[11px] text-slate-300 truncate block">
            {result.serialNumberHex.substring(0, 12)}...
          </span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">VALID UNTIL</span>
          <span className="font-mono text-[11px] text-slate-300">
            {result.notAfter.toISOString().split('T')[0]}
          </span>
        </div>
      </div>

      {/* SHA-256 Fingerprint */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
            <Hash className="w-3 h-3 text-slate-400" />
            <span>SHA-256 FINGERPRINT</span>
          </span>
          <span className="font-mono text-[11px] text-slate-300 break-all select-all block mt-0.5">
            {result.fingerprintSha256}
          </span>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(result.fingerprintSha256, 'sha256')}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 rounded border border-slate-700/60 transition-colors"
          title="Copy Fingerprint"
          aria-label="Copy SHA-256 Fingerprint"
        >
          {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 6 True Binary & Text Export Formats */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>True Cryptographic Export Formats</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* 1. PEM Certificate */}
          <button
            type="button"
            onClick={() => downloadTextFile(result.certPem, `${baseFilename}.pem`, 'application/x-pem-file')}
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">Certificate (.pem)</div>
              <div className="text-[10px] text-slate-500">Base64 X.509</div>
            </div>
          </button>

          {/* 2. Private Key PEM */}
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                result.encryptedPrivateKeyPem || result.privateKeyPem,
                `${baseFilename}.key`,
                'application/x-pem-file'
              )
            }
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">
                {result.encryptedPrivateKeyPem ? 'Encrypted Key (.key)' : 'Private Key (.key)'}
              </div>
              <div className="text-[10px] text-slate-500">
                {result.encryptedPrivateKeyPem ? 'PKCS#8 AES-256' : 'RSA PKCS#1'}
              </div>
            </div>
          </button>

          {/* 3. Full Chain Bundle */}
          <button
            type="button"
            onClick={() => downloadTextFile(result.fullChainPem, `${baseFilename}_fullchain.pem`, 'application/x-pem-file')}
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">Full Chain (.pem)</div>
              <div className="text-[10px] text-slate-500">Cert + Issuer + Key</div>
            </div>
          </button>

          {/* 4. CRT PEM */}
          <button
            type="button"
            onClick={() => downloadTextFile(result.crtPem, `${baseFilename}.crt`, 'application/x-x509-ca-cert')}
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">Linux / Web (.crt)</div>
              <div className="text-[10px] text-slate-500">Apache / Nginx PEM</div>
            </div>
          </button>

          {/* 5. True Binary ASN.1 DER */}
          <button
            type="button"
            onClick={() => downloadBinaryFile(result.derCertBuffer, `${baseFilename}.der`, 'application/x-x509-ca-cert')}
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">Binary DER (.der / .cer)</div>
              <div className="text-[10px] text-slate-500">Raw ASN.1 Binary</div>
            </div>
          </button>

          {/* 6. True Binary PKCS#12 (.pfx / .p12) */}
          <button
            type="button"
            onClick={() => downloadBinaryFile(result.pfxBuffer, `${baseFilename}.pfx`, 'application/x-pkcs12')}
            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
          >
            <div className="p-1.5 rounded bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">PKCS#12 (.pfx / .p12)</div>
              <div className="text-[10px] text-slate-500">IIS / Windows Bundle</div>
            </div>
          </button>
        </div>
      </div>

      {/* PEM Preview & Copy Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActivePemView('cert')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePemView === 'cert' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Certificate PEM
            </button>
            <button
              type="button"
              onClick={() => setActivePemView('key')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePemView === 'key' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Private Key PEM
            </button>
            {result.encryptedPrivateKeyPem && (
              <button
                type="button"
                onClick={() => setActivePemView('encKey')}
                className={`px-2.5 py-1 rounded transition-all ${
                  activePemView === 'encKey' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Encrypted Key
              </button>
            )}
            <button
              type="button"
              onClick={() => setActivePemView('chain')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePemView === 'chain' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Chain Bundle
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const text =
                activePemView === 'cert'
                  ? result.certPem
                  : activePemView === 'key'
                  ? result.privateKeyPem
                  : activePemView === 'encKey'
                  ? result.encryptedPrivateKeyPem || ''
                  : result.fullChainPem;
              copyToClipboard(text, 'currentPem');
            }}
            className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-slate-950 rounded border border-slate-800"
          >
            {copiedKey === 'currentPem' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'currentPem' ? 'Copied!' : 'Copy PEM'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="w-full bg-slate-950 border border-slate-800/90 rounded-lg p-3 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-48 leading-relaxed selection:bg-emerald-500/30">
            {activePemView === 'cert' && result.certPem}
            {activePemView === 'key' && result.privateKeyPem}
            {activePemView === 'encKey' && result.encryptedPrivateKeyPem}
            {activePemView === 'chain' && result.fullChainPem}
          </pre>
        </div>
      </div>
    </div>
  );
};
