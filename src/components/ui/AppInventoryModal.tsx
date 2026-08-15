import React, { useState, useMemo } from 'react';
import { X, Search, AppWindow, ShieldAlert, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { InstalledAppInfo, SecurityFinding, PermissionFinding } from '@/types';

interface AppInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledAppInfo[];
  permissions: { [packageName: string]: PermissionFinding[] };
  findings: SecurityFinding[];
}

export function AppInventoryModal({ isOpen, onClose, apps, permissions, findings }: AppInventoryModalProps) {
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

                        {/* Details & Permissions */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2">App Details</h4>
                            <ul className="space-y-1 text-slate-600">
                              <li><span className="font-medium">Package:</span> <span className="font-mono text-xs">{app.packageName}</span></li>
                              <li><span className="font-medium">Target SDK:</span> {app.targetSdkVersion || 'N/A'}</li>
                              <li><span className="font-medium">Enabled:</span> {app.isEnabled ? 'Yes' : 'No'}</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              <Lock size={16} />
                              Permissions ({appPerms.length})
                            </h4>
                            {appPerms.length > 0 ? (
                              <div className="h-32 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
                                <ul className="space-y-1">
                                  {appPerms.map((perm, idx) => (
                                    <li key={idx} className="text-xs text-slate-600 break-words flex items-start gap-1">
                                      <span className={perm.isGranted ? 'text-emerald-500' : 'text-slate-400'}>
                                        {perm.isGranted ? '✓' : '✗'}
                                      </span>
                                      {perm.permission.replace('android.permission.', '').replace('macOS.permission.', '')}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-slate-500 italic">No permissions requested.</p>
                            )}
                          </div>
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
