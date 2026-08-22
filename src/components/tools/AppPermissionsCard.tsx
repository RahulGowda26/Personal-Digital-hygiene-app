import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, AppWindow, MapPin, Mic, Camera, AlertCircle } from 'lucide-react';

interface AppPermission {
  id: string;
  name: string;
  risks: string[];
}

export function AppPermissionsCard() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [riskyApps, setRiskyApps] = useState<AppPermission[]>([]);

  const handleAudit = async () => {
    setIsScanning(true);
    setHasScanned(false);
    
    try {
      const { SecurityScanner } = await import('@/engine/SecurityScanner');
      const scanner = new SecurityScanner();
      const result = await scanner.getInstalledAppsAndPermissions('audit-session');
      
      if (result.status === 'success' && result.apps.length > 0) {
        const risky: AppPermission[] = [];
        
        result.apps.forEach((app, index) => {
          if (app.isSystemApp) return;
          
          const granted = app.grantedPermissions || [];
          const risksFound: string[] = [];
          
          if (granted.some(p => p.includes('ACCESS_FINE_LOCATION') || p.includes('ACCESS_BACKGROUND_LOCATION'))) {
            risksFound.push('Location');
          }
          if (granted.some(p => p.includes('RECORD_AUDIO'))) {
            risksFound.push('Microphone');
          }
          if (granted.some(p => p.includes('CAMERA'))) {
            risksFound.push('Camera');
          }
          if (granted.some(p => p.includes('READ_CONTACTS'))) {
            risksFound.push('Contacts');
          }

          if (risksFound.length > 0) {
            risky.push({
              id: app.packageName || String(index),
              name: app.appName || app.packageName,
              risks: risksFound
            });
          }
        });
        
        setRiskyApps(risky);
      } else {
        // Fallback or empty state if scan failed
        setRiskyApps([]);
      }
    } catch (e) {
      console.error('Audit failed:', e);
      setRiskyApps([]);
    } finally {
      setIsScanning(false);
      setHasScanned(true);
    }
  };

  const getIcon = (risk: string) => {
    if (risk.includes('Location')) return <MapPin size={14} className="text-amber-400" />;
    if (risk.includes('Microphone')) return <Mic size={14} className="text-amber-400" />;
    if (risk.includes('Camera')) return <Camera size={14} className="text-amber-400" />;
    return <AlertCircle size={14} className="text-amber-400" />;
  };

  return (
    <Card className="bg-cyber-bg border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
            <AppWindow size={20} />
          </div>
          <div>
            <h3 className="text-white font-sans font-bold text-lg">Permission Auditor</h3>
            <p className="text-cyber-textMuted font-mono text-[10px] uppercase">Excessive Access Check</p>
          </div>
        </div>

        {!hasScanned && !isScanning && (
          <div className="mt-6 flex flex-col items-center justify-center py-4">
            <p className="text-cyber-textMuted text-sm text-center mb-4">
              Scan installed applications for excessive or risky permissions that could compromise privacy.
            </p>
            <Button 
              onClick={handleAudit}
              className="bg-cyber-neon hover:bg-cyber-neon/80 text-white shadow-[0_0_15px_rgba(255,42,66,0.4)] w-full"
            >
              Run Full Audit
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="mt-6 py-8 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-cyber-surface border-t-cyber-neon rounded-full animate-spin mb-4" />
            <p className="text-white font-mono text-sm tracking-widest uppercase animate-pulse">Auditing Apps...</p>
          </div>
        )}

        {hasScanned && (
          <div className="mt-6 border-t border-cyber-neon/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={20} />
                <span className="font-bold text-sm">{riskyApps.length} Apps Flagged</span>
              </div>
              <Button 
                onClick={handleAudit}
                variant="outline"
                className="border-cyber-neon/30 text-cyber-neon hover:bg-cyber-neon/10 py-1 h-8 text-xs"
              >
                Re-scan
              </Button>
            </div>
            
            <div className="space-y-3">
              {riskyApps.map((app) => (
                <div key={app.id} className="bg-cyber-surface p-3 rounded-lg border border-cyber-neon/10">
                  <div className="text-white font-bold text-sm mb-2">{app.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {app.risks.map((risk, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-1 rounded text-xs font-mono">
                        {getIcon(risk)}
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
