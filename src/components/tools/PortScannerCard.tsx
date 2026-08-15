import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      setResults(scanResults);
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
    <Card className="p-6 md:p-8 rounded-[32px] border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Server className="w-48 h-48 text-indigo-900" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Terminal className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Local Port Scanner</h3>
          <p className="text-slate-500 mb-4 max-w-xl text-sm leading-relaxed">
            Raw TCP scan of your localhost (127.0.0.1). Detects if background services, development tools, or malware are secretly exposing local servers that could be exploited.
          </p>
          
          {!isDesktop ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-sm font-medium border border-slate-200">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Desktop App Required
            </div>
          ) : (
            <Button 
              onClick={handleScan} 
              disabled={isScanning}
              className={`rounded-full px-6 font-semibold transition-all ${
                isScanning ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
              }`}
            >
              {isScanning ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-pulse" />
                  Scanning Ports...
                </>
              ) : (
                'Scan Localhost'
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          {error}
        </div>
      )}

      {hasScanned && !error && (
        <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${openPorts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {openPorts.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {openPorts.length > 0 ? `${openPorts.length} Open Ports Detected` : 'All Common Ports Secure'}
              </h4>
              <p className="text-sm text-slate-500">
                {openPorts.length > 0 ? 'We found active services listening on your local machine.' : 'No unexpected backdoor services detected.'}
              </p>
            </div>
          </div>

          {openPorts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {openPorts.map((result) => (
                <div key={result.port} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-700">Port {result.port}</div>
                    <div className="text-xs text-slate-500">{result.service}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {openPorts.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-sm text-slate-600 font-medium">Scanned 20+ common exploit ports. None are exposed.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
