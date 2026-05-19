package com.transen.app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.content.Intent

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.transen.app/navigation"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "startNavigation") {
                val originLat = call.argument<Double>("originLat")
                val originLng = call.argument<Double>("originLng")
                val destLat = call.argument<Double>("destLat")
                val destLng = call.argument<Double>("destLng")
                
                if (originLat != null && originLng != null && destLat != null && destLng != null) {
                    startNavigationActivity(originLat, originLng, destLat, destLng)
                    result.success(true)
                } else {
                    result.error("INVALID_ARGUMENTS", "Missing coordinates", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun startNavigationActivity(originLat: Double, originLng: Double, destLat: Double, destLng: Double) {
        val intent = Intent(this, NavigationActivity::class.java).apply {
            putExtra("originLat", originLat)
            putExtra("originLng", originLng)
            putExtra("destLat", destLat)
            putExtra("destLng", destLng)
        }
        startActivity(intent)
    }
}
