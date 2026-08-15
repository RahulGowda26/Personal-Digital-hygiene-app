package com.sentinel.security;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.sentinel.plugins.AppScannerPlugin;
import com.sentinel.plugins.DeviceScannerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppScannerPlugin.class);
        registerPlugin(DeviceScannerPlugin.class);
        registerPlugin(com.sentinel.plugins.NetworkScannerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
