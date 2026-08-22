import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wifi, Shield, ShieldAlert, Activity, Lock, Unlock } from 'lucide-react';
import { SentinelNetworkScanner, NativeNetworkSignalsResponse } from '@/platform/capacitor/NetworkScannerBridge';

export function WifiAnalyzerCard() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState<NativeNetworkSignalsResponse | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setHasScanned(false);
    setProgress(0);
    
    try {
      const result = await SentinelNetworkScanner.getNetworkSignals({ sessionId: 'manual' });
      setScanResult(result);
      
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            setHasScanned(true);
            return 100;
          }
          return p + 10;
        });
      }, 50);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
    }
  };

  return (
    <Card className="bg-cyber-bg border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
            <Wifi size={20} />
          </div>
          <div>
            <h3 className="text-white font-sans font-bold text-lg">Network Analyzer</h3>
            <p className="text-cyber-textMuted font-mono text-[10px] uppercase">Wi-Fi Security Check</p>
          </div>
        </div>

        {!hasScanned && !isScanning && (
          <div className="mt-6 flex flex-col items-center justify-center py-6 border border-dashed border-cyber-neon/20 rounded-xl bg-cyber-surface/50">
            <Wifi size={40} className="text-cyber-neon/50 mb-4" />
            <p className="text-cyber-textMuted text-sm text-center mb-4 px-4">
              Analyze your current network connection for vulnerabilities, rogue access points, and encryption strength.
            </p>
            <Button 
              onClick={handleScan}
              className="bg-cyber-neon hover:bg-cyber-neon/80 text-white shadow-[0_0_15px_rgba(255,42,66,0.4)]"
            >
              Analyze Network
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="mt-6 border border-cyber-neon/30 rounded-xl p-6 bg-cyber-surface/80 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,42,66,0.1)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 animate-pulse" />
            <div className="relative z-10 flex flex-col items-center">
              <Activity size={32} className="text-cyber-neon animate-pulse mb-4" />
              <p className="text-white font-mono text-sm tracking-widest uppercase mb-2">Analyzing Packets...</p>
              <div className="w-full h-2 bg-cyber-bg rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-cyber-neon transition-all duration-100 shadow-[0_0_10px_rgba(255,42,66,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {hasScanned && scanResult && (
          <div className="mt-6 border-t border-cyber-neon/20 pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-cyber-surface p-4 rounded-xl border border-cyber-neon/20 flex flex-col items-center text-center">
                <Lock size={24} className={scanResult.isOpenNetwork ? "text-red-400 mb-2" : "text-emerald-400 mb-2"} />
                <span className="text-cyber-textMuted font-mono text-[10px] uppercase">Encryption</span>
                <span className="text-white font-bold text-sm mt-1">{scanResult.isOpenNetwork ? 'Open / None' : 'Secured'}</span>
              </div>
              <div className="bg-cyber-surface p-4 rounded-xl border border-cyber-neon/20 flex flex-col items-center text-center">
                <Shield size={24} className={scanResult.isVpnActive ? "text-emerald-400 mb-2" : "text-amber-400 mb-2"} />
                <span className="text-cyber-textMuted font-mono text-[10px] uppercase">VPN Status</span>
                <span className="text-white font-bold text-sm mt-1">{scanResult.isVpnActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            <div className="bg-cyber-bg border border-cyber-neon/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white text-sm font-bold">Network Information</span>
                <span className={scanResult.isWifiConnected ? "text-emerald-400 text-xs font-mono bg-emerald-400/10 px-2 py-1 rounded" : "text-red-400 text-xs font-mono bg-red-400/10 px-2 py-1 rounded"}>
                   {scanResult.isWifiConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <p className="text-cyber-textMuted text-xs mb-1">
                SSID: {scanResult.ssid || 'Unknown'}
              </p>
              <p className="text-cyber-textMuted text-xs mb-1">
                IP: {scanResult.ipAddress || 'Unknown'}
              </p>
              <p className="text-cyber-textMuted text-xs">
                Devices on subnet: {scanResult.deviceCount || 0}
              </p>
            </div>

            <Button 
              onClick={handleScan}
              variant="outline"
              className="w-full mt-4 border-cyber-neon/30 text-cyber-neon hover:bg-cyber-neon/10"
            >
              Scan Again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
