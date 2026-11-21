// ignore_for_file: deprecated_member_use

import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:ui' as ui;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:transen_core/transen_core.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:transen_maps/transen_maps.dart';
import 'dart:convert';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_trips/transen_trips.dart' as providers;
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_profile/transen_profile.dart';
import 'package:transen_payment/transen_payment.dart';
import 'package:transen/presentation/widgets/profile_drawer.dart';
import 'package:transen/presentation/widgets/smart_media_hub_card.dart';
import 'package:transen/presentation/widgets/animated_background_waves.dart';
import 'package:transen/presentation/widgets/premium_pulse_card.dart';
import 'package:transen/presentation/widgets/unified_grid_actions_container.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'chat_assistant_screen.dart';

enum TransportMode { interurbain, urbain }

enum HomeJourneyState {
  selectService,
  selectTravelType,
  selectVtcDestination,
  selectInterurbanType,
}

final activeDriversStreamProvider = StreamProvider<List<PointAnnotationOptions>>((ref) {
  return FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
      .collection('active_drivers')
      .snapshots()
      .asyncMap((snapshot) async {
    final annotations = <PointAnnotationOptions>[];
    final iconBytes = await MapMarkerUtils.getCarIconBytes();
    
    for (var doc in snapshot.docs) {
      final data = doc.data();
      if (data['status'] != 'online') continue;
      
      if (data['lastUpdated'] != null) {
        final lastUpdated = (data['lastUpdated'] as Timestamp).toDate();
        if (DateTime.now().difference(lastUpdated).inMinutes > 10) continue;
      }
      
      final lng = (data['lng'] as num?)?.toDouble();
      final lat = (data['lat'] as num?)?.toDouble();
      if (lng == null || lat == null) continue;

      annotations.add(PointAnnotationOptions(
        geometry: Point(coordinates: Position(lng, lat)),
        image: iconBytes,
        iconSize: 1.0,
      ));
    }
    return annotations;
  });
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final CameraOptions _initialPosition = CameraOptions(
    center: Point(coordinates: Position(-17.4677, 14.7167)),
    zoom: 13.0,
  );
  MapboxMap? _mapController;
  PointAnnotationManager? _annotationManager;
  double? _userLng;
  double? _userLat;
  static bool _webRedirectChecked = false;
  HomeJourneyState _journeyState = HomeJourneyState.selectService;
  HomeJourneyState _previousJourneyState = HomeJourneyState.selectService;
  Color _activeMediaGlowColor = const Color(0xFFF39C12); // Default golden glow matching the first promo

  void _setJourneyState(HomeJourneyState newState) {
    if (newState == _journeyState) return;
    setState(() {
      _previousJourneyState = _journeyState;
      _journeyState = newState;
    });
  }

  int _getJourneyStateDepth(HomeJourneyState state) {
    switch (state) {
      case HomeJourneyState.selectService:
        return 0;
      case HomeJourneyState.selectTravelType:
        return 1;
      case HomeJourneyState.selectInterurbanType:
        return 2;
      case HomeJourneyState.selectVtcDestination:
        return 3;
    }
  }

  @override
  void initState() {
    super.initState();
    if (kIsWeb && !_webRedirectChecked) {
      _webRedirectChecked = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _checkWebPaymentRedirect();
      });
    }
  }

  void _checkWebPaymentRedirect() async {
    final uri = Uri.base;
    if (uri.path.contains('/payment/success') || uri.path.contains('/payment/cancel')) {
      final bookingId = uri.queryParameters['bookingId'];
      if (bookingId == null || bookingId.isEmpty) return;

      // Check if we already processed this booking ID to avoid infinite loop on page refresh or relaunch
      final prefs = await SharedPreferences.getInstance();
      final alreadyChecked = prefs.getBool('checked_booking_$bookingId') ?? false;
      if (alreadyChecked) return;

      // Mark as checked immediately
      await prefs.setBool('checked_booking_$bookingId', true);

      if (!mounted) return;

      // Clean URL parameters immediately on Web to avoid loop check on browser page refresh
      if (kIsWeb) {
        SystemNavigator.routeInformationUpdated(uri: Uri.parse('/'));
      }

      if (uri.path.contains('/payment/cancel')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Paiement annulé. La réservation a été annulée."),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // If it is a wallet deposit (starts with D-)
      if (bookingId.startsWith('D-')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                ),
                SizedBox(width: 12),
                Text("Vérification de votre dépôt..."),
              ],
            ),
            backgroundColor: TranSenColors.primaryGreen,
            duration: Duration(seconds: 2),
          ),
        );

        try {
          await ref.read(walletProvider.notifier).refresh();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("✅ Rechargement de votre portefeuille réussi !"),
                backgroundColor: Colors.green,
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text("Erreur de mise à jour du portefeuille : $e"),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
        return;
      }

      // Success flow for ticket bookings
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
              SizedBox(width: 12),
              Text("Vérification de votre paiement..."),
            ],
          ),
          backgroundColor: TranSenColors.primaryGreen,
          duration: Duration(seconds: 3),
        ),
      );

      try {
        int retries = 0;
        const maxRetries = 5;
        dynamic response;
        bool isPaid = false;

        while (retries < maxRetries) {
          try {
            final url = bookingId.startsWith('TKT-') ? '/api/bookings/by-reference/$bookingId' : '/api/bookings/$bookingId';
            response = await ApiClient().dio.get(url);
            if (response.statusCode == 200 && response.data != null) {
              final paymentStatus = response.data['paymentStatus'] as String?;
              if (paymentStatus == 'PAID_IN_ADVANCE') {
                isPaid = true;
                break;
              }
            }
          } catch (e) {
            debugPrint("Tentative de vérification $retries échouée: $e");
          }
          
          retries++;
          if (!isPaid && retries < maxRetries) {
            await Future.delayed(const Duration(seconds: 3));
          }
        }

        if (isPaid && response != null && response.data != null) {
          if (mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => TicketScreen(bookingData: response.data),
              ),
            );
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.white),
                    SizedBox(width: 10),
                    Expanded(child: Text('✅ Réservation confirmée ! Bon voyage !')),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 4),
              ),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Le paiement est en cours de traitement par SenePay. Veuillez vérifier vos billets dans un instant."),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      } catch (e) {
        debugPrint("Error fetching booking on web redirect: $e");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Erreur lors de la vérification : $e"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _loadIsochrones(double lng, double lat) async {
    try {
      final dio = ApiClient.externalDio;
      const String mapboxToken = LocationHelper.mapboxToken;
      final url = "https://api.mapbox.com/isochrone/v1/mapbox/driving/$lng,$lat?contours_minutes=5,10,15&polygons=true&access_token=$mapboxToken";
      
      final response = await dio.get(url);
      
      if (response.statusCode == 200) {
        final data = response.data;
        
        if (_mapController != null) {
          try {
            await _mapController!.style.removeStyleLayer("isochrone-layer");
            await _mapController!.style.removeStyleSource("isochrone-source");
          } catch (_) {}

          final source = GeoJsonSource(id: "isochrone-source", data: jsonEncode(data));
          await _mapController!.style.addSource(source);

          final layer = FillLayer(
            id: "isochrone-layer",
            sourceId: "isochrone-source",
            fillColor: TranSenColors.auroraEmerald.withValues(alpha: 0.16).toARGB32(),
            fillOutlineColor: TranSenColors.auroraCyan.toARGB32(),
          );
          await _mapController!.style.addLayer(layer);
        }
      }
    } catch (e) {
      debugPrint("Erreur Isochrone API: $e");
    }
  }

  void _loadMatrix(double userLng, double userLat, List<PointAnnotationOptions> drivers) async {
    if (drivers.isEmpty) return;
    try {
      final dio = ApiClient.externalDio;
      const String mapboxToken = LocationHelper.mapboxToken;
      
      final List<String> coords = [];
      for (var driver in drivers) {
        final pos = driver.geometry.coordinates;
        coords.add("${pos[0]},${pos[1]}");
      }
      coords.add("$userLng,$userLat");
      
      final url = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords.join(';')}?destinations=${drivers.length}&annotations=duration&access_token=$mapboxToken";
      
      final response = await dio.get(url);
      
      if (response.statusCode == 200) {
        final data = response.data;
        final durations = data['durations'] as List;
        
        if (_annotationManager != null) {
          _annotationManager!.deleteAll();
          
          for (int i = 0; i < drivers.length; i++) {
            final driver = drivers[i];
            final durationInSeconds = durations[i][0] as double?;
            String text = "Chauffeur";
            if (durationInSeconds != null) {
              final minutes = (durationInSeconds / 60).round();
              text = "$minutes min";
            }
            
            _annotationManager!.create(PointAnnotationOptions(
              geometry: driver.geometry,
              image: driver.image,
              iconSize: driver.iconSize,
              textField: text,
              textOffset: [0.0, 1.5],
            ));
          }
        }
      }
    } catch (e) {
      debugPrint("Erreur Matrix API: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    final driverMarkers = ref.watch(activeDriversStreamProvider).value ?? [];
    final userId = ref.watch(authProvider)?.userId ?? '';
    
    ref.listen(activeDriversStreamProvider, (previous, next) {
      final annotations = next.value ?? [];
      if (_userLng != null && _userLat != null) {
        _loadMatrix(_userLng!, _userLat!, annotations);
      } else if (_annotationManager != null) {
        _annotationManager!.deleteAll();
        for (var annotation in annotations) {
          _annotationManager!.create(annotation);
        }
      }
    });
    
    final historyAsync = ref.watch(providers.tripHistoryProvider(userId));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final double screenHeight = MediaQuery.of(context).size.height;
    final double statusBarHeight = MediaQuery.of(context).padding.top;
    final double mainHeight = screenHeight - statusBarHeight;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: TranSenColors.scaffoldBg(isDark),
      drawer: const ProfileDrawer(),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (_journeyState != HomeJourneyState.selectVtcDestination) {
            if (details.primaryVelocity != null && details.primaryVelocity! > 250) {
              _scaffoldKey.currentState?.openDrawer();
            }
          }
        },
        child: Stack(
          children: [
          // 1. DYNAMIC BACKGROUND OR MAP (Web-Safe Radar + Native Mapbox Mobile)
          if (_journeyState == HomeJourneyState.selectVtcDestination)
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              curve: Curves.fastOutSlowIn,
              height: mainHeight,
              child: kIsWeb
                  ? AuroraWebMapRadar(
                      title: 'Allô Dakar · Radar VTC',
                      subtitle: 'Sélectionnez votre destination ci-dessous pour calculer le tarif exact',
                      latitude: _userLat ?? 14.7167,
                      longitude: _userLng ?? -17.4677,
                      activeDriversCount: driverMarkers.length,
                    )
                  : MapWidget(
                      cameraOptions: _initialPosition,
                      onMapCreated: (MapboxMap mapboxMap) async {
                        _mapController = mapboxMap;
                        _annotationManager = await mapboxMap.annotations.createPointAnnotationManager();

                        if (driverMarkers.isNotEmpty) {
                          for (var annotation in driverMarkers) {
                            _annotationManager!.create(annotation);
                          }
                        }

                        try {
                          geo.Position position = await geo.Geolocator.getCurrentPosition();
                          _mapController?.setCamera(
                            CameraOptions(
                              center: Point(coordinates: Position(position.longitude, position.latitude)),
                              zoom: 13.0,
                            ),
                          );
                          _userLng = position.longitude;
                          _userLat = position.latitude;
                          _loadIsochrones(position.longitude, position.latitude);
                          _loadMatrix(position.longitude, position.latitude, driverMarkers);
                        } catch (_) {}
                      },
                    ),
            )
          else
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? const [Color(0xFF03100B), Color(0xFF061B13), Color(0xFF020C08)]
                        : const [Color(0xFFF2FAF6), Color(0xFFE5F4EC)],
                  ),
                ),
                child: AnimatedBackgroundWaves(
                  isDark: isDark,
                  glowColor: _activeMediaGlowColor,
                ),
              ),
            ),

          // 2. PROGRESSIVE SELECTION UI (Step 1, Step 2, Step 3 Interurbain)
          if (_journeyState != HomeJourneyState.selectVtcDestination)
            Positioned.fill(
              child: SafeArea(
                child: ClipRRect(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 400),
                      switchInCurve: Curves.fastOutSlowIn,
                      switchOutCurve: Curves.fastOutSlowIn,
                      transitionBuilder: (Widget child, Animation<double> animation) {
                        bool isIncoming = false;
                        if (child.key is ValueKey<String>) {
                          final String keyVal = (child.key as ValueKey<String>).value;
                          if (_journeyState == HomeJourneyState.selectService && keyVal == 'serviceHub') isIncoming = true;
                          if (_journeyState == HomeJourneyState.selectTravelType && keyVal == 'travelType') isIncoming = true;
                          if (_journeyState == HomeJourneyState.selectInterurbanType && keyVal == 'interurbanType') isIncoming = true;
                        }
                        
                        final int currentDepth = _getJourneyStateDepth(_journeyState);
                        final int previousDepth = _getJourneyStateDepth(_previousJourneyState);
                        final bool isForward = currentDepth >= previousDepth;

                        Offset startOffset;
                        if (isIncoming) {
                          startOffset = isForward ? const Offset(1.0, 0.0) : const Offset(-1.0, 0.0);
                        } else {
                          startOffset = isForward ? const Offset(-1.0, 0.0) : const Offset(1.0, 0.0);
                        }

                        final Tween<Offset> slideTween = Tween<Offset>(
                          begin: startOffset,
                          end: Offset.zero,
                        );

                        final curvedAnimation = CurvedAnimation(
                          parent: animation,
                          curve: Curves.fastOutSlowIn,
                        );

                        return SlideTransition(
                          position: slideTween.animate(curvedAnimation),
                          child: FadeTransition(
                            opacity: animation,
                            child: child,
                          ),
                        );
                      },
                      child: _buildJourneyContent(isDark, historyAsync),
                    ),
                  ),
                ),
              ),
            ),

          // 3. VTC BOOKING SHEET OVERLAY (Step 3 Vtc)
          if (_journeyState == HomeJourneyState.selectVtcDestination)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: VtcBookingSheet(
                userLatitude: _userLat,
                userLongitude: _userLng,
                onRouteSelected: (destination, distance, duration) {
                  // Route info selected
                },
                onRouteCoordinatesSelected: (destLat, destLng) {
                  _drawVtcRouteOnMap(destLat, destLng);
                },
                onBackToHome: () {
                  _setJourneyState(HomeJourneyState.selectService);
                },
              ),
            ),

          // 4. FLOATING BACK BUTTON ON MAP (Step 3 Vtc) — Protégé par SafeArea
          if (_journeyState == HomeJourneyState.selectVtcDestination)
            Positioned(
              top: 0,
              left: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(top: 12, left: 14),
                  child: FloatingActionButton(
                    mini: true,
                    backgroundColor: TranSenColors.glassSurface,
                    foregroundColor: TranSenColors.auroraEmeraldLight,
                    shape: CircleBorder(
                      side: BorderSide(color: TranSenColors.auroraEmeraldLight.withValues(alpha: 0.45)),
                    ),
                    onPressed: () {
                      _setJourneyState(HomeJourneyState.selectTravelType);
                    },
                    child: const Icon(Icons.arrow_back_rounded),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
      bottomNavigationBar: _journeyState == HomeJourneyState.selectService
          ? _buildBottomNavBar(isDark)
          : null,
      floatingActionButton: _journeyState == HomeJourneyState.selectVtcDestination
          ? FloatingActionButton(
              mini: true,
              onPressed: () async {
                try {
                  geo.Position pos = await geo.Geolocator.getCurrentPosition();
                  _mapController?.setCamera(
                    CameraOptions(
                      center: Point(coordinates: Position(pos.longitude, pos.latitude)),
                      zoom: 15.0,
                    ),
                  );
                } catch (_) {}
              },
              backgroundColor: Colors.white,
              foregroundColor: TranSenColors.primaryGreen,
              child: const Icon(Icons.my_location),
            )
          : null,
    );
  }

  Future<void> _drawVtcRouteOnMap(double destLat, double destLng) async {
    if (_mapController == null) return;
    final double startLat = _userLat ?? 14.7167;
    final double startLng = _userLng ?? -17.4677;

    try {
      final dio = ApiClient.externalDio;
      const String mapboxToken = LocationHelper.mapboxToken;
      final url =
          "https://api.mapbox.com/directions/v5/mapbox/driving/$startLng,$startLat;$destLng,$destLat?geometries=geojson&overview=full&access_token=$mapboxToken";
      final response = await dio.get(url);

      if (response.statusCode == 200 && response.data != null) {
        final routes = response.data['routes'] as List?;
        if (routes != null && routes.isNotEmpty) {
          final geometry = routes[0]['geometry'];
          final geoJson = {
            "type": "Feature",
            "properties": {},
            "geometry": geometry,
          };

          try {
            await _mapController!.style.removeStyleLayer("vtc-route-layer");
          } catch (_) {}
          try {
            await _mapController!.style.removeStyleSource("vtc-route-source");
          } catch (_) {}

          final source = GeoJsonSource(
            id: "vtc-route-source",
            data: jsonEncode(geoJson),
          );
          await _mapController!.style.addSource(source);

          final layer = LineLayer(
            id: "vtc-route-layer",
            sourceId: "vtc-route-source",
            lineColor: TranSenColors.primaryGreen.value,
            lineWidth: 5.0,
            lineCap: LineCap.ROUND,
            lineJoin: LineJoin.ROUND,
          );
          await _mapController!.style.addLayer(layer);

          // Center camera between start and destination
          final midLat = (startLat + destLat) / 2;
          final midLng = (startLng + destLng) / 2;
          await _mapController!.flyTo(
            CameraOptions(
              center: Point(coordinates: Position(midLng, midLat)),
              zoom: 12.2,
              padding: MbxEdgeInsets(top: 80, left: 40, bottom: 320, right: 40),
            ),
            MapAnimationOptions(duration: 1200),
          );
        }
      }
    } catch (e) {
      debugPrint("Erreur tracé itinéraire VTC: $e");
    }
  }

  Widget _buildBottomNavBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? TranSenColors.deepSurface.withValues(alpha: 0.96) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: isDark
                ? TranSenColors.auroraEmerald.withValues(alpha: 0.10)
                : Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
        border: Border(
          top: BorderSide(
            color: isDark ? TranSenColors.glassBorder : TranSenColors.lightBorder,
            width: 1.0,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBottomNavItem(
                icon: Icons.home_rounded,
                label: 'Accueil',
                isActive: true,
                isDark: isDark,
                onTap: () {},
              ),
              _buildBottomNavItem(
                icon: Icons.confirmation_number_outlined,
                label: 'Mes Trajets',
                isActive: false,
                isDark: isDark,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
                },
              ),
              _buildBottomNavCenterButton(),
              _buildBottomNavItem(
                icon: Icons.account_balance_wallet_outlined,
                label: 'TransPay',
                isActive: false,
                isDark: isDark,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                },
              ),
              _buildBottomNavItem(
                icon: Icons.psychology_outlined,
                label: 'IA Guide',
                isActive: false,
                isDark: isDark,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatAssistantScreen()));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    final color = isActive
        ? TranSenColors.primaryGreen
        : (isDark ? Colors.white60 : Colors.black54);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNavCenterButton() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        OrderSheet.show(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [TranSenColors.primaryGreen, TranSenColors.darkGreen],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: TranSenColors.primaryGreen.withValues(alpha: 0.4),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bolt_rounded, color: Colors.white, size: 18),
            SizedBox(width: 4),
            Text(
              "Réserver",
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String clientName) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final walletAsync = ref.watch(walletProvider);
    final int walletBalance = walletAsync.value?.balance.toInt() ?? 0;

    return Row(
      children: [
        // Menu Button / Avatar
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            _scaffoldKey.currentState?.openDrawer();
          },
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: _activeMediaGlowColor.withValues(alpha: 0.4),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: _activeMediaGlowColor.withValues(alpha: 0.2),
                  blurRadius: 8,
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 20,
              backgroundColor: isDark ? Colors.grey.shade800 : Colors.white,
              child: Icon(Icons.menu_rounded, color: isDark ? Colors.white : TranSenColors.primaryGreen, size: 22),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Welcome Text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Salam Alaykoum 👋",
                style: TextStyle(
                  color: isDark ? Colors.white60 : Colors.black54,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                clientName,
                style: TextStyle(
                  color: isDark ? Colors.white : Colors.black87,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        // Live TransPay Balance Pill
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
            decoration: BoxDecoration(
              color: isDark
                  ? TranSenColors.primaryGreen.withValues(alpha: 0.2)
                  : TranSenColors.primaryGreen.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: TranSenColors.primaryGreen.withValues(alpha: 0.35),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.account_balance_wallet_rounded, color: TranSenColors.primaryGreen, size: 15),
                const SizedBox(width: 6),
                Text(
                  "$walletBalance F",
                  style: TextStyle(
                    color: isDark ? Colors.white : TranSenColors.darkGreen,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Notification Button
        IconButton(
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(Icons.notifications_none_rounded, color: isDark ? Colors.white : Colors.black87, size: 24),
              Positioned(
                top: 2,
                right: 2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: TranSenColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            _showNotificationsSheet(context, isDark);
          },
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
      ],
    );
  }

  void _showNotificationsSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? TranSenColors.deepSurface : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.notifications_active_rounded, color: TranSenColors.primaryGreen),
                const SizedBox(width: 10),
                Text(
                  "Centre de Notifications",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: TranSenColors.primaryGreen.withValues(alpha: 0.15),
                child: const Icon(Icons.verified_user_rounded, color: TranSenColors.primaryGreen),
              ),
              title: const Text("Bienvenue sur TranSen Super-App", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text("Réservez vos courses VTC, voyages interurbains et envois de colis Yobanté en 1 clic.", style: TextStyle(fontSize: 12)),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: Colors.orange.withValues(alpha: 0.15),
                child: const Icon(Icons.card_giftcard_rounded, color: Colors.orange),
              ),
              title: const Text("Bonus Parrainage Actif", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text("Invitez vos proches et gagnez des réductions sur vos prochains trajets.", style: TextStyle(fontSize: 12)),
              onTap: () {
                Navigator.pop(ctx);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildInstantSearchBar(BuildContext context, bool isDark) {
    final quickDestinations = [
      {'label': '✈️ Aéroport AIBD', 'region': 'Thiès', 'mode': 'vtc'},
      {'label': '🕌 Touba', 'region': 'Diourbel', 'mode': 'interurbain'},
      {'label': '🚄 Thiès', 'region': 'Thiès', 'mode': 'interurbain'},
      {'label': '🏖️ Saly / Mbour', 'region': 'Thiès', 'mode': 'interurbain'},
      {'label': '🌉 Saint-Louis', 'region': 'Saint-Louis', 'mode': 'interurbain'},
      {'label': '🌴 Ziguinchor', 'region': 'Ziguinchor', 'mode': 'interurbain'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Main "Où allez-vous ?" Uber/BlaBlaCar Search Bar
        GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            OrderSheet.show(context);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.14)
                    : TranSenColors.primaryGreen.withValues(alpha: 0.25),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
                  blurRadius: 14,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: TranSenColors.primaryGreen.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.search_rounded,
                    color: TranSenColors.primaryGreen,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Où allez-vous aujourd'hui ?",
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Course VTC immédiate • Bus • Covoiturage 7-places",
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white60 : Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                // Direct VTC Map button inside the bar
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    _setJourneyState(HomeJourneyState.selectVtcDestination);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.local_taxi_rounded, color: Colors.white, size: 15),
                        SizedBox(width: 5),
                        Text(
                          "VTC",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        // 1-Tap Quick Destinations Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: quickDestinations.map((dest) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InkWell(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    OrderSheet.show(
                      context,
                      destination: dest['region'],
                    );
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.07)
                          : Colors.white.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? Colors.white12 : Colors.black12,
                      ),
                    ),
                    child: Text(
                      dest['label']!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildJourneyContent(bool isDark, AsyncValue<List<TripModel>> historyAsync) {
    switch (_journeyState) {
      case HomeJourneyState.selectService:
        return _buildServiceHub(isDark, historyAsync);
      case HomeJourneyState.selectTravelType:
        return _buildTravelTypeSelection(isDark);
      case HomeJourneyState.selectInterurbanType:
        return _buildInterurbanTypeSelection(isDark);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildServiceHub(bool isDark, AsyncValue<List<TripModel>> historyAsync) {
    final clientName = ref.watch(authProvider)?.name ?? 'Passager';
    return Column(
      key: const ValueKey('serviceHub'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeader(context, clientName),
        const SizedBox(height: 16),
        // Uber x BlaBlaCar Instant Search Bar & 1-Tap Quick Destinations
        _buildInstantSearchBar(context, isDark),
        const SizedBox(height: 18),
        // Premium Smart Media Hub card (Dynamic announcements, visual carousel & audio synthesis)
        SmartMediaHubCard(
          channel: 'client',
          onNavigateToBus: () {
            _setJourneyState(HomeJourneyState.selectTravelType);
          },
          onColorChanged: (color) {
            if (color != _activeMediaGlowColor) {
              setState(() {
                _activeMediaGlowColor = color;
              });
            }
          },
        ),
        // Active Trips Section
        Consumer(builder: (context, ref, child) {
          final activePoolAsync = ref.watch(providers.activePoolProvider);
          final activeTripAsync = ref.watch(providers.activeTripProvider);
          final activeCompanyTripAsync = ref.watch(providers.activeCompanyTripProvider);
          return Column(
            children: [
              activePoolAsync.when(
                data: (pool) => pool == null ? const SizedBox.shrink() : Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: _buildActiveTripCard(context, pool, cardType: 'pool'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              activeTripAsync.when(
                data: (trip) => trip == null ? const SizedBox.shrink() : Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: _buildActiveTripCard(context, trip, cardType: 'yobante'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              activeCompanyTripAsync.when(
                data: (trip) => trip == null ? const SizedBox.shrink() : Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: _buildActiveTripCard(context, trip, cardType: 'company'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          );
        }),
        const SizedBox(height: 10),

        // Grid Actions (Modern Glassmorphism with Generalized Rotating Light)
        UnifiedGridActionsContainer(
          glowColor: _activeMediaGlowColor,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: PremiumPulseCard(
                      label: 'Me déplacer',
                      sublabel: 'Course ou Voyage',
                      icon: Icons.directions_car,
                      gradientColors: const [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                      iconColor: const Color(0xFF81C784),
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        _setJourneyState(HomeJourneyState.selectTravelType);
                      },
                      animated: true,
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: PremiumPulseCard(
                      label: 'Yobanté',
                      sublabel: 'Envoyer un colis',
                      icon: Icons.inventory_2,
                      gradientColors: const [Color(0xFF0D47A1), Color(0xFF1976D2)],
                      iconColor: const Color(0xFF64B5F6),
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        YobanteSheet.show(context);
                      },
                      animated: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              Row(
                children: [
                  Expanded(
                    child: PremiumPulseCard(
                      label: 'Portefeuille',
                      sublabel: 'Gérer mon argent',
                      icon: Icons.account_balance_wallet,
                      gradientColors: const [Color(0xFF4A148C), Color(0xFF7B1FA2)],
                      iconColor: const Color(0xFFE1BEE7),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                      },
                      animated: false,
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: PremiumPulseCard(
                      label: 'Parrainage',
                      sublabel: 'Gagner des points',
                      icon: Icons.card_giftcard,
                      gradientColors: const [Color(0xFFE65100), Color(0xFFF57C00)],
                      iconColor: const Color(0xFFFFE082),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
                      },
                      animated: false,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 30),
        const Divider(height: 1, thickness: 1),
        const SizedBox(height: 20),

        // History Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "HISTORIQUE RÉCENT",
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1),
            ),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen())),
              child: const Text(
                "Plus d'historique",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TranSenColors.primaryGreen),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        
        // Render history
        historyAsync.when(
          data: (trips) {
            final items = trips.take(3).toList();
            if (items.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: Text("Aucun trajet récent", style: TextStyle(color: Colors.grey))),
              );
            }
            return Column(
              children: items.map((trip) => _buildHistoryItem(context, trip)).toList(),
            );
          },
          loading: () => Column(
            children: List.generate(3, (index) => _buildHistoryShimmer(context)),
          ),
          error: (e, _) => Center(child: Text("Erreur de chargement: $e")),
        ),
      ],
    );
  }

  Widget _buildTravelTypeSelection(bool isDark) {
    return Column(
      key: const ValueKey('travelType'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: isDark ? Colors.white70 : Colors.black87),
              onPressed: () {
                _setJourneyState(HomeJourneyState.selectService);
              },
            ),
            const SizedBox(width: 10),
            Text(
              "Type de déplacement",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 25),
        
        Text(
          "Quel est votre type de déplacement ?",
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : Colors.black87,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 25),

        _buildChoiceCard(
          title: "Course Urbaine (VTC) 🟢",
          subtitle: "Déplacement immédiat et rapide dans votre ville.",
          icon: Icons.directions_car_filled,
          gradient: const [Color(0xFF1B5E20), Color(0xFF2E7D32)],
          iconColor: const Color(0xFF81C784),
          onTap: () {
            _setJourneyState(HomeJourneyState.selectVtcDestination);
          },
        ),
        const SizedBox(height: 20),

        _buildChoiceCard(
          title: "Voyage Interurbain 🔵",
          subtitle: "Voyage planifié ou départ urgent entre les régions du Sénégal.",
          icon: Icons.departure_board,
          gradient: const [Color(0xFF0D47A1), Color(0xFF1976D2)],
          iconColor: const Color(0xFF64B5F6),
          onTap: () {
            _setJourneyState(HomeJourneyState.selectInterurbanType);
          },
        ),
      ],
    );
  }

  Widget _buildInterurbanTypeSelection(bool isDark) {
    return Column(
      key: const ValueKey('interurbanType'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: isDark ? Colors.white70 : Colors.black87),
              onPressed: () {
                _setJourneyState(HomeJourneyState.selectTravelType);
              },
            ),
            const SizedBox(width: 10),
            Text(
              "Voyage Interurbain",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        
        Text(
          "Sélectionnez votre type de transport :",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : Colors.black87,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 20),

        _buildChoiceCard(
          title: "Allo Dakar (Indépendant) 🚗",
          subtitle: "Covoiturage partagé (3-4 places) économique avec un chauffeur indépendant.",
          icon: Icons.people_outline,
          gradient: const [Color(0xFF1B5E20), Color(0xFF2E7D32)],
          iconColor: const Color(0xFF81C784),
          onTap: () {
            OrderSheet.show(context, routingType: 'INDEPENDENTS_ONLY');
          },
        ),
        const SizedBox(height: 15),

        _buildChoiceCard(
          title: "Compagnie Partenaire (Bus) 🚌",
          subtitle: "Voyage confortable planifié sur les lignes régulières de nos compagnies partenaires.",
          icon: Icons.directions_bus_filled_outlined,
          gradient: const [Color(0xFFE65100), Color(0xFFF57C00)],
          iconColor: const Color(0xFFFFB74D),
          onTap: () {
            OrderSheet.show(context, routingType: 'COMPANY_ONLY');
          },
        ),
        const SizedBox(height: 15),

        _buildChoiceCard(
          title: "Marché Public (Urgence) 🚨",
          subtitle: "Besoin de partir immédiatement ? Votre demande est envoyée à tous les chauffeurs pour une prise en charge rapide !",
          icon: Icons.electric_bolt,
          gradient: const [Color(0xFF0D47A1), Color(0xFF1976D2)],
          iconColor: const Color(0xFF64B5F6),
          onTap: () {
            OrderSheet.show(context, routingType: 'PUBLIC');
          },
        ),
      ],
    );
  }

  Widget _buildChoiceCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradient,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: gradient.last.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.mediumImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: iconColor, size: 32),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryItem(BuildContext context, TripModel trip) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bool isBusBilling = trip.category == 'BUS_COMPANY';
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        _showTripDetails(context, trip);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: isDark ? Colors.white10 : Colors.grey[200]!, width: 0.5)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isBusBilling
                        ? Colors.orange.withValues(alpha: 0.1)
                        : trip.type.contains('Yobanté')
                            ? Colors.blue.withValues(alpha: 0.1)
                            : TranSenColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isBusBilling
                        ? Icons.directions_bus
                        : trip.type.contains('Yobanté')
                            ? Icons.inventory_2
                            : Icons.directions_car,
                    size: 20,
                    color: isBusBilling
                        ? Colors.orange
                        : trip.type.contains('Yobanté')
                            ? Colors.blue
                            : TranSenColors.primaryGreen,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(trip.destination, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), overflow: TextOverflow.ellipsis),
                      Text(
                        "${trip.createdAt.day} ${_getMonth(trip.createdAt.month)}, ${trip.createdAt.hour}:${trip.createdAt.minute.toString().padLeft(2, '0')}",
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Text(
                  "${trip.price.toInt()} F",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
            if (isBusBilling) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      _showTripDetails(context, trip);
                    },
                    icon: const Icon(Icons.qr_code, size: 16),
                    label: const Text('MON BILLET',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.blue,
                      side: const BorderSide(color: Colors.blue),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryShimmer(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.white10 : Colors.grey[300]!,
      highlightColor: isDark ? Colors.white24 : Colors.grey[100]!,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
        child: Row(
          children: [
            Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 150, height: 12, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(width: 80, height: 10, color: Colors.white),
                ],
              ),
            ),
            Container(width: 60, height: 14, color: Colors.white),
          ],
        ),
      ),
    );
  }

  String _getMonth(int month) {
    const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    return months[month - 1];
  }

  void _showTripDetails(BuildContext context, TripModel trip) async {
    HapticFeedback.selectionClick();

    if (trip.category == 'BUS_COMPANY') {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(color: TranSenColors.primaryGreen),
        ),
      );

      try {
        final response = await ApiClient().dio.get('/api/bookings/${trip.id}');
        if (context.mounted) Navigator.pop(context); // Close loading indicator

        if (response.statusCode == 200 && response.data != null) {
          if (context.mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => TicketScreen(bookingData: response.data),
              ),
            );
          }
        } else {
          throw Exception("Billet introuvable");
        }
      } catch (e) {
        if (context.mounted) {
          Navigator.pop(context); // Close loading indicator
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Impossible de charger les détails du billet : $e"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
      useSafeArea: true,
      builder: (context) => _TripDetailsSheet(trip: trip),
    );
  }


  Widget _buildActiveTripCard(BuildContext context, TripModel trip, {required String cardType}) {
    final Color color;
    final String title;
    final IconData icon;

    if (cardType == 'yobante') {
      color = Colors.blue;
      title = "LIVRAISON EN COURS";
      icon = Icons.inventory_2;
    } else if (cardType == 'company') {
      color = Colors.indigo;
      title = trip.category == 'BUS_COMPANY' ? "TRAJET BUS COMPAGNIE" : "TRAJET COMPAGNIE EN COURS";
      icon = trip.category == 'BUS_COMPANY' ? Icons.directions_bus : Icons.business;
    } else {
      color = TranSenColors.primaryGreen;
      title = "COURSE EN COURS";
      icon = Icons.directions_car;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withValues(alpha: 0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            title: Text(
              title,
              style: TextStyle(fontWeight: FontWeight.w900, color: color, fontSize: 12, letterSpacing: 1.2),
            ),
            subtitle: Text(
              "${trip.departure} ➔ ${trip.destination}",
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(Icons.arrow_forward_ios, size: 14, color: color),
            ),
            onTap: () {
              HapticFeedback.mediumImpact();
              Navigator.push(context, MaterialPageRoute(builder: (_) => TripTrackingScreen(tripId: trip.id)));
            },
          ),
        ),
      ),
    );
  }

}

class PremiumActionCard extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const PremiumActionCard({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  State<PremiumActionCard> createState() => _PremiumActionCardState();
}

class _PremiumActionCardState extends State<PremiumActionCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Expanded(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  gradient: SweepGradient(
                    center: Alignment.center,
                    startAngle: 0.0,
                    endAngle: 3.14 * 2,
                    colors: [
                      widget.color.withValues(alpha: 0.0),
                      widget.color,
                      widget.color.withValues(alpha: 0.0),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                    transform: GradientRotation(_controller.value * 3.14 * 2),
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark ? TranSenColors.glassSurface : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        widget.onTap();
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: widget.color.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(child: Icon(widget.icon, color: widget.color, size: 32)),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Text(
          widget.label, 
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class _TripDetailsSheet extends StatefulWidget {
  final TripModel trip;
  const _TripDetailsSheet({required this.trip});

  @override
  State<_TripDetailsSheet> createState() => _TripDetailsSheetState();
}

class _TripDetailsSheetState extends State<_TripDetailsSheet> {
  final GlobalKey _receiptKey = GlobalKey();
  bool _isGenerating = false;

  Future<void> _shareReceiptImage() async {
    HapticFeedback.mediumImpact();
    setState(() => _isGenerating = true);
    try {
      // 1. Capture du widget
      RenderRepaintBoundary boundary = _receiptKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      // 2. Sauvegarde temporaire
      XFile xFile;
      final shortId = widget.trip.id.length >= 8 ? widget.trip.id.substring(0, 8) : widget.trip.id;
      final fileName = 'recu_transen_$shortId.png';
      if (kIsWeb) {
        xFile = XFile.fromData(pngBytes, mimeType: 'image/png', name: fileName);
      } else {
        final directory = await getTemporaryDirectory();
        final imagePath = await File('${directory.path}/$fileName').create();
        await imagePath.writeAsBytes(pngBytes);
        xFile = XFile(imagePath.path);
      }

      // 3. Partage
      await SharePlus.instance.share(
        ShareParams(
          files: [xFile],
          text: 'Reçu de trajet TranSen - ${widget.trip.price.toInt()} FCFA',
        ),
      );
    } catch (e) {
      debugPrint("Erreur partage reçu: $e");
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: isDark ? TranSenColors.deepSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
      child: Column(
        children: [
          Container(width: 40, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
          const SizedBox(height: 20),
          
          // LA ZONE DE CAPTURE (LE REÇU)
          Expanded(
            child: SingleChildScrollView(
              child: RepaintBoundary(
                key: _receiptKey,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? TranSenColors.glassSurface : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.3), width: 1),
                  ),
                  child: Column(
                    children: [
                      // LOGO & HEADER
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Image.asset('assets/images/logo.png', height: 40),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text("REÇU", style: TextStyle(fontWeight: FontWeight.w900, color: TranSenColors.primaryGreen, fontSize: 18, letterSpacing: 2)),
                              Text("DE PAIEMENT", style: TextStyle(fontSize: 10, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                      const Divider(height: 30),
                      
                      // MONTANT
                      Text("-${widget.trip.price.toInt()} F", style: const TextStyle(fontSize: 38, fontWeight: FontWeight.bold, color: TranSenColors.primaryGreen)),
                      Text("Payé à ${widget.trip.driverName ?? 'Chauffeur'}", style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 25),
                      
                      // DETAILS
                      _buildStatusDisplay(widget.trip),
                      _buildDetailRow("Date", "${widget.trip.createdAt.day} ${_getMonth(widget.trip.createdAt.month)} ${widget.trip.createdAt.year}", null),
                      _buildDetailRow("Heure", "${widget.trip.createdAt.hour}:${widget.trip.createdAt.minute.toString().padLeft(2,'0')}", null),
                      _buildDetailRow("Départ", widget.trip.departure, null),
                      _buildDetailRow("Destination", widget.trip.destination, null),
                      _buildDetailRow(
                        "ID Trans.",
                        "TR-${(widget.trip.id.length >= 8 ? widget.trip.id.substring(0, 8) : widget.trip.id).toUpperCase()}",
                        null,
                      ),
                      
                      const SizedBox(height: 30),
                      const Text("Merci d'avoir choisi TranSen !", style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isGenerating ? null : _shareReceiptImage,
                  icon: _isGenerating 
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.share, size: 18),
                  label: Text(_isGenerating ? "GÉNÉRATION..." : "PARTAGER L'IMAGE"),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: TranSenColors.primaryGreen,
                    side: const BorderSide(color: TranSenColors.primaryGreen),
                    minimumSize: const ui.Size(0, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TranSenColors.primaryGreen,
                    foregroundColor: Colors.white,
                    minimumSize: const ui.Size(0, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                  child: const Text("FERMER"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusDisplay(TripModel trip) {
    String text = "En attente";
    Color color = Colors.grey;
    if (trip.status == 'accepted' || trip.status == 'departed') {
      text = "En cours";
      color = Colors.orange;
    } else if (trip.status == 'completed') {
      text = "Effectué";
      color = Colors.green;
    } else if (trip.status == 'cancelled') {
      text = "Annulé";
      color = Colors.red;
    } else if (trip.status == 'open' || trip.status == 'full') {
      text = "En attente";
      color = Colors.blue;
    }
    return _buildDetailRow("Statut", text, color);
  }

  Widget _buildDetailRow(String label, String value, Color? valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: valueColor)),
        ],
      ),
    );
  }

  String _getMonth(int month) {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return months[month - 1];
  }
}


