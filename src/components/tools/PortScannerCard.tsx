import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, ShieldAlert, ShieldCheck, Activity, Terminal, Server } from 'lucide-react';

interface PortResult {
  port: number;
  status: 'open' | 'closed';
  service: string;
}

export function PortScannerCard() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<PortResult[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState('');

  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;

  const handleScan = async () => {
    if (!isDesktop) return;
    
    setIsScanning(true);
    setHasScanned(false);
    setError('');
    setResults([]);

    try {
      const scanResults = await window.electronAPI!.scanPorts('127.0.0.1');
      setResults(scanResults as PortResult[]);
      setHasScanned(true);
    } catch (e) {
      console.error(e);
      setError('Failed to scan ports. Ensure the native host is running.');
    } finally {
      setIsScanning(false);
    }
  };

  const openPorts = results.filter(r => r.status === 'open');

  return (
    <Card className="p-6 md:p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface hover:border-cyber-neon/40 transition-colors relative overflow-hidden group">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-10 group-hover:opacity-20 transition-opacity" />
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Server className="w-48 h-48 text-cyber-neon" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-xl bg-cyber-bg border border-cyber-neon/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,42,66,0.2)]">
            <Activity className="text-cyber-neon stroke-[2.5]" size={32} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white tracking-wide uppercase font-outline mb-1">Local Port Scanner</h3>
          <p className="text-sm font-mono text-cyber-textMuted uppercase">Identify exposed services on your machine.</p>
        </div>
        
        <div className="flex-shrink-0">
          <Button
            onClick={handleScan}
            disabled={isScanning || !isDesktop}
            className="w-full md:w-auto bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 disabled:opacity-50 flex items-center justify-center gap-2 px-6 rounded-lg shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-xs h-11"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} className="stroke-[2.5]" />
                Scan Now
              </>
            )}
          </Button>
        </div>
      </div>

      {!isDesktop && (
        <div className="mt-6 p-4 bg-cyber-surface/50 border border-cyber-neon/20 rounded-xl flex items-start gap-3 relative z-10">
          <Terminal className="text-cyber-neon shrink-0 mt-0.5 stroke-[2]" size={20} />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Native Feature Required</h4>
            <p className="text-xs text-cyber-textMuted mt-1">
              Port scanning requires low-level network access. It is only available in the Sentinel Native App.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-950/40 border border-red-500/50 rounded-xl flex items-start gap-3 relative z-10 font-mono">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {hasScanned && !error && (
        <div className="mt-8 pt-8 border-t border-cyber-neon/20 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${openPorts.length > 0 ? 'bg-amber-900/40 text-amber-500' : 'bg-emerald-900/40 text-emerald-500'}`}>
              {openPorts.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider">
                {openPorts.length > 0 ? `${openPorts.length} Open Ports Detected` : 'All Common Ports Secure'}
              </h4>
              <p className="text-xs text-cyber-textMuted uppercase font-mono mt-1">
                {openPorts.length > 0 ? 'Active services detected on localhost.' : 'No unauthorized backdoor services found.'}
              </p>
            </div>
          </div>

          {openPorts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {openPorts.map((result) => (
                <div key={result.port} className="flex items-center gap-3 p-3 rounded-lg bg-cyber-bg border border-cyber-neon/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <div>
                    <div className="font-mono text-xs font-bold text-white">PORT {result.port}</div>
                    <div className="text-[10px] text-cyber-textMuted uppercase tracking-wider">{result.service}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {openPorts.length === 0 && (
            <div className="p-4 rounded-xl bg-cyber-bg/50 border border-emerald-500/20 text-center">
              <p className="text-xs text-emerald-500 font-mono uppercase tracking-widest">System scan complete. No exposures found.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
