import React, { useState } from 'react';
import { Terminal, FileCode, Copy, Check, Download } from 'lucide-react';
import { generateOpenSSLConfig, generateOpenSSLCommands, type GenerateCertOptions } from '../utils/cryptoEngine.ts';

interface OpenSSLPanelProps {
  options: GenerateCertOptions;
}

export const OpenSSLPanel: React.FC<OpenSSLPanelProps> = ({ options }) => {
  const [activeTab, setActiveTab] = useState<'cli' | 'cnf'>('cli');
  const [copied, setCopied] = useState<string | null>(null);

  const cliCommands = generateOpenSSLCommands(options);
  const cnfContent = generateOpenSSLConfig(options);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadCnf = () => {
    const blob = new Blob([cnfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openssl.cnf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSh = () => {
    const blob = new Blob([cliCommands], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generate_cert.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-200">
            Live OpenSSL CLI &amp; Config Translator
          </h3>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cli')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
                activeTab === 'cli'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Bash CLI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cnf')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
                activeTab === 'cnf'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>openssl.cnf</span>
            </button>
          </div>

          {activeTab === 'cli' ? (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={downloadSh}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 rounded border border-slate-800 transition-colors"
                title="Download bash script"
                aria-label="Download bash script"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(cliCommands, 'cli')}
                className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-950 rounded border border-slate-800 transition-colors"
              >
                {copied === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'cli' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={downloadCnf}
                className="flex items-center space-x-1 text-xs text-cyan-300 hover:text-white px-2 py-1 bg-cyan-950/40 rounded border border-cyan-500/30 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download .cnf</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(cnfContent, 'cnf')}
                className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-950 rounded border border-slate-800 transition-colors"
              >
                {copied === 'cnf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'cnf' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <pre className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed selection:bg-slate-700">
          {activeTab === 'cli' ? cliCommands : cnfContent}
        </pre>
      </div>
      <p className="text-[10px] text-slate-500">
        Run these commands directly in your local terminal with standard OpenSSL 1.1.1 / 3.x.
      </p>
    </div>
  );
};
