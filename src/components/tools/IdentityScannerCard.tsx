import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Fingerprint, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getThreatIntelligenceProvider, BreachExposure } from '@/platform/ThreatIntelligence';

export function IdentityScannerCard() {
  const [email, setEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [results, setResults] = useState<BreachExposure[]>([]);

  const handleScan = async () => {
    if (!email) return;
    setIsScanning(true);
    setHasScanned(false);
    
    try {
      const provider = getThreatIntelligenceProvider();
      const res = await provider.checkAccountExposure(email);
      if (res.status === 'breach_found') {
        setResults(res.breaches);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsScanning(false);
      setHasScanned(true);
    }
  };

  return (
    <Card className="bg-cyber-bg border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
            <Fingerprint size={20} />
          </div>
          <div>
            <h3 className="text-white font-sans font-bold text-lg">Identity Scanner</h3>
            <p className="text-cyber-textMuted font-mono text-[10px] uppercase">Dark Web Breach Check</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-cyber-surface border border-cyber-neon/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-neon/50 font-mono text-sm placeholder:text-cyber-textMuted"
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
          <Button 
            onClick={handleScan}
            disabled={isScanning || !email}
            className="bg-cyber-neon hover:bg-cyber-neon/80 text-white shadow-[0_0_15px_rgba(255,42,66,0.4)] min-w-[100px]"
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><Search size={18} className="mr-2" /> Scan</>
            )}
          </Button>
        </div>

        {hasScanned && (
          <div className="mt-6 border-t border-cyber-neon/20 pt-6">
            {results.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 text-cyber-neon mb-4">
                  <ShieldAlert size={20} />
                  <span className="font-bold">Found in {results.length} breaches</span>
                </div>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={i} className="bg-cyber-surface p-3 rounded-lg border border-cyber-neon/10 flex justify-between items-start">
                      <div>
                        <div className="text-white font-bold text-sm">{r.title || r.name}</div>
                        <div className="text-cyber-textMuted text-xs mt-1">Data: {r.dataClasses?.join(', ') || 'Unknown'}</div>
                      </div>
                      <div className="text-cyber-textMuted font-mono text-xs bg-cyber-bg px-2 py-1 rounded">
                        {r.breachDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-emerald-400">
                <ShieldCheck size={48} className="mb-3 opacity-80" />
                <span className="font-bold text-lg">No Breaches Found</span>
                <span className="text-emerald-500/60 font-mono text-xs mt-1">Your identity appears secure.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
