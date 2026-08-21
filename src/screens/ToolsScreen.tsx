import { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, Link as LinkIcon, Search, AlertCircle, ArrowRight, Globe, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { checkPasswordBreach } from '@/lib/hibp';
import { analyzeLink, type LinkAnalysisResult } from '@/lib/urlScanner';
import { PortScannerCard } from '@/components/tools/PortScannerCard';
import { IdentityScannerCard } from '@/components/tools/IdentityScannerCard';
import { WifiAnalyzerCard } from '@/components/tools/WifiAnalyzerCard';
import { AppPermissionsCard } from '@/components/tools/AppPermissionsCard';
export function ToolsScreen() {
  const [password, setPassword] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ count: number; error?: string } | null>(null);

  const [url, setUrl] = useState('');
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<LinkAnalysisResult | null>(null);

  const handleCheckPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsCheckingPassword(true);
    setPasswordResult(null);
    try {
      const count = await checkPasswordBreach(password);
      setPasswordResult({ count });
    } catch (err) {
      setPasswordResult({ count: 0, error: 'Failed to securely check password.' });
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleCheckUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsCheckingUrl(true);
    setUrlResult(null);
    try {
      // Simulate slight network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const result = await analyzeLink(url);
      setUrlResult(result);
    } finally {
      setIsCheckingUrl(false);
    }
  };

  return (
    <div className="w-full pb-24 md:pb-8 text-cyber-text font-sans">
      <div className="w-full pt-2 md:pt-4">
        
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-outline font-bold tracking-widest uppercase text-white mb-2 shadow-cyber">SECURITY TOOLS</h1>
          <p className="text-cyber-textMuted font-medium font-mono text-sm uppercase tracking-wide">Real-world utilities / active defense</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Password Leak Checker */}
          <Card className="p-6 md:p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface flex flex-col h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-cyber-neon/30 bg-cyber-bg text-cyber-neon shadow-[0_0_15px_rgba(255,42,66,0.2)]">
                <KeyRound size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Password Leak Checker</h2>
                <p className="text-xs font-mono text-cyber-neon/70 uppercase">Powered by HIBP</p>
              </div>
            </div>
            
            <p className="text-sm text-cyber-textMuted mb-6 flex-1 relative z-10">
              Check if your password was exposed in a known data breach. 
              <span className="font-semibold block mt-2 text-cyber-neon/80 text-xs tracking-wider uppercase">100% Private: Hash-only exchange</span>
            </p>

            <form onSubmit={handleCheckPassword} className="space-y-4 relative z-10">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono placeholder:text-cyber-textMuted/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isCheckingPassword || !password}
                  className="absolute right-2 top-2 bottom-2 bg-cyber-neon/10 text-cyber-neon p-2 rounded-lg hover:bg-cyber-neon hover:text-cyber-bg border border-transparent hover:border-cyber-neon disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(255,42,66,0.2)]"
                >
                  {isCheckingPassword ? <div className="w-5 h-5 border-2 border-cyber-neon/30 border-t-cyber-neon rounded-full animate-spin" /> : <Search size={18} className="stroke-[2.5]" />}
                </button>
              </div>
            </form>

            {passwordResult && (
              <div className={`mt-6 p-4 rounded-xl border relative z-10 font-mono ${passwordResult.error ? 'bg-red-950/40 border-red-500/50' : passwordResult.count > 0 ? 'bg-cyber-neon/10 border-cyber-neon/50' : 'bg-emerald-950/40 border-emerald-500/50'}`}>
                {passwordResult.error ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                    <p className="text-sm font-medium text-red-200">{passwordResult.error}</p>
                  </div>
                ) : passwordResult.count > 0 ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-cyber-neon mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-wider">Breach Detected</p>
                      <p className="text-xs text-cyber-neon/80 mt-1">
                        Found <strong className="text-cyber-neon">{passwordResult.count.toLocaleString()}</strong> times in data breaches. Do not use.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Secure</p>
                      <p className="text-xs text-emerald-500/80 mt-1">No known breaches found for this hash.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Link Scanner */}
          <Card className="p-6 md:p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface flex flex-col h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-cyber-neon/30 bg-cyber-bg text-cyber-neon shadow-[0_0_15px_rgba(255,42,66,0.2)]">
                <LinkIcon size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Suspicious Link Scanner</h2>
                <p className="text-xs font-mono text-cyber-neon/70 uppercase">Heuristic Threat Analyzer</p>
              </div>
            </div>
            
            <p className="text-sm text-cyber-textMuted mb-6 flex-1 relative z-10">
              Paste suspicious URLs here before clicking. The engine checks for phishing patterns and homograph attacks.
            </p>

            <form onSubmit={handleCheckUrl} className="space-y-4 relative z-10">
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono placeholder:text-cyber-textMuted/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isCheckingUrl || !url}
                  className="absolute right-2 top-2 bottom-2 bg-cyber-neon/10 text-cyber-neon p-2 rounded-lg hover:bg-cyber-neon hover:text-cyber-bg border border-transparent hover:border-cyber-neon disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(255,42,66,0.2)]"
                >
                  {isCheckingUrl ? <div className="w-5 h-5 border-2 border-cyber-neon/30 border-t-cyber-neon rounded-full animate-spin" /> : <ArrowRight size={18} className="stroke-[2.5]" />}
                </button>
              </div>
            </form>

            {urlResult && (
              <div className={`mt-6 p-4 rounded-xl border relative z-10 font-mono ${urlResult.isSafe ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-cyber-neon/10 border-cyber-neon/50'}`}>
                <div className="flex items-start gap-3">
                  {urlResult.isSafe ? (
                     <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                  ) : (
                     <ShieldAlert className="text-cyber-neon mt-0.5 shrink-0" size={20} />
                  )}
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-bold uppercase tracking-wider ${urlResult.isSafe ? 'text-emerald-400' : 'text-cyber-neon'}`}>
                        {urlResult.isSafe ? 'Looks Safe' : 'Highly Suspicious'}
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urlResult.isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyber-neon/20 text-cyber-neon border border-cyber-neon/50'}`}>
                        SCORE: {urlResult.score}/100
                      </span>
                    </div>
                    
                    {urlResult.flags.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {urlResult.flags.map((flag, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-1.5 text-cyber-neon/90">
                            <span className="text-cyber-neon mt-0.5">⟩</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-500/80 mt-1">No suspicious patterns detected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
          <div className="col-span-1 md:col-span-2">
            <PortScannerCard />
          </div>

          <Card className="p-6 md:p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface hover:border-cyber-neon/40 transition-colors col-span-1 md:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe size={120} className="text-cyber-neon" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-10 group-hover:opacity-20 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl border border-cyber-neon/30 bg-cyber-bg text-cyber-neon shadow-[0_0_15px_rgba(255,42,66,0.2)] flex items-center justify-center">
                  <Globe size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white tracking-wide uppercase font-outline">Active Web Protection</h3>
                  <p className="text-xs font-mono text-cyber-neon/70 uppercase">Block malicious requests</p>
                </div>
              </div>
              
              <p className="text-cyber-textMuted text-sm mb-6 max-w-xl">
                Get the Sentinel Chrome Extension to automatically track and scan the websites you visit in real-time. It seamlessly blocks phishing links, typosquatting domains, and IP-based threats across your entire browser.
              </p>
              
              <Button 
                onClick={() => alert("To install the extension:\n1. Open Chrome Extensions (chrome://extensions/)\n2. Enable Developer Mode\n3. Click 'Load unpacked' and select the 'extension' folder in this project.")}
                className="bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 rounded-lg flex items-center gap-2 px-6 shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-xs"
              >
                <Download size={16} className="stroke-[2.5]" />
                Install Extension
              </Button>
            </div>
          </Card>

          <IdentityScannerCard />
          <WifiAnalyzerCard />
          <AppPermissionsCard />

        </div>
      </div>
    </div>
  );
}
