import React, { useRef } from 'react';
import {
  Vault,
  X,
  Trash2,
  Download,
  KeyRound,
  FileCheck,
  Upload,
  Calendar,
  Hash,
} from 'lucide-react';
import type { SavedCA } from '../types/cert.ts';
import { exportVaultJson, importVaultJson } from '../utils/vaultStorage.ts';

interface CaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultCAs: SavedCA[];
  onSelectForSigning: (caId: string) => void;
  onDeleteCA: (caId: string) => void;
  onReloadVault: () => void;
}

export const CaVaultModal: React.FC<CaVaultModalProps> = ({
  isOpen,
  onClose,
  vaultCAs,
  onSelectForSigning,
  onDeleteCA,
  onReloadVault,
}) => {
  const importFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const json = exportVaultJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certstudio_ca_vault_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        const res = importVaultJson(ev.target.result);
        if (res.success) {
          onReloadVault();
        } else {
          alert('Failed to import vault: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Local Certificate Authority (CA) Vault</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {vaultCAs.length} stored
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Secure in-browser certificate storage for issuing child certificates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar: Import / Export */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Stored encrypted in your browser&apos;s isolated LocalStorage
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Vault Backup</span>
            </button>
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* CA List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {vaultCAs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Vault className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No CAs in Vault Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                To populate your vault, switch mode to &quot;Root / Intermediate CA&quot;, generate a certificate, and click &quot;Save to CA Vault&quot;.
              </p>
            </div>
          ) : (
            vaultCAs.map(ca => {
              const baseName = ca.name.toLowerCase().replace(/[^a-z0-9]/gi, '_');
              return (
                <div
                  key={ca.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-white">{ca.name}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                          CA:TRUE
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{ca.subjectDN}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectForSigning(ca.id);
                          onClose();
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Sign With This CA</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCA(ca.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete from Vault"
                        aria-label="Delete CA"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-900 text-slate-400">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono truncate">{ca.fingerprintSha256}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Expires: {new Date(ca.notAfter).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Export buttons */}
                  <div className="flex items-center space-x-2 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => downloadText(ca.certPem, `${baseName}_ca.crt`)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                    >
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      <span>Download CA (.crt)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(ca.privateKeyPem, `${baseName}_ca.key`)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                    >
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      <span>Download Key (.key)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
