const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNetworkSignals: () => ipcRenderer.invoke('getNetworkSignals'),
  scanApps: () => ipcRenderer.invoke('scanApps')
});
