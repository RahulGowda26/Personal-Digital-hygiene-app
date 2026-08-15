const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup IPC handlers
ipcMain.handle('scanPorts', async (event, host) => {
  const { scanPorts } = require('./portScanner.cjs');
  try {
    return await scanPorts(host || '127.0.0.1');
  } catch (error) {
    console.error('Error scanning ports:', error);
    return [];
  }
});

ipcMain.handle('getNetworkSignals', async () => {
  let ssid = null;
  let ipAddress = null;
  let deviceCount = undefined;
  let connectedDevices = [];

  try {
    if (process.platform === 'darwin') {
      // Get SSID
      try {
        const ssidOutput = execSync('networksetup -getairportnetwork en0').toString();
        if (ssidOutput.includes('Current Wi-Fi Network:')) {
          ssid = ssidOutput.split('Current Wi-Fi Network:')[1].trim();
        }
      } catch (e) {
        console.error('Failed to get SSID', e);
      }

      // Get IP Address
      try {
        ipAddress = execSync('ipconfig getifaddr en0').toString().trim();
      } catch (e) {
        console.error('Failed to get IP', e);
      }

      // Get Device IPs via ARP
      try {
        const arpOutput = execSync('arp -a').toString();
        const lines = arpOutput.split('\n');
        for (const line of lines) {
          if (line.includes('ether') && !line.includes('ff:ff:ff:ff:ff:ff') && !line.includes('1:0:5e:') && !line.includes('33:33:') && !line.includes('(incomplete)')) {
            // Extract IP address from format: ? (10.19.59.94) at ...
            const ipMatch = line.match(/\((.*?)\)/);
            if (ipMatch && ipMatch[1]) {
              connectedDevices.push(ipMatch[1]);
            }
          }
        }
        deviceCount = connectedDevices.length > 0 ? connectedDevices.length : undefined;
      } catch (e) {
        console.error('Failed to get ARP list', e);
      }
    }
  } catch (error) {
    console.error('Error in getNetworkSignals', error);
  }

  return {
    isVpnActive: false, // difficult to reliably determine without root or checking all routes
    isProxySet: false,
    isMetered: false,
    isOpenNetwork: false,
    isCaptivePortal: false,
    ssid,
    ipAddress,
    deviceCount,
    connectedDevices
  };
});

ipcMain.handle('scanApps', async () => {
  const apps = [];
  try {
    if (process.platform === 'darwin') {
      const appDirs = [
        '/Applications', 
        '/Applications/Utilities', 
        '/System/Applications',
        '/System/Applications/Utilities',
        path.join(app.getPath('home'), 'Applications')
      ];
      for (const dir of appDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.endsWith('.app')) {
              const appName = file.replace('.app', '');
              let packageName = appName;
              let versionName = '1.0.0';
              const requestedPermissions = [];
              
              // Try parsing Info.plist
              try {
                const infoPlistPath = path.join(dir, file, 'Contents', 'Info.plist');
                if (fs.existsSync(infoPlistPath)) {
                   const plistContent = fs.readFileSync(infoPlistPath, 'utf8');
                   
                   // Extract bundle id
                   const bundleIdMatch = plistContent.match(/<key>CFBundleIdentifier<\/key>[\s\S]*?<string>(.*?)<\/string>/);
                   if (bundleIdMatch && bundleIdMatch[1]) {
                     packageName = bundleIdMatch[1];
                   }
                   
                   // Extract version
                   const versionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>[\s\S]*?<string>(.*?)<\/string>/);
                   if (versionMatch && versionMatch[1]) {
                     versionName = versionMatch[1];
                   }
                   
                   // Extract permissions (UsageDescriptions)
                   const permRegex = /<key>(NS[A-Za-z]+UsageDescription)<\/key>/g;
                   let permMatch;
                   while ((permMatch = permRegex.exec(plistContent)) !== null) {
                     let prettyName = permMatch[1].replace('NS', '').replace('UsageDescription', '');
                     // E.g., 'Camera', 'Microphone', 'LocationAlwaysAndWhenInUse'
                     requestedPermissions.push(`macOS.permission.${prettyName}`);
                   }
                }
              } catch(e) {}
              
              apps.push({
                packageName,
                appName,
                versionName,
                versionCode: 1,
                isSystemApp: dir.includes('/System/'),
                isVendorApp: false,
                isUserApp: !dir.includes('/System/'),
                isEnabled: true,
                requestedPermissions,
                grantedPermissions: requestedPermissions, // Mock: assume all requested are granted
                targetSdkVersion: 0,
                installSource: dir
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning apps', error);
  }
  return apps;
});
