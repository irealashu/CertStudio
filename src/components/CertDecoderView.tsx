import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  Search,
  FileCode,
  Shield,
  Layers,
  Key,
  Hash,
  Calendar,
} from 'lucide-react';
import { decodeCertificate, type DecodedCertificate } from '../utils/cryptoEngine.ts';

interface CertDecoderViewProps {
  lastGeneratedPem?: string;
}

const SAMPLE_LE_CERT = `-----BEGIN CERTIFICATE-----
MIIEUzCCAzoCCQDb+k62X0u89TANBgkqhkiG9w0BAQsFADBZMQswCQYDVQQGEwJV
UzEOMAwGA1UECAwFVGV4YXMxEDAOBgNVBAcMB0hvdXN0b24xETAPBgNVBAoMCEV4
YW1wbGUxGDAWBgNVBAMMD0V4YW1wbGUgUm9vdCBDQTAeFw0yNDA0MDEwMDAwMDBa
Fw0yNTA0MDEwMDAwMDBaMFgxCzAJBgNVBAYTAlVTMQ4wDAYDVQQIDAVUZXhhczEQ
MA4GA1UEBwwHSHVzdG9uMREwDwYDVQQKDAhFeGFtcGxlMRcwFQYDVQQDDA4qLmV4
YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0p9fQhDq
pC4c5u1nvdzQ0xYdE0gS00ZgP+z6w6L+e/0g7Fv8c0wQZ1d2m5L1i4o/x2m5L1i4
o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2
m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1
i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/
x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5L1i4o/x2m5
L1i4o/x2m5L1wIDAQABo4H7MIH4MAkGA1UdEwQCMAAwCwYDVR0PBAQDAgWgMB0G
A1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjA+BgNVHREENzA1gg4qLmV4YW1w
bGUuY29tggtleGFtcGxlLmNvbYIOYXBpLmV4YW1wbGUuY29tgglsb2NhbGhvc3Qw
HQYDVR0OBBYEFPE1H2xK0R1vX5yY1uXoR6o9T3c0MB8GA1UdIwQYMBaAFPE1H2xK
0R1vX5yY1uXoR6o9T3c0MA0GCSqGSIb3DQEBCwUAA4IBAQCcP1y5e9M1u4Q8u89T
ANBgkqhkiG9w0BAQsFADBZMQswCQYDVQQGEwJVUzEOMAwGA1UECAwFVGV4YXM=
-----END CERTIFICATE-----`;

export const CertDecoderView: React.FC<CertDecoderViewProps> = ({ lastGeneratedPem }) => {
  const [inputText, setInputText] = useState<string>('');
  const [decoded, setDecoded] = useState<DecodedCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDecode = (text: string) => {
    if (!text.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }
    try {
      const res = decodeCertificate(text);
      setDecoded(res);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid certificate format';
      setError(`Failed to decode X.509 certificate: ${msg}`);
      setDecoded(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if binary or text
    const reader = new FileReader();
    reader.onload = ev => {
      const buffer = ev.target?.result;
      if (typeof buffer === 'string') {
        setInputText(buffer);
        handleDecode(buffer);
      } else if (buffer instanceof ArrayBuffer) {
        // Try decoding as binary Uint8Array
        try {
          const u8 = new Uint8Array(buffer);
          const res = decodeCertificate(u8);
          setDecoded(res);
          setInputText(res.rawPem);
          setError(null);
        } catch {
          // Fallback to text
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(buffer);
          setInputText(str);
          handleDecode(str);
        }
      }
    };

    if (file.name.endsWith('.der') || file.name.endsWith('.cer')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <span>X.509 Certificate Decoder &amp; Inspector</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste PEM text or upload a <code className="text-emerald-300">.crt</code> / <code className="text-emerald-300">.cer</code> / <code className="text-emerald-300">.pem</code> file to inspect ASN.1 structures, fingerprints, and v3 extensions
            </p>
          </div>

          {/* Quick Fill Sample Actions */}
          <div className="flex items-center space-x-2 text-xs">
            {lastGeneratedPem && (
              <button
                type="button"
                onClick={() => {
                  setInputText(lastGeneratedPem);
                  handleDecode(lastGeneratedPem);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors font-medium"
              >
                Inspect Last Generated Cert
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setInputText(SAMPLE_LE_CERT);
                handleDecode(SAMPLE_LE_CERT);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Load Example Cert
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Certificate</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pem,.crt,.cer,.der"
              className="hidden"
            />
          </div>
        </div>

        {/* Text Input Area */}
        <div className="mt-4">
          <textarea
            rows={5}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              handleDecode(e.target.value);
            }}
            placeholder="Paste -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE----- here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all leading-relaxed"
          />
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Decoded Results Card */}
      {decoded && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-6 shadow-xl">
          {/* Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  decoded.isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                }`}
              >
                {decoded.isActive ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">
                    {decoded.subject.commonName || 'X.509 Certificate'}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      decoded.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : decoded.isExpired
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {decoded.isActive ? `ACTIVE (${decoded.daysRemaining} days left)` : decoded.isExpired ? 'EXPIRED' : 'NOT YET ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Serial: <span className="text-slate-300 font-bold">{decoded.serialNumberHex}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PUBLIC KEY</span>
                <span className="font-mono font-semibold text-slate-200">{decoded.keySize}-bit RSA</span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ALGORITHM</span>
                <span className="font-mono text-emerald-400">{decoded.signatureAlgorithm}</span>
              </div>
            </div>
          </div>

          {/* Distinguished Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Subject Entity</span>
              </span>
              <p className="text-xs text-slate-400 font-mono leading-relaxed break-all">
                {decoded.subjectString}
              </p>
              <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[11px]">
                {decoded.subject.organization && (
                  <div>
                    <span className="text-slate-500">Org:</span> <span className="text-slate-300">{decoded.subject.organization}</span>
                  </div>
                )}
                {decoded.subject.country && (
                  <div>
                    <span className="text-slate-500">Country:</span> <span className="text-slate-300">{decoded.subject.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Issuer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Issuer Authority</span>
              </span>
              <p className="text-xs text-slate-400 font-mono leading-relaxed break-all">
                {decoded.issuerString}
              </p>
              <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500">
                {decoded.subjectString === decoded.issuerString ? (
                  <span className="text-emerald-400 font-medium">Self-Signed Root Certificate</span>
                ) : (
                  <span className="text-indigo-300 font-medium">Signed by Intermediate/Root CA</span>
                )}
              </div>
            </div>
          </div>

          {/* Validity & Fingerprints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validity Dates */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Validity Window</span>
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Not Before:</span>
                  <span className="text-slate-200">{decoded.notBefore.toUTCString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Not After:</span>
                  <span className="text-slate-200">{decoded.notAfter.toUTCString()}</span>
                </div>
              </div>
            </div>

            {/* Fingerprints */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-cyan-400" />
                <span>Cryptographic Fingerprints</span>
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">SHA-256:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(decoded.fingerprintSha256, 'sha256')}
                    className="text-[11px] text-slate-300 hover:text-white font-mono flex items-center space-x-1 truncate max-w-[260px]"
                  >
                    <span className="truncate">{decoded.fingerprintSha256}</span>
                    {copiedKey === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">SHA-1:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(decoded.fingerprintSha1, 'sha1')}
                    className="text-[11px] text-slate-300 hover:text-white font-mono flex items-center space-x-1 truncate max-w-[260px]"
                  >
                    <span className="truncate">{decoded.fingerprintSha1}</span>
                    {copiedKey === 'sha1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decoded X.509 v3 Extensions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Decoded X.509 v3 Extensions ({decoded.extensions.length})</span>
            </span>

            {decoded.extensions.length === 0 ? (
              <p className="text-xs text-slate-500">No v3 extensions found in this certificate.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {decoded.extensions.map((ext, idx) => (
                  <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-medium text-emerald-300">{ext.name}</span>
                      {ext.critical && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 font-mono text-[11px] break-all sm:text-right">
                      {ext.valueDescription}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw PEM Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                <FileCode className="w-3.5 h-3.5" />
                <span>Normalized Certificate PEM</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(decoded.rawPem, 'rawPem')}
                className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-slate-950 rounded border border-slate-800"
              >
                {copiedKey === 'rawPem' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'rawPem' ? 'Copied' : 'Copy PEM'}</span>
              </button>
            </div>
            <pre className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-300/80 overflow-x-auto max-h-48 leading-relaxed">
              {decoded.rawPem}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
