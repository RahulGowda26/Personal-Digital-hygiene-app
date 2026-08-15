package com.sentinel.plugins

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * SentinelAppScanner — Capacitor plugin that reads installed Android packages
 * via the system PackageManager.
 *
 * PRIVACY: This plugin returns data to the JavaScript layer on the SAME DEVICE.
 * It does NOT transmit any data to a remote server. The JavaScript layer
 * (appRiskAnalyzer.ts) performs analysis locally and only sends normalized
 * findings (severity + evidence) to the backend — never the raw app list.
 *
 * PACKAGE VISIBILITY (Android 11+):
 * Starting with API 30, Android restricts which packages an app can see.
 * Without <queries> declarations in AndroidManifest.xml, the app can only
 * see its own package + packages that interact with it. We report both
 * the total package count and whether visibility was restricted so the
 * frontend can display accurate coverage percentages.
 *
 * Required permission: none (reading installed packages is allowed,
 * but visibility may be limited on Android 11+).
 */
@CapacitorPlugin(name = "SentinelAppScanner")
class AppScannerPlugin : Plugin() {

    @PluginMethod
    fun getInstalledPackages(call: PluginCall) {
        val sessionId = call.getString("sessionId") ?: "unknown"
        android.util.Log.d("SentinelAppScanner", "START id=$sessionId")
        try {
            val context: Context = this.context
            val pm = context.packageManager

            val flags = PackageManager.GET_PERMISSIONS
            val allPackages: List<PackageInfo> = pm.getInstalledPackages(flags)
            val totalCount = allPackages.size

            // Detect whether package visibility is likely restricted (Android 11+)
            // Heuristic: if we see very few packages (<10 non-system), visibility
            // is probably restricted. On a real device with QUERY_ALL_PACKAGES or
            // appropriate <queries>, we'd see many more.
            val visibilityRestricted = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
                allPackages.count { pkg ->
                    val appInfo = pkg.applicationInfo
                    appInfo != null && (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0
                } < 5

            val appsArray = JSArray()
            
            var userAppsCount = 0
            var systemAppsCount = 0
            var vendorAppsCount = 0
            var skippedAppsCount = 0
            val skipReasons = JSArray()

            for (pkg in allPackages) {
                val appInfo = pkg.applicationInfo
                if (appInfo == null) {
                    skippedAppsCount++
                    skipReasons.put("Package ${pkg.packageName} has no applicationInfo")
                    continue
                }

                val isSystemFlag = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                val pName = pkg.packageName ?: ""
                
                // Categorize
                val isVendor = isSystemFlag && (pName.startsWith("com.samsung") || 
                    pName.startsWith("com.vivo") || pName.startsWith("com.oppo") || 
                    pName.startsWith("com.miui") || pName.startsWith("com.sec") || 
                    pName.startsWith("com.coloros") || pName.startsWith("com.heytap") ||
                    pName.startsWith("com.oneplus") || pName.startsWith("com.huawei"))
                    
                val isSystemApp = isSystemFlag && !isVendor

                if (isVendor) {
                    vendorAppsCount++
                } else if (isSystemApp) {
                    systemAppsCount++
                } else {
                    userAppsCount++
                }

                val appObj = JSObject()
                appObj.put("packageName", pkg.packageName)
                appObj.put("appName", appInfo.loadLabel(pm).toString())
                appObj.put("versionName", pkg.versionName ?: "unknown")
                appObj.put("versionCode", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pkg.longVersionCode else pkg.versionCode.toLong())
                appObj.put("targetSdkVersion", appInfo.targetSdkVersion)
                appObj.put("installSource", getInstallSource(pm, pkg.packageName))
                appObj.put("isSystemApp", isSystemApp)
                appObj.put("isVendorApp", isVendor)
                appObj.put("isUserApp", !isSystemFlag)

                // Requested permissions and Granted permissions
                val requestedPermsArray = JSArray()
                val grantedPermsArray = JSArray()
                val perms = pkg.requestedPermissions
                val permFlags = pkg.requestedPermissionsFlags
                if (perms != null) {
                    for (i in perms.indices) {
                        val perm = perms[i]
                        requestedPermsArray.put(perm)
                        if (permFlags != null && i < permFlags.size) {
                            if ((permFlags[i] and PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0) {
                                grantedPermsArray.put(perm)
                            }
                        }
                    }
                }
                appObj.put("requestedPermissions", requestedPermsArray)
                appObj.put("grantedPermissions", grantedPermsArray)

                appsArray.put(appObj)
            }

            val result = JSObject()
            result.put("totalPackagesDetected", totalCount)
            result.put("userInstalledApps", userAppsCount)
            result.put("systemApps", systemAppsCount)
            result.put("vendorApps", vendorAppsCount)
            result.put("analyzedApps", appsArray.length())
            result.put("skippedApps", skippedAppsCount)
            result.put("skipReasons", skipReasons)
            result.put("visibilityRestricted", visibilityRestricted)
            result.put("apps", appsArray)

            android.util.Log.d("SentinelAppScanner", "TOTAL PACKAGES=$totalCount id=$sessionId")
            android.util.Log.d("SentinelAppScanner", "USER APPS=$userAppsCount id=$sessionId")
            android.util.Log.d("SentinelAppScanner", "SYSTEM APPS=${systemAppsCount + vendorAppsCount} id=$sessionId")
            android.util.Log.d("SentinelAppScanner", "RETURNING APPS=${appsArray.length()} id=$sessionId")
            call.resolve(result)

        } catch (e: Exception) {
            val sessionId = call.getString("sessionId") ?: "unknown"
            android.util.Log.d("SentinelAppScanner", "FAILED reason=" + e.message + " id=" + sessionId)
            call.reject("Failed to read installed packages", e)
        }
    }

    @PluginMethod
    fun openAppSettings(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName == null) {
            call.reject("Must provide a packageName")
            return
        }

        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = android.net.Uri.parse("package:$packageName")
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to open app settings", e)
        }
    }

    /**
     * Determine the install source for a package.
     * - API 30+ (Android 11): use getInstallSourceInfo()
     * - API < 30: use getInstallerPackageName()
     */
    private fun getInstallSource(pm: PackageManager, packageName: String): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val info = pm.getInstallSourceInfo(packageName)
                info.installingPackageName ?: info.initiatingPackageName ?: "unknown"
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(packageName) ?: "unknown"
            }
        } catch (e: Exception) {
            "unknown"
        }
    }
}
