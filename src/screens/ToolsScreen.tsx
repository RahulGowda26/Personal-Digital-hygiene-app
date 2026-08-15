import { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, Link as LinkIcon, Search, AlertCircle, ArrowRight, Globe, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { checkPasswordBreach } from '@/lib/hibp';
import { analyzeLink, type LinkAnalysisResult } from '@/lib/urlScanner';

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
    <div className="w-full pb-24 md:pb-8 text-slate-900 font-sans">
      <div className="w-full pt-2 md:pt-4">
        
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Security Tools</h1>
          <p className="text-slate-500 font-medium">Real-world utilities to keep your identity safe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Password Leak Checker */}
          <Card className="p-6 md:p-8 rounded-[32px] border-slate-100 shadow-sm bg-white flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-900">
                <KeyRound size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Password Leak Checker</h2>
                <p className="text-sm text-slate-500">Powered by Have I Been Pwned</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 flex-1">
              Check if your password was exposed in a known data breach. 
              <span className="font-semibold block mt-1 text-slate-700">100% Private: Only an anonymized hash is sent.</span>
            </p>

            <form onSubmit={handleCheckPassword} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter a password to check..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={isCheckingPassword || !password}
                  className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isCheckingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
                </button>
              </div>
            </form>

            {passwordResult && (
              <div className={`mt-6 p-4 rounded-2xl border ${passwordResult.error ? 'bg-red-50 border-red-100' : passwordResult.count > 0 ? 'bg-[#fff1ef] border-[#ffcdc4]' : 'bg-emerald-50 border-emerald-100'}`}>
                {passwordResult.error ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                    <p className="text-sm font-medium text-red-900">{passwordResult.error}</p>
                  </div>
                ) : passwordResult.count > 0 ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-[#ff6b52] mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-[#d94a32]">Oh no — pwned!</p>
                      <p className="text-sm text-[#d94a32]/80 mt-1">
                        This password has been seen <strong>{passwordResult.count.toLocaleString()}</strong> times in data breaches. You should never use it.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Good news!</p>
                      <p className="text-sm text-emerald-800/80 mt-1">This password wasn't found in any known data breaches.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Link Scanner */}
          <Card className="p-6 md:p-8 rounded-[32px] border-slate-100 shadow-sm bg-white flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-900">
                <LinkIcon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Suspicious Link Scanner</h2>
                <p className="text-sm text-slate-500">Heuristic Threat Analyzer</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 flex-1">
              Received a sketchy SMS or email? Paste the link here before clicking it to check for phishing and malicious patterns.
            </p>

            <form onSubmit={handleCheckUrl} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={isCheckingUrl || !url}
                  className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isCheckingUrl ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={18} />}
                </button>
              </div>
            </form>

            {urlResult && (
              <div className={`mt-6 p-4 rounded-2xl border ${urlResult.isSafe ? 'bg-emerald-50 border-emerald-100' : 'bg-[#fff1ef] border-[#ffcdc4]'}`}>
                <div className="flex items-start gap-3">
                  {urlResult.isSafe ? (
                     <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                  ) : (
                     <ShieldAlert className="text-[#ff6b52] mt-0.5 shrink-0" size={20} />
                  )}
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-bold ${urlResult.isSafe ? 'text-emerald-900' : 'text-[#d94a32]'}`}>
                        {urlResult.isSafe ? 'Looks Safe' : 'Highly Suspicious'}
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urlResult.isSafe ? 'bg-emerald-200 text-emerald-900' : 'bg-[#ff6b52] text-white'}`}>
                        Score: {urlResult.score}/100
                      </span>
                    </div>
                    
                    {urlResult.flags.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {urlResult.flags.map((flag, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-1.5 text-slate-700">
                            <span className="text-red-500 mt-0.5">•</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-emerald-800/80 mt-1">No suspicious patterns detected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 md:p-8 rounded-[32px] border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow col-span-1 md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Real-Time Web Protection</h3>
                  <p className="text-sm font-medium text-slate-500">Block malicious sites before they load.</p>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6 max-w-xl">
                Get the Sentinel Chrome Extension to automatically track and scan the websites you visit in real-time. It seamlessly blocks phishing links, typosquatting domains, and IP-based threats across your entire browser.
              </p>
              
              <Button 
                onClick={() => alert("To install the extension:\n1. Open Chrome Extensions (chrome://extensions/)\n2. Enable Developer Mode\n3. Click 'Load unpacked' and select the 'extension' folder in this project.")}
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-full flex items-center gap-2 px-6"
              >
                <Download size={18} />
                Install Companion Extension
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
