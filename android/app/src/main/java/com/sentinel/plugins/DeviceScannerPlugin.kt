package com.sentinel.plugins

import android.app.KeyguardManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.os.Build
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File

@CapacitorPlugin(name = "SentinelDeviceScanner")
class DeviceScannerPlugin : Plugin() {

    @PluginMethod
    fun getDeviceSignals(call: PluginCall) {
        val sessionId = call.getString("sessionId") ?: "unknown"
        android.util.Log.d("SentinelDeviceScanner", "START id=$sessionId")
        try {
            val context: Context = this.context
            
            // OS Version & Security Patch
            val release = Build.VERSION.RELEASE
            val sdkInt = Build.VERSION.SDK_INT
            val securityPatch = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Build.VERSION.SECURITY_PATCH
            } else {
                "UNKNOWN"
            }

            // Screen Lock
            val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            val isDeviceSecure = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                keyguardManager.isDeviceSecure
            } else {
                keyguardManager.isKeyguardSecure
            }

            // Developer Mode
            val devModeStatus = Settings.Global.getInt(
                context.contentResolver, 
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 
                0
            ) == 1

            // Unknown Sources
            val unknownSourcesEnabled = try {
                @Suppress("DEPRECATION")
                Settings.Secure.getInt(
                    context.contentResolver,
                    Settings.Secure.INSTALL_NON_MARKET_APPS,
                    0
                ) == 1
            } catch (e: Exception) {
                false
            }

            // Storage Encryption
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val encryptionStatus = devicePolicyManager.storageEncryptionStatus
            val isEncrypted = encryptionStatus == DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE || 
                              encryptionStatus == DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_DEFAULT_KEY ||
                              encryptionStatus == DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_PER_USER

            // Basic Root Heuristics
            val isTestKeys = Build.TAGS?.contains("test-keys") == true
            val hasSu = checkSuExists()
            val isRooted = isTestKeys || hasSu

            val ret = JSObject()
            ret.put("osVersion", release)
            ret.put("sdkInt", sdkInt)
            ret.put("securityPatch", securityPatch)
            ret.put("isDeviceSecure", isDeviceSecure)
            ret.put("isDeveloperModeEnabled", devModeStatus)
            ret.put("unknownSourcesEnabled", unknownSourcesEnabled)
            ret.put("isRooted", isRooted)
            ret.put("isEncrypted", isEncrypted)

            android.util.Log.d("SentinelDeviceScanner", "SUCCESS id=$sessionId")
            call.resolve(ret)
        } catch (e: Exception) {
            val sessionId = call.getString("sessionId") ?: "unknown"
            android.util.Log.d("SentinelDeviceScanner", "CANNOT_BE_SCANNED reason=" + e.message + " id=" + sessionId)
            call.reject("Failed to gather device signals", e)
        }
    }

    private fun checkSuExists(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }
}
