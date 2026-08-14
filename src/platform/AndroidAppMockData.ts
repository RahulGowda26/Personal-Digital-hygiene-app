import { AppMetadata } from '@/types';

export const mockInstalledApps: AppMetadata[] = [
  {
    packageName: 'com.example.system.maps',
    appName: 'MapService',
    versionName: '11.100.0100',
    versionCode: 1,
    targetSdkVersion: 33,
    installSource: 'com.android.vending', // Play Store
    requestedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET',
      'android.permission.CAMERA'
    ],
    grantedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.INTERNET'],
    isSystemApp: true,
  },
  {
    packageName: 'com.example.casualgame',
    appName: 'Bubble Pop',
    versionName: '1.0.2',
    versionCode: 2,
    targetSdkVersion: 22, // Very old SDK
    installSource: 'com.android.vending',
    requestedPermissions: [
      'android.permission.INTERNET',
      'android.permission.READ_EXTERNAL_STORAGE'
    ],
    grantedPermissions: ['android.permission.INTERNET'],
    isSystemApp: false,
  },
  {
    packageName: 'com.example.utility.tools',
    appName: 'Device Optimizer Pro',
    versionName: '2.1.0',
    versionCode: 3,
    targetSdkVersion: 30,
    installSource: 'unknown', // Sideloaded
    requestedPermissions: [
      'android.permission.CAMERA',
      'android.permission.INTERNET',
      'android.permission.SYSTEM_ALERT_WINDOW', // Overlay permission
      'android.permission.BIND_ACCESSIBILITY_SERVICE', // Accessibility
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS'
    ],
    grantedPermissions: ['android.permission.INTERNET', 'android.permission.SYSTEM_ALERT_WINDOW'],
    isSystemApp: false,
  },
  {
    packageName: 'com.example.flashlight',
    appName: 'Super Flashlight 2024',
    versionName: '4.0.0',
    versionCode: 4,
    targetSdkVersion: 28, // Older SDK
    installSource: 'com.amazon.venezia', // Different app store
    requestedPermissions: [
      'android.permission.CAMERA',
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION', // Why does a flashlight need location?
      'android.permission.READ_CONTACTS' // High risk for flashlight
    ],
    grantedPermissions: ['android.permission.CAMERA'],
    isSystemApp: false,
  }
];
