import Flutter
import UIKit
import GoogleMaps

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Initialisation de Google Maps avec votre clé API
    GMSServices.provideAPIKey("AIzaSyBw0PKiF8FdoPE26gIP2s1e7XJCozN6rLE")
    
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let navigationChannel = FlutterMethodChannel(name: "com.transen.app/navigation",
                                              binaryMessenger: controller.binaryMessenger)
    navigationChannel.setMethodCallHandler({
      (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      if call.method == "startNavigation" {
          let args = call.arguments as? [String: Any]
          let originLat = args?["originLat"] as? Double
          let originLng = args?["originLng"] as? Double
          let destLat = args?["destLat"] as? Double
          let destLng = args?["destLng"] as? Double
          
          if let oLat = originLat, let oLng = originLng, let dLat = destLat, let dLng = destLng {
              self.startNavigation(originLat: oLat, originLng: oLng, destLat: dLat, destLng: dLng)
              result(true)
          } else {
              result(FlutterError(code: "INVALID_ARGUMENTS", message: "Missing coordinates", details: nil))
          }
      } else {
          result(FlutterMethodNotImplemented)
      }
    })

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func startNavigation(originLat: Double, originLng: Double, destLat: Double, destLng: Double) {
      // TODO: Implémenter le lancement de Mapbox Navigation sur iOS
      print("Navigation demandée vers \(destLat), \(destLng)")
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
