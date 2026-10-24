/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  FileCheck,
  KeyRound,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { PresetsBar } from './components/PresetsBar.tsx';
import { DNForm } from './components/DNForm.tsx';
import { CryptoParamsForm } from './components/CryptoParamsForm.tsx';
import { ExtensionsForm } from './components/ExtensionsForm.tsx';
import { IssuerSelector } from './components/IssuerSelector.tsx';
import { CertOutputCard } from './components/CertOutputCard.tsx';
import { OpenSSLPanel } from './components/OpenSSLPanel.tsx';
import { CaVaultModal } from './components/CaVaultModal.tsx';
import { CertDecoderView } from './components/CertDecoderView.tsx';

import type {
  ActiveTab,
  CertMode,
  FormState,
  GeneratedCertificateResult,
  SavedCA,
} from './types/cert.ts';
import {
  generateRandomSerial,
  generateX509Certificate,
  type GenerateCertOptions,
} from './utils/cryptoEngine.ts';
import {
  getSavedCAs,
  saveCAToVault,
  deleteCAFromVault,
} from './utils/vaultStorage.ts';

const DEFAULT_FORM_STATE: FormState = {
  mode: 'self_signed',
  subject: {
    commonName: 'localhost',
    organization: 'Localhost Development Org',
    organizationalUnit: 'Engineering',
    country: 'US',
    state: 'California',
    locality: 'San Francisco',
    emailAddress: 'dev@localhost.local',
  },
  keySize: 2048,
  digest: 'SHA-256',
  serialNumberHex: generateRandomSerial(),
  notBeforeDate: new Date().toISOString().split('T')[0],
  notAfterDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  passphrase: '',
  sans: [
    { id: 'san-1', type: 'DNS', value: 'localhost' },
    { id: 'san-2', type: 'IP', value: '127.0.0.1' },
    { id: 'san-3', type: 'DNS', value: '*.localhost.local' },
  ],
  basicConstraints: {
    cA: false,
    critical: true,
    pathLenConstraint: null,
  },
  keyUsage: {
    digitalSignature: true,
    nonRepudiation: false,
    keyEncipherment: true,
    dataEncipherment: false,
    keyAgreement: false,
    keyCertSign: false,
    cRLSign: false,
    critical: true,
  },
  extKeyUsage: {
    serverAuth: true,
    clientAuth: true,
    codeSigning: false,
    emailProtection: false,
    timeStamping: false,
    critical: false,
  },
  issuerSource: 'vault',
  selectedVaultCaId: '',
  customIssuerCertPem: '',
  customIssuerKeyPem: '',
  customIssuerPassphrase: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedCertificateResult | null>(null);

  // Vault state
  const [vaultCAs, setVaultCAs] = useState<SavedCA[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isSavedInVault, setIsSavedInVault] = useState<boolean>(false);

  // Load vault on initial mount
  useEffect(() => {
    const cas = getSavedCAs();
    setVaultCAs(cas);
    if (cas.length > 0 && !formState.selectedVaultCaId) {
      setFormState(prev => ({ ...prev, selectedVaultCaId: cas[0].id }));
    }
  }, []);

  const reloadVault = () => {
    const cas = getSavedCAs();
    setVaultCAs(cas);
    if (cas.length > 0 && !formState.selectedVaultCaId) {
      setFormState(prev => ({ ...prev, selectedVaultCaId: cas[0].id }));
    }
  };

  const handleModeChange = (mode: CertMode) => {
    setFormState(prev => {
      let updatedBc = { ...prev.basicConstraints };
      let updatedKu = { ...prev.keyUsage };
      let updatedEku = { ...prev.extKeyUsage };

      if (mode === 'root_ca') {
        updatedBc = { cA: true, critical: true, pathLenConstraint: null };
        updatedKu = {
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: false,
          dataEncipherment: false,
          keyAgreement: false,
          keyCertSign: true,
          cRLSign: true,
          critical: true,
        };
        updatedEku = {
          serverAuth: false,
          clientAuth: false,
          codeSigning: false,
          emailProtection: false,
          timeStamping: false,
          critical: false,
        };
      } else {
        updatedBc = { cA: false, critical: true, pathLenConstraint: null };
        updatedKu = {
          ...updatedKu,
          keyCertSign: false,
          cRLSign: false,
          keyEncipherment: true,
          digitalSignature: true,
        };
        updatedEku = {
          ...updatedEku,
          serverAuth: true,
        };
      }

      return {
        ...prev,
        mode,
        basicConstraints: updatedBc,
        keyUsage: updatedKu,
        extKeyUsage: updatedEku,
      };
    });
    setIsSavedInVault(false);
  };

  const handleApplyPreset = (presetKey: string) => {
    const now = new Date();
    if (presetKey === 'localhost') {
      setFormState(prev => ({
        ...prev,
        mode: 'self_signed',
        subject: {
          commonName: 'localhost',
          organization: 'Local Development Server',
          country: 'US',
          state: 'California',
          locality: 'San Francisco',
        },
        notBeforeDate: now.toISOString().split('T')[0],
        notAfterDate: new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0],
        sans: [
          { id: '1', type: 'DNS', value: 'localhost' },
          { id: '2', type: 'IP', value: '127.0.0.1' },
          { id: '3', type: 'DNS', value: '*.local' },
        ],
        basicConstraints: { cA: false, critical: true },
        keyUsage: {
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: true,
          dataEncipherment: false,
          keyAgreement: false,
          keyCertSign: false,
          cRLSign: false,
          critical: true,
        },
        extKeyUsage: {
          serverAuth: true,
          clientAuth: true,
          codeSigning: false,
          emailProtection: false,
          timeStamping: false,
          critical: false,
        },
      }));
    } else if (presetKey === 'root_ca') {
      setFormState(prev => ({
        ...prev,
        mode: 'root_ca',
        subject: {
          commonName: 'Enterprise Root CA',
          organization: 'Internal Security PKI',
          organizationalUnit: 'Certificate Authority Dept',
          country: 'US',
          state: 'Washington',
          locality: 'Seattle',
        },
        notBeforeDate: now.toISOString().split('T')[0],
        notAfterDate: new Date(now.getTime() + 3650 * 86400000).toISOString().split('T')[0],
        sans: [],
        basicConstraints: { cA: true, critical: true, pathLenConstraint: null },
        keyUsage: {
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: false,
          dataEncipherment: false,
          keyAgreement: false,
          keyCertSign: true,
          cRLSign: true,
          critical: true,
        },
        extKeyUsage: {
          serverAuth: false,
          clientAuth: false,
          codeSigning: false,
          emailProtection: false,
          timeStamping: false,
          critical: false,
        },
      }));
    } else if (presetKey === 'wildcard') {
      setFormState(prev => ({
        ...prev,
        mode: 'self_signed',
        subject: {
          commonName: '*.example.internal',
          organization: 'Example Corp',
          country: 'US',
        },
        notBeforeDate: now.toISOString().split('T')[0],
        notAfterDate: new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0],
        sans: [
          { id: '1', type: 'DNS', value: '*.example.internal' },
          { id: '2', type: 'DNS', value: 'example.internal' },
        ],
        basicConstraints: { cA: false, critical: true },
        keyUsage: {
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: true,
          dataEncipherment: false,
          keyAgreement: false,
          keyCertSign: false,
          cRLSign: false,
          critical: true,
        },
        extKeyUsage: {
          serverAuth: true,
          clientAuth: false,
          codeSigning: false,
          emailProtection: false,
          timeStamping: false,
          critical: false,
        },
      }));
    } else if (presetKey === 'mtls') {
      setFormState(prev => ({
        ...prev,
        mode: 'self_signed',
        subject: {
          commonName: 'client.user@corp.internal',
          organization: 'Security Operations',
          organizationalUnit: 'Zero Trust mTLS',
          country: 'US',
          emailAddress: 'client.user@corp.internal',
        },
        notBeforeDate: now.toISOString().split('T')[0],
        notAfterDate: new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0],
        sans: [{ id: '1', type: 'Email', value: 'client.user@corp.internal' }],
        basicConstraints: { cA: false, critical: true },
        keyUsage: {
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: true,
          dataEncipherment: false,
          keyAgreement: false,
          keyCertSign: false,
          cRLSign: false,
          critical: true,
        },
        extKeyUsage: {
          serverAuth: false,
          clientAuth: true,
          codeSigning: false,
          emailProtection: true,
          timeStamping: false,
          critical: false,
        },
      }));
    }
  };

  // Convert current form state into GenerateCertOptions
  const cryptoOptions: GenerateCertOptions = useMemo(() => {
    let issuerCertPem: string | undefined = undefined;
    let issuerPrivateKeyPem: string | undefined = undefined;
    let issuerPassphrase: string | undefined = undefined;

    if (formState.mode === 'ca_signed') {
      if (formState.issuerSource === 'vault') {
        const found = vaultCAs.find(c => c.id === formState.selectedVaultCaId);
        if (found) {
          issuerCertPem = found.certPem;
          issuerPrivateKeyPem = found.privateKeyPem;
          issuerPassphrase = found.passphrase;
        }
      } else {
        issuerCertPem = formState.customIssuerCertPem;
        issuerPrivateKeyPem = formState.customIssuerKeyPem;
        issuerPassphrase = formState.customIssuerPassphrase;
      }
    }

    return {
      mode: formState.mode,
      subject: formState.subject,
      keySize: formState.keySize,
      digest: formState.digest,
      serialNumberHex: formState.serialNumberHex,
      notBefore: formState.notBeforeDate ? new Date(formState.notBeforeDate) : new Date(),
      notAfter: formState.notAfterDate
        ? new Date(formState.notAfterDate)
        : new Date(Date.now() + 365 * 86400000),
      passphrase: formState.passphrase,
      sans: formState.sans,
      basicConstraints: formState.basicConstraints,
      keyUsage: formState.keyUsage,
      extKeyUsage: formState.extKeyUsage,
      issuerCertPem,
      issuerPrivateKeyPem,
      issuerPassphrase,
    };
  }, [formState, vaultCAs]);

  const handleGenerateCertificate = async () => {
    if (!formState.subject.commonName?.trim()) {
      setGenerationError('Common Name (CN) is required.');
      return;
    }

    if (formState.mode === 'ca_signed') {
      if (formState.issuerSource === 'vault' && !formState.selectedVaultCaId) {
        setGenerationError('Please select a Root/Intermediate CA from the vault to sign this certificate.');
        return;
      }
      if (
        formState.issuerSource === 'custom' &&
        (!formState.customIssuerCertPem.trim() || !formState.customIssuerKeyPem.trim())
      ) {
        setGenerationError('Both Issuer Certificate (.crt) and Issuer Private Key (.key) are required.');
        return;
      }
    }

    setGenerationError(null);
    setIsGenerating(true);
    setGenerationStatus('Initializing cryptographic engine...');

    try {
      // Async generation
      const result = await generateX509Certificate(cryptoOptions, status => {
        setGenerationStatus(status);
      });
      setGeneratedResult(result);
      setIsSavedInVault(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cryptographic generation error';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleSaveToVault = () => {
    if (!generatedResult || formState.mode !== 'root_ca') return;

    const caRecord: SavedCA = {
      id: 'ca-' + Date.now().toString(36),
      name: formState.subject.commonName || 'Root CA',
      createdAt: new Date().toISOString(),
      certPem: generatedResult.certPem,
      privateKeyPem: generatedResult.privateKeyPem,
      passphrase: formState.passphrase,
      fingerprintSha256: generatedResult.fingerprintSha256,
      notAfter: generatedResult.notAfter.toISOString(),
      subjectDN: generatedResult.subjectDN,
    };

    saveCAToVault(caRecord);
    setIsSavedInVault(true);
    reloadVault();
  };

  const handleSelectCaForSigning = (caId: string) => {
    setFormState(prev => ({
      ...prev,
      mode: 'ca_signed',
      issuerSource: 'vault',
      selectedVaultCaId: caId,
    }));
  };

  const handleDeleteCA = (caId: string) => {
    deleteCAFromVault(caId);
    reloadVault();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vaultCount={vaultCAs.length}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'decoder' ? (
          <CertDecoderView lastGeneratedPem={generatedResult?.certPem} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Controls & Form Sections (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Generation Mode Selector */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                <span className="block text-xs font-semibold text-slate-400 mb-2">
                  Certificate Generation Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('root_ca')}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      formState.mode === 'root_ca'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Root / Intermediate CA</div>
                      <div className="text-[10px] text-slate-400">cA: TRUE, keyCertSign</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('self_signed')}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      formState.mode === 'self_signed'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Self-Signed Leaf</div>
                      <div className="text-[10px] text-slate-400">cA: FALSE, Web/Client</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('ca_signed')}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      formState.mode === 'ca_signed'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">CA-Signed Leaf</div>
                      <div className="text-[10px] text-slate-400">Signed with Root CA</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick-Fill Presets Bar */}
              <PresetsBar
                currentMode={formState.mode}
                onApplyPreset={handleApplyPreset}
              />

              {/* If CA-Signed Mode: Issuer Selection Section */}
              {formState.mode === 'ca_signed' && (
                <IssuerSelector
                  issuerSource={formState.issuerSource}
                  onSourceChange={source => setFormState(p => ({ ...p, issuerSource: source }))}
                  vaultCAs={vaultCAs}
                  selectedVaultCaId={formState.selectedVaultCaId}
                  onSelectVaultCa={id => setFormState(p => ({ ...p, selectedVaultCaId: id }))}
                  customCertPem={formState.customIssuerCertPem}
                  onCustomCertPemChange={pem => setFormState(p => ({ ...p, customIssuerCertPem: pem }))}
                  customKeyPem={formState.customIssuerKeyPem}
                  onCustomKeyPemChange={pem => setFormState(p => ({ ...p, customIssuerKeyPem: pem }))}
                  customPassphrase={formState.customIssuerPassphrase}
                  onCustomPassphraseChange={pass =>
                    setFormState(p => ({ ...p, customIssuerPassphrase: pass }))
                  }
                />
              )}

              {/* Subject DN Form */}
              <DNForm
                subject={formState.subject}
                onChange={subject => setFormState(p => ({ ...p, subject }))}
              />

              {/* Cryptographic Parameters & Validity Form */}
              <CryptoParamsForm
                keySize={formState.keySize}
                onKeySizeChange={keySize => setFormState(p => ({ ...p, keySize }))}
                digest={formState.digest}
                onDigestChange={digest => setFormState(p => ({ ...p, digest }))}
                serialNumberHex={formState.serialNumberHex}
                onSerialChange={serialNumberHex => setFormState(p => ({ ...p, serialNumberHex }))}
                notBeforeDate={formState.notBeforeDate}
                onNotBeforeChange={notBeforeDate => setFormState(p => ({ ...p, notBeforeDate }))}
                notAfterDate={formState.notAfterDate}
                onNotAfterChange={notAfterDate => setFormState(p => ({ ...p, notAfterDate }))}
                passphrase={formState.passphrase}
                onPassphraseChange={passphrase => setFormState(p => ({ ...p, passphrase }))}
              />

              {/* X.509 v3 Extensions Form */}
              <ExtensionsForm
                sans={formState.sans}
                onSansChange={sans => setFormState(p => ({ ...p, sans }))}
                basicConstraints={formState.basicConstraints}
                onBasicConstraintsChange={basicConstraints =>
                  setFormState(p => ({ ...p, basicConstraints }))
                }
                keyUsage={formState.keyUsage}
                onKeyUsageChange={keyUsage => setFormState(p => ({ ...p, keyUsage }))}
                extKeyUsage={formState.extKeyUsage}
                onExtKeyUsageChange={extKeyUsage => setFormState(p => ({ ...p, extKeyUsage }))}
              />
            </div>

            {/* RIGHT COLUMN: Generation Actions & Output / CLI (5 cols) */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
              {/* Generate Trigger Button & Progress Bar */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 shadow-xl space-y-3">
                <button
                  type="button"
                  onClick={handleGenerateCertificate}
                  disabled={isGenerating}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
                    isGenerating
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-[0.99]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{generationStatus || 'Generating Keypair & Certificate...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Generate X.509 Certificate</span>
                    </>
                  )}
                </button>

                {generationError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{generationError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Asynchronous Web Workers &bull; No UI Freeze</span>
                  <span className="font-mono text-emerald-400">100% Client-Side</span>
                </div>
              </div>

              {/* Certificate Output Card (when generated) */}
              {generatedResult && (
                <CertOutputCard
                  result={generatedResult}
                  mode={formState.mode}
                  onSaveToVault={handleSaveToVault}
                  isSavedToVault={isSavedInVault}
                />
              )}

              {/* Live OpenSSL CLI & openssl.cnf Translator */}
              <OpenSSLPanel options={cryptoOptions} />
            </div>
          </div>
        )}
      </main>

      {/* Local CA Vault Modal */}
      <CaVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vaultCAs={vaultCAs}
        onSelectForSigning={handleSelectCaForSigning}
        onDeleteCA={handleDeleteCA}
        onReloadVault={reloadVault}
      />
    </div>
  );
}
