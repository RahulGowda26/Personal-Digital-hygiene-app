import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Crosshair, Skull } from 'lucide-react';

interface Threat {
  id: string;
  source: string;
  message: string;
  severity: 'high' | 'critical' | 'medium';
  timeAgo: string;
}

const mockThreats: Threat[] = [
  { id: '1', source: 'CISA', message: 'Active exploitation of iOS 17.4 WebKit zero-day', severity: 'critical', timeAgo: '2m ago' },
  { id: '2', source: 'Sentinel', message: 'New phishing campaign targeting crypto wallets', severity: 'high', timeAgo: '15m ago' },
  { id: '3', source: 'HIBP', message: 'Massive credential dump found on dark web forums', severity: 'high', timeAgo: '1h ago' },
  { id: '4', source: 'NVD', message: 'Critical vulnerability in popular home routers', severity: 'medium', timeAgo: '3h ago' }
];

export function ThreatFeedWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockThreats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentThreat = mockThreats[currentIndex];

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (severity === 'high') return 'text-cyber-neon bg-cyber-neon/10 border-cyber-neon/30';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  };

  const getIcon = (severity: string) => {
    if (severity === 'critical') return <Skull size={14} className="text-red-500" />;
    if (severity === 'high') return <Crosshair size={14} className="text-cyber-neon" />;
    return <ShieldAlert size={14} className="text-amber-500" />;
  };

  return (
    <div className="w-full max-w-md mt-6 px-4 z-10">
      <h3 className="text-cyber-neon font-mono text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <Activity size={12} className="animate-pulse" />
        Global Threat Intel
      </h3>
      
      <div className="bg-cyber-surface/60 border border-cyber-neon/20 rounded-xl p-3 shadow-[0_0_15px_rgba(255,42,66,0.05)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20" />
        
        <div 
          key={currentThreat.id}
          className="relative z-10 flex items-start gap-3 animate-fade-in-up"
        >
          <div className={`p-1.5 rounded-lg border shrink-0 ${getSeverityColor(currentThreat.severity)}`}>
            {getIcon(currentThreat.severity)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-white font-bold text-xs uppercase tracking-wider">{currentThreat.source}</span>
              <span className="text-cyber-textMuted font-mono text-[9px]">{currentThreat.timeAgo}</span>
            </div>
            <p className="text-cyber-textMuted text-xs truncate">
              {currentThreat.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
