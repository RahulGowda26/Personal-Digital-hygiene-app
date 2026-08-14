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

            for (pkg in allPackages) {
                val appInfo = pkg.applicationInfo ?: continue

                // Skip system apps
                val isSystemApp = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                if (isSystemApp) continue

                val appObj = JSObject()
                appObj.put("packageName", pkg.packageName)
                appObj.put("appName", appInfo.loadLabel(pm).toString())
                appObj.put("versionName", pkg.versionName ?: "unknown")
                appObj.put("versionCode", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pkg.longVersionCode else pkg.versionCode.toLong())
                appObj.put("targetSdkVersion", appInfo.targetSdkVersion)
                appObj.put("installSource", getInstallSource(pm, pkg.packageName))
                appObj.put("isSystemApp", false)

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
            result.put("apps", appsArray)
            result.put("totalPackagesReported", totalCount)
            result.put("visibilityRestricted", visibilityRestricted)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to read installed packages", e)
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
