package com.sentinel.plugins

import android.Manifest
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import java.net.InetAddress
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.Future

@CapacitorPlugin(
    name = "SentinelNetworkScanner",
    permissions = [
        Permission(strings = [Manifest.permission.ACCESS_NETWORK_STATE], alias = "network"),
        Permission(strings = [Manifest.permission.ACCESS_WIFI_STATE], alias = "wifi"),
        Permission(strings = [Manifest.permission.ACCESS_FINE_LOCATION], alias = "location")
    ]
)
class NetworkScannerPlugin : Plugin() {

    @PluginMethod
    fun getNetworkSignals(call: PluginCall) {
        val sessionId = call.getString("sessionId") ?: "unknown"
        android.util.Log.d("SentinelNetworkScanner", "START id=$sessionId")

        if (getPermissionState("location") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "permissionsCallback")
            return
        } else {
            performNetworkScan(call, sessionId)
        }
    }

    @PluginMethod
    fun permissionsCallback(call: PluginCall) {
        val sessionId = call.getString("sessionId") ?: "unknown"
        performNetworkScan(call, sessionId)
    }

    private fun pingHost(ipAddress: String): Boolean {
        return try {
            val address = InetAddress.getByName(ipAddress)
            if (address.isReachable(500)) return true
            
            val ports = intArrayOf(53, 80, 443)
            for (port in ports) {
                try {
                    val socket = java.net.Socket()
                    socket.connect(java.net.InetSocketAddress(ipAddress, port), 200)
                    socket.close()
                    return true
                } catch (e: Exception) {
                    // Ignored
                }
            }
            false
        } catch (e: Exception) {
            false
        }
    }

    private fun getActiveDeviceCount(ipString: String): Int {
        if (ipString == "0.0.0.0" || ipString.isEmpty()) return 0
        val parts = ipString.split(".")
        if (parts.size != 4) return 0
        val prefix = "${parts[0]}.${parts[1]}.${parts[2]}."
        
        val executor = Executors.newFixedThreadPool(50)
        val futures = mutableListOf<Future<Boolean>>()
        
        for (i in 1..254) {
            val testIp = prefix + i
            futures.add(executor.submit(Callable {
                pingHost(testIp)
            }))
        }
        
        var activeCount = 0
        for (future in futures) {
            if (future.get()) activeCount++
        }
        executor.shutdown()
        return activeCount
    }

    private fun performNetworkScan(call: PluginCall, sessionId: String) {
        Thread {
            try {
                val context: Context = this.context
                var isVpnActive = false
                var isProxySet = false
                var isMetered = false
                var isWifiConnected = false
                var isCaptivePortal = false
                var isOpenNetwork = false
                var ssid: String? = null
                var ipAddressStr: String? = null
                var bssid: String? = null
                var deviceCount = 0

                // Check Proxy
                val proxyHost = System.getProperty("http.proxyHost")
                val proxyPort = System.getProperty("http.proxyPort")
                if (!proxyHost.isNullOrEmpty() && !proxyPort.isNullOrEmpty()) {
                    isProxySet = true
                }

                // Check VPN, Metered Status, and Captive Portal
                val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    val activeNetwork = connectivityManager.activeNetwork
                    if (activeNetwork != null) {
                        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
                        if (capabilities != null) {
                            isVpnActive = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
                            isMetered = !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
                            isWifiConnected = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                            
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                isCaptivePortal = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_CAPTIVE_PORTAL)
                            }
                        }
                    }
                } else {
                    @Suppress("DEPRECATION")
                    val activeNetworkInfo = connectivityManager.activeNetworkInfo
                    if (activeNetworkInfo != null) {
                        @Suppress("DEPRECATION")
                        isVpnActive = activeNetworkInfo.type == ConnectivityManager.TYPE_VPN
                        @Suppress("DEPRECATION")
                        isWifiConnected = activeNetworkInfo.type == ConnectivityManager.TYPE_WIFI
                    }
                }

                // Check Wi-Fi Security
                if (isWifiConnected) {
                    val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    val wifiInfo: WifiInfo? = wifiManager.connectionInfo
                    
                    if (wifiInfo != null) {
                        ssid = wifiInfo.ssid?.replace("\"", "")
                        if (ssid == "<unknown ssid>") {
                            ssid = null
                        }
                        
                        bssid = wifiInfo.bssid
                        
                        val ipRaw = wifiInfo.ipAddress
                        ipAddressStr = String.format(
                            "%d.%d.%d.%d",
                            (ipRaw and 0xff),
                            (ipRaw shr 8 and 0xff),
                            (ipRaw shr 16 and 0xff),
                            (ipRaw shr 24 and 0xff)
                        )
                        
                        try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                val currentSecurityType = wifiInfo.currentSecurityType
                                isOpenNetwork = (currentSecurityType == WifiInfo.SECURITY_TYPE_OPEN || currentSecurityType == WifiInfo.SECURITY_TYPE_WEP)
                            } else {
                                @Suppress("DEPRECATION")
                                val configuredNetworks = wifiManager.configuredNetworks
                                if (configuredNetworks != null) {
                                    for (config in configuredNetworks) {
                                        if (config.networkId == wifiInfo.networkId) {
                                            @Suppress("DEPRECATION")
                                            val allowedKeyManagement = config.allowedKeyManagement
                                            if (allowedKeyManagement.get(android.net.wifi.WifiConfiguration.KeyMgmt.NONE)) {
                                                isOpenNetwork = true
                                            }
                                            break
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("SentinelNetworkScanner", "Failed to get wifi security info", e)
                        }

                        // Perform Ping Sweep
                        if (ipAddressStr != "0.0.0.0") {
                            deviceCount = getActiveDeviceCount(ipAddressStr)
                        }
                    }
                }

                val ret = JSObject()
                ret.put("isVpnActive", isVpnActive)
                ret.put("isProxySet", isProxySet)
                ret.put("isMetered", isMetered)
                ret.put("proxyHost", proxyHost ?: "")
                ret.put("isWifiConnected", isWifiConnected)
                ret.put("isCaptivePortal", isCaptivePortal)
                ret.put("isOpenNetwork", isOpenNetwork)
                ret.put("deviceCount", deviceCount)
                
                if (ssid != null) ret.put("ssid", ssid)
                if (ipAddressStr != null) ret.put("ipAddress", ipAddressStr)
                if (bssid != null) ret.put("bssid", bssid)
                
                android.util.Log.d("SentinelNetworkScanner", "SUCCESS id=$sessionId")
                call.resolve(ret)
                
            } catch (e: Exception) {
                android.util.Log.e("SentinelNetworkScanner", "ERROR", e)
                call.reject("Failed to gather network signals", e)
            }
        }.start()
    }
}
