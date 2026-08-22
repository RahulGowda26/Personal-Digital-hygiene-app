import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Crosshair, Skull, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface Threat {
  id: string;
  source: string;
  message: string;
  severity: 'high' | 'critical' | 'medium';
  timeAgo: string;
  link: string;
}

export function ThreatFeedWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews');
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          const parsedThreats = data.items.map((item: any, index: number) => {
            const pubDate = new Date(item.pubDate);
            const now = new Date();
            const diffMs = now.getTime() - pubDate.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const timeAgo = diffHrs > 0 ? `${diffHrs}h ago` : 'Just now';
            
            return {
              id: `thn-${index}`,
              source: 'The Hacker News',
              message: item.title,
              // Randomly assign severity for UI flair, real severity would need NLP
              severity: index % 3 === 0 ? 'critical' : (index % 2 === 0 ? 'high' : 'medium'),
              timeAgo,
              link: item.link
            };
          });
          setThreats(parsedThreats.slice(0, 10)); // keep top 10
        }
      } catch (e) {
        console.error('Failed to fetch threat feed', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  useEffect(() => {
    if (threats.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % threats.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [threats]);

  const openLink = async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  };

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

  if (loading || threats.length === 0) return null;

  const currentThreat = threats[currentIndex];

  return (
    <div className="w-full max-w-md mt-6 px-4 z-10">
      <h3 className="text-cyber-neon font-mono text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <Activity size={12} className="animate-pulse" />
        Global Threat Intel
      </h3>
      
      <div 
        onClick={() => openLink(currentThreat.link)}
        className="bg-cyber-surface/60 border border-cyber-neon/20 rounded-xl p-3 shadow-[0_0_15px_rgba(255,42,66,0.05)] relative overflow-hidden cursor-pointer group"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 group-hover:opacity-40 transition-opacity" />
        
        <div 
          key={currentThreat.id}
          className="relative z-10 flex items-start gap-3 animate-fade-in-up"
        >
          <div className={`p-1.5 rounded-lg border shrink-0 ${getSeverityColor(currentThreat.severity)}`}>
            {getIcon(currentThreat.severity)}
          </div>
          
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-white font-bold text-xs uppercase tracking-wider">{currentThreat.source}</span>
              <span className="text-cyber-textMuted font-mono text-[9px]">{currentThreat.timeAgo}</span>
            </div>
            <p className="text-cyber-textMuted text-xs line-clamp-2">
              {currentThreat.message}
            </p>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-cyber-neon">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
