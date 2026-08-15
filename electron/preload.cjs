const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNetworkSignals: () => ipcRenderer.invoke('getNetworkSignals'),
  scanApps: () => ipcRenderer.invoke('scanApps'),
  scanPorts: (host) => ipcRenderer.invoke('scanPorts', host)
});
