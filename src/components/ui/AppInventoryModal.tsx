import React, { useState, useMemo } from 'react';
import { X, Search, AppWindow, ShieldAlert, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { InstalledAppInfo, SecurityFinding, PermissionFinding, AppRiskFinding, ScanFinding } from '@/types';
import { openNativeAppSettings } from '@/platform/capacitor/AppScannerBridge';

interface AppInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledAppInfo[];
  permissions: { [packageName: string]: PermissionFinding[] };
  findings: (SecurityFinding | ScanFinding)[];
  appRiskFindings?: AppRiskFinding[];
}

export function AppInventoryModal({ isOpen, onClose, apps, permissions, findings, appRiskFindings = [] }: AppInventoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const filteredApps = useMemo(() => {
    return apps.filter(app => 
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.appName.localeCompare(b.appName));
  }, [apps, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <AppWindow size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">App Inventory</h2>
              <p className="text-sm text-slate-500">Scanned {apps.length} applications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search apps by name or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* App List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-3 custom-scrollbar">
          {filteredApps.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No applications found matching your search.
            </div>
          ) : (
            filteredApps.map((app) => {
              const appFindings = findings.filter(f => 
                (f.title && app.appName && f.title.includes(app.appName)) || 
                (f.description && app.packageName && f.description.includes(app.packageName))
              );
              let appPerms = permissions[app.packageName] || [];
              if (appPerms.length === 0 && app.requestedPermissions?.length > 0) {
                 const grantPerms = (app as any).grantedPermissions || [];
                 appPerms = app.requestedPermissions.map((p: string) => ({
                    permission: p,
                    isGranted: grantPerms.includes(p),
                    description: `Permission: ${p}`
                 }));
              }
              const riskFinding = appRiskFindings.find(f => f.packageName === app.packageName);
              const isExpanded = expandedApp === app.packageName;

              return (
                <Card 
                  key={app.packageName} 
                  className={`overflow-hidden transition-all duration-200 border ${appFindings.length > 0 ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200 hover:border-blue-200'}`}
                >
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedApp(isExpanded ? null : app.packageName)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${appFindings.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        <AppWindow size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{app.appName}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono">{app.versionName}</span>
                          <span>•</span>
                          <span className={app.isSystemApp ? 'text-blue-600 font-medium' : ''}>
                            {app.isSystemApp ? 'System App' : 'User App'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {appFindings.length > 0 && (
                        <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                          <ShieldAlert size={14} />
                          {appFindings.length} Risk{appFindings.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white/50 text-sm">
                      
                      {/* App Security Profile */}
                      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-800 text-base">App Security Profile</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</span>
                            <span className={`text-lg font-black ${appFindings.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {riskFinding ? riskFinding.riskScore : (appFindings.length > 0 ? Math.max(0, 100 - (appFindings.length * 20)) : 100)}/100
                            </span>
                          </div>
                        </div>

                        {/* Detailed Permissions Analysis */}
                        {riskFinding && riskFinding.permissions && riskFinding.permissions.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-slate-700">Permission Analysis</h5>
                            <div className="grid gap-2">
                              {riskFinding.permissions.map((p, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-800 flex items-center gap-2">
                                      {p.permission}
                                      {p.status === 'not_granted' && (
                                        <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">Not Granted</span>
                                      )}
                                    </span>
                                    {p.classification === 'expected' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">✓ Expected</span>}
                                    {p.classification === 'contextual' && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Review</span>}
                                    {p.classification === 'unexpected' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">🔴 Unexpected</span>}
                                  </div>
                                  <p className="text-xs text-slate-500">{p.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 italic">No sensitive permissions requested.</div>
                        )}
                      </div>

                      <div className="grid gap-4">
                        {/* Risks Section */}
                        {appFindings.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                              <ShieldAlert size={16} />
                              Identified Risks
                            </h4>
                            <ul className="space-y-2">
                              {appFindings.map((finding, idx) => (
                                <li key={idx} className="bg-amber-50 p-2 rounded border border-amber-100 text-amber-900">
                                  <strong>{finding.title}:</strong> {finding.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Details */}
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2 flex items-center justify-between">
                            App Details
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openNativeAppSettings(app.packageName).catch(console.error);
                              }}
                              className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
                            >
                              Manage in Settings
                            </button>
                          </h4>
                          <ul className="space-y-1 text-slate-600 mt-3">
                            <li><span className="font-medium">Package:</span> <span className="font-mono text-xs">{app.packageName}</span></li>
                            <li><span className="font-medium">Category:</span> <span className="capitalize">{riskFinding ? riskFinding.category : 'General'}</span></li>
                            <li><span className="font-medium">Target SDK:</span> {app.targetSdkVersion || 'N/A'}</li>
                            <li><span className="font-medium">Enabled:</span> {app.isEnabled ? 'Yes' : 'No'}</li>
                          </ul>
                        </div>


                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
