import React, { useEffect, useState } from 'react';
import { AndroidSecurityAdapter } from '@/platform/AndroidSecurityAdapter';
import { Activity, ShieldCheck, FileSearch, ArrowLeft, Loader2 } from 'lucide-react';
import type { AppScanResult } from '@/types';

export function DiagnosticsScreen({ onBack }: { onBack?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppScanResult | null>(null);
  const [sessionId, setSessionId] = useState<string>('-');
  const [execTime, setExecTime] = useState<number | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setAppData(null);
    const start = performance.now();
    const id = Math.random().toString(16).slice(2, 10);
    setSessionId(id);

    try {
      const adapter = new AndroidSecurityAdapter();
      const apps = await adapter.getInstalledApps(id);
      
      setAppData(apps);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Diagnostic scan failed');
    } finally {
      setExecTime(Math.round(performance.now() - start));
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-cyber-surface text-cyber-textMuted hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-3xl font-outline text-outline-glow tracking-widest uppercase">System Diagnostics</h1>
      </div>
      
      <div className="space-y-6">
        <div className="cyber-card p-6 flex flex-col items-center text-center">
          <Activity className="w-12 h-12 text-cyber-neon mb-4 shadow-[0_0_15px_rgba(255,42,66,0.3)] rounded-full" />
          <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-white mb-2">Native Telemetry</h2>
          <p className="text-xs font-sans text-cyber-textMuted mb-6 max-w-md">
            Execute a direct request to the native hardware abstraction layer to verify application classification and visibility restrictions.
          </p>
          <button 
            onClick={runDiagnostics} 
            disabled={loading} 
            className="w-full sm:w-auto px-8 py-3 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon font-sans font-semibold rounded-lg hover:bg-cyber-neon hover:text-white transition-colors shadow-[0_0_15px_rgba(255,42,66,0.2)] hover:shadow-[0_0_20px_rgba(255,42,66,0.4)] disabled:opacity-50 flex items-center justify-center min-w-[200px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute Diagnostic Protocol'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-sans">
            [ERR] {error}
          </div>
        )}

        {appData && (
          <div className="space-y-6">
            <div className="cyber-card p-6">
              <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2 border-b border-cyber-neon/20 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Execution Trace
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-[10px] text-cyber-textMuted uppercase tracking-widest block mb-1">Session ID</span>
                  <span className="font-mono text-white text-base">{sessionId}</span>
                </div>
                <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-[10px] text-cyber-textMuted uppercase tracking-widest block mb-1">Exec Latency</span>
                  <span className="font-mono text-white text-base">{execTime} ms</span>
                </div>
                <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-[10px] text-cyber-textMuted uppercase tracking-widest block mb-1">Source Interface</span>
                  <span className="font-semibold text-white">{appData.source}</span>
                </div>
                <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-[10px] text-cyber-textMuted uppercase tracking-widest block mb-1">OS Restriction</span>
                  <span className="font-semibold text-white">{appData.visibility}</span>
                </div>
              </div>
            </div>

            <div className="cyber-card p-6">
              <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2 border-b border-cyber-neon/20 pb-2">
                <FileSearch className="w-5 h-5 text-blue-500" />
                Package Classification
              </h3>
              <div className="space-y-3 text-sm font-sans">
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">Total Packages Detected</span>
                  <span className="font-semibold text-white">{appData.totalPackagesDetected ?? '-'}</span>
                </div>
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">User Installed Apps</span>
                  <span className="font-semibold text-blue-400">{appData.userInstalledApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">System Packages</span>
                  <span className="font-semibold text-white">{appData.systemApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">Vendor/OEM Packages</span>
                  <span className="font-semibold text-white">{appData.vendorApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">Apps Transferred to JS</span>
                  <span className="font-semibold text-emerald-400">{appData.apps.length}</span>
                </div>
                <div className="flex justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-neon/10">
                  <span className="text-cyber-textMuted">Skipped (No AppInfo)</span>
                  <span className="font-semibold text-amber-500">{appData.skippedApps ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
