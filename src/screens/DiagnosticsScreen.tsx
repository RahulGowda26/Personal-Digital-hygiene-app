import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AndroidSecurityAdapter } from '@/platform/AndroidSecurityAdapter';
import { Activity, ShieldCheck, FileSearch, Smartphone } from 'lucide-react';
import type { AppScanResult } from '@/types';
import { Header } from '@/components/layout/Header';

export function DiagnosticsScreen() {
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
    <div className="pb-24">
      <Header title="Scanner Diagnostics" />
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Card className="flex flex-col items-center p-6 text-center">
          <Activity className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Native Telemetry</h2>
          <p className="text-sm text-slate-500 mb-6">
            Execute a direct request to the Android native layer to verify application classification and visibility restrictions.
          </p>
          <Button onClick={runDiagnostics} disabled={loading} className="w-full sm:w-auto px-8">
            {loading ? 'Running Native Scan...' : 'Run Diagnostics'}
          </Button>
        </Card>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {appData && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Scan Execution
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-1">Session ID</span>
                  <span className="font-mono font-medium">{sessionId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-1">Execution Time</span>
                  <span className="font-medium">{execTime} ms</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-1">Data Source</span>
                  <span className="font-medium">{appData.source}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-1">OS Visibility</span>
                  <span className="font-medium">{appData.visibility}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-indigo-500" />
                Package Classification
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Total Packages Detected</span>
                  <span className="font-semibold">{appData.totalPackagesDetected ?? '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">User Installed Apps</span>
                  <span className="font-semibold text-blue-600">{appData.userInstalledApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">System Packages</span>
                  <span className="font-semibold">{appData.systemApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Vendor/OEM Packages</span>
                  <span className="font-semibold">{appData.vendorApps ?? '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Apps Returned to JS</span>
                  <span className="font-semibold text-emerald-600">{appData.apps.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Skipped (No AppInfo)</span>
                  <span className="font-semibold text-amber-500">{appData.skippedApps ?? '-'}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
