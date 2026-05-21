import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:url_launcher/url_launcher.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_payment/transen_payment.dart';
import 'package:dio/dio.dart';
import 'dart:math' as math;
import 'dart:async';
import 'dart:convert';
import 'package:transen_maps/transen_maps.dart';

class PoolDetailScreen extends ConsumerStatefulWidget {
  final PoolModel pool;

  const PoolDetailScreen({super.key, required this.pool});

  @override
  ConsumerState<PoolDetailScreen> createState() => _PoolDetailScreenState();
}

class _PoolDetailScreenState extends ConsumerState<PoolDetailScreen> {
  late List<MapEntry<String, dynamic>> _optimizedPickups;
  MapboxMap? _mapboxController;
  PointAnnotationManager? _annotationManager;
  bool _isRoutePlotted = false;
  ({double lat, double lng})? _myPosition;

  StreamSubscription<geo.Position>? _positionStream;
  List<dynamic> _navSteps = [];
  int _currentStepIndex = 0;
  double _remainingDistance = 0.0;
  bool _isNavigating = false;

  @override
  void initState() {
    super.initState();
    _isNavigating = widget.pool.status == 'departed';
    _optimizedPickups = ItineraryOptimizer.optimizePickupOrder(
      const LatLng(14.7167, -17.4677),
      widget.pool.passengerDetails,
    );
    _fetchMyPositionAndRoute();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }

  void _fetchMyPositionAndRoute() async {
    try {
      bool serviceEnabled = await geo.Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      geo.LocationPermission permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied) {
        permission = await geo.Geolocator.requestPermission();
        if (permission == geo.LocationPermission.denied) return;
      }

      geo.Position pos = await geo.Geolocator.getCurrentPosition();
      final driverPos = (lat: pos.latitude, lng: pos.longitude);

      if (mounted) {
        setState(() {
          _myPosition = driverPos;
          _optimizedPickups = ItineraryOptimizer.optimizePickupOrder(
            LatLng(driverPos.lat, driverPos.lng),
            widget.pool.passengerDetails,
          );
        });
      }

      _getPolylineAndMarkers(driverPos);
    } catch (e) {
      debugPrint("Error fetching driver position: $e");
    }

    // Écoute la position en temps réel
    _positionStream = geo.Geolocator.getPositionStream(
      locationSettings: const geo.LocationSettings(
        accuracy: geo.LocationAccuracy.high,
        distanceFilter: 5,
      ),
    ).listen((pos) {
      if (!mounted) return;
      final driverPos = (lat: pos.latitude, lng: pos.longitude);
      setState(() => _myPosition = driverPos);

      // Suivi caméra Mapbox pendant navigation
      if (_isNavigating && _mapboxController != null) {
        _mapboxController!.setCamera(CameraOptions(
          center: Point(coordinates: Position(pos.longitude, pos.latitude)),
          zoom: 17.0,
          bearing: pos.heading,
          pitch: 45.0,
        ));
      }

      // Suivi des étapes de navigation
      if (_isNavigating && _navSteps.isNotEmpty && _currentStepIndex < _navSteps.length) {
        final currentStep = _navSteps[_currentStepIndex];
        final maneuver = currentStep['maneuver'] ?? {};
        final loc = maneuver['location'] as List?;
        if (loc != null && loc.length >= 2) {
          final stepLng = (loc[0] as num).toDouble();
          final stepLat = (loc[1] as num).toDouble();
          final dist = _calculateDistance(pos.latitude, pos.longitude, stepLat, stepLng) * 1000;
          setState(() {
            _remainingDistance = dist;
            if (dist < 20 && _currentStepIndex < _navSteps.length - 1) {
              _currentStepIndex++;
            }
          });
        }
      }

      // Mettre à jour position chauffeur dans Firestore
      if (_isNavigating) {
        final auth = ref.read(authProvider);
        if (auth != null && auth.userId.isNotEmpty) {
          FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
              .collection('active_drivers')
              .doc(auth.userId)
              .set({
                'lat': pos.latitude,
                'lng': pos.longitude,
                'heading': pos.heading,
                'updatedAt': FieldValue.serverTimestamp(),
              }, SetOptions(merge: true)).catchError((e) {
                debugPrint("Error updating active driver position: $e");
              });
        }
      }
    });
  }

  void _getPolylineAndMarkers(({double lat, double lng}) driverPos) async {
    if (_mapboxController == null) return;
    if (_isRoutePlotted || _optimizedPickups.isEmpty) return;
    _isRoutePlotted = true;

    // Construire la liste des coordonnées pour l'API optimized-trips
    final List<String> coords = ["${driverPos.lng},${driverPos.lat}"];
    for (var entry in _optimizedPickups) {
      final wp = entry.value;
      if (wp['lat'] != null && wp['lng'] != null) {
        coords.add("${wp['lng']},${wp['lat']}");
      }
    }
    final destCoords = ItineraryOptimizer.getRegionCoordinates(widget.pool.destination)
        ?? const LatLng(14.7167, -17.4677);
    coords.add("${destCoords.longitude},${destCoords.latitude}");

    try {
      final dio = Dio();
      const String mapboxToken = "pk.eyJ1IjoidHJhbnNlbiIsImEiOiJjbXA4Nm5menUwM205MnNwOGZmb3N3ZTM4In0.SMFaXkbJJi5bM6Bk3_p8ng";
      final url = "https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords.join(';')}?source=first&destination=last&overview=full&geometries=geojson&steps=true&access_token=$mapboxToken";

      final response = await dio.get(url);
      if (response.statusCode == 200) {
        final data = response.data;
        final trips = data['trips'] as List;
        if (trips.isNotEmpty) {
          final trip = trips[0];
          final geometry = trip['geometry'];

          // Extraire étapes de navigation
          final legs = trip['legs'] as List?;
          final stepsList = [];
          if (legs != null) {
            for (var leg in legs) {
              final steps = leg['steps'] as List?;
              if (steps != null) stepsList.addAll(steps);
            }
          }

          if (mounted) setState(() { _navSteps = stepsList; _currentStepIndex = 0; });

          // Tracer la polyline sur la carte Mapbox
          if (_mapboxController != null) {
            try {
              await _mapboxController!.style.addSource(
                GeoJsonSource(id: "pool-route-source", data: jsonEncode(geometry)),
              );
              await _mapboxController!.style.addLayer(LineLayer(
                id: "pool-route-layer",
                sourceId: "pool-route-source",
                lineColor: TranSenColors.primaryGreen.toARGB32(),
                lineWidth: 5.0,
                lineCap: LineCap.ROUND,
                lineJoin: LineJoin.ROUND,
              ));
            } catch (_) {}

            // Zoom pour montrer tout l'itinéraire
            _mapboxController!.setCamera(CameraOptions(
              center: Point(coordinates: Position(driverPos.lng, driverPos.lat)),
              zoom: 11.0,
            ));
          }

          // Ajouter les marqueurs passagers via Mapbox
          _addPassengerMarkers();
        }
      }
    } catch (e) {
      debugPrint("Pool Optimization Error: $e");
      _isRoutePlotted = false;
    }
  }

  void _addPassengerMarkers() async {
    if (_annotationManager == null) return;
    await _annotationManager!.deleteAll();
    final passengerBytes = await MapMarkerUtils.getPassengerIconBytes();
    for (var passenger in widget.pool.passengerDetails.values) {
      if (passenger['lat'] != null && passenger['lng'] != null) {
        await _annotationManager!.create(PointAnnotationOptions(
          geometry: Point(coordinates: Position(
            (passenger['lng'] as num).toDouble(),
            (passenger['lat'] as num).toDouble(),
          )),
          image: passengerBytes,
          iconSize: 1.0,
        ));
      }
    }
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const R = 6371.0; 
    final dLat = (lat2 - lat1) * (math.pi / 180.0);
    final dLon = (lon2 - lon1) * (math.pi / 180.0);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180.0)) * math.cos(lat2 * (math.pi / 180.0)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return R * c;
  }

  Widget _buildNavigationBanner() {
    if (!_isNavigating || _navSteps.isEmpty || _currentStepIndex >= _navSteps.length) {
      return const SizedBox.shrink();
    }
    
    final currentStep = _navSteps[_currentStepIndex];
    final maneuver = currentStep['maneuver'] ?? {};
    final instruction = maneuver['instruction'] ?? "Continuez tout droit";
    final modifier = maneuver['modifier'] as String? ?? "straight";
    
    IconData turnIcon;
    switch (modifier) {
      case 'left':
      case 'sharp left':
        turnIcon = Icons.arrow_back;
        break;
      case 'right':
      case 'sharp right':
        turnIcon = Icons.arrow_forward;
        break;
      case 'slight left':
        turnIcon = Icons.turn_slight_left;
        break;
      case 'slight right':
        turnIcon = Icons.turn_slight_right;
        break;
      case 'straight':
      default:
        turnIcon = Icons.arrow_upward;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: TranSenColors.primaryGreen,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: TranSenColors.primaryGreen.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(turnIcon, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "GUIDAGE NAVIGATION",
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  instruction,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _remainingDistance > 1000
                      ? "Dans ${(_remainingDistance / 1000).toStringAsFixed(1)} km"
                      : "Dans ${_remainingDistance.toInt()} m",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<PoolModel?>(
        stream: ref.watch(tripRepositoryProvider).watchPool(widget.pool.id),
        builder: (_, snapshot) {
          final pool = snapshot.data ?? widget.pool;

          return Scaffold(
            appBar: AppBar(
              title: const Text('Itinéraire Porte-à-Porte'),
              backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1A1A1A) : Colors.black87,
              foregroundColor: Colors.white,
            ),
            body: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 25),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: Theme.of(context).brightness == Brightness.dark 
                        ? [const Color(0xFF1A1A1A), const Color(0xFF0A0A0A)]
                        : [Colors.black87, Colors.black],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(40)),
                    boxShadow: [
                      BoxShadow(
                        color: TranSenColors.primaryGreen.withValues(alpha: 0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      )
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: TranSenColors.primaryGreen.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                              border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.3), width: 1.5),
                            ),
                            child: const Icon(Icons.route_rounded, color: TranSenColors.primaryGreen, size: 28),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("ITINÉRAIRE EN COURS", 
                                  style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "${pool.departure} ➔ ${pool.destination}",
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                    letterSpacing: -0.5
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildHeaderStat("PASSAGERS", "${pool.currentFilling}/4", Icons.people_outline),
                          _buildHeaderStat("STATUT", pool.status.toUpperCase(), Icons.info_outline),
                          _buildHeaderStat("PRIX FIXE", "10.000 F", Icons.payments_outlined),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 5,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 10))
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: MapWidget(
                        viewport: CameraViewportState(
                          center: Point(
                            coordinates: Position(
                              (ItineraryOptimizer.getRegionCoordinates(widget.pool.departure) ?? const LatLng(14.7167, -17.4677)).longitude,
                              (ItineraryOptimizer.getRegionCoordinates(widget.pool.departure) ?? const LatLng(14.7167, -17.4677)).latitude,
                            ),
                          ),
                          zoom: 11.0,
                        ),
                        onMapCreated: (MapboxMap mapboxMap) async {
                          _mapboxController = mapboxMap;
                          _annotationManager = await mapboxMap.annotations.createPointAnnotationManager();
                          // Si on a déjà la position, lancer le tracé
                          if (_myPosition != null) {
                            _getPolylineAndMarkers(_myPosition!);
                          } else {
                            _addPassengerMarkers();
                          }
                        },
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 5,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF121212) : Colors.white,
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, -5))
                      ],
                    ),
                    child: Column(
                      children: [
                        if (_isNavigating && _navSteps.isNotEmpty && _currentStepIndex < _navSteps.length) ...[
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                            child: _buildNavigationBanner(),
                          ),
                        ],
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(20),
                            itemCount: _optimizedPickups.length,
                            itemBuilder: (_, index) {
                              final passengerEntry = _optimizedPickups[index];
                              final passengerId = passengerEntry.key;
                              final passenger = passengerEntry.value;
                              final isLast = index == _optimizedPickups.length - 1;

                              String pName = passenger['name'] ?? 'Passager';
                              if (passenger['firstName'] != null &&
                                  passenger['lastName'] != null) {
                                pName =
                                    "${passenger['firstName']} ${passenger['lastName']}";
                              }

                              return Column(
                                children: [
                                  _buildStepCard(
                                    index + 1,
                                    pName,
                                    passengerId,
                                    passenger,
                                    "Récupération: ${pool.departure}",
                                  ),
                                  if (!isLast)
                                    const Icon(Icons.arrow_downward,
                                        color: Colors.grey, size: 20),
                                ],
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 25),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: (pool.status == 'accepted' ? TranSenColors.accentGold : Colors.black).withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        )
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        try {
                          final repo = ref.read(tripRepositoryProvider);
                          if (pool.status == 'accepted') {
                            await repo.departPool(pool.id);
                            
                            if (mounted) {
                              setState(() {
                                _isNavigating = true;
                                _currentStepIndex = 0;
                              });
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text("Navigation démarrée !"),
                                  backgroundColor: TranSenColors.primaryGreen,
                                ),
                              );
                            }
                          } else {
                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(content: Text("Finalisation du trajet..."), duration: Duration(seconds: 1)),
                              );
                            }
                            await repo.completeTrip(pool.id);
                            if (mounted) {
                              navigator.pop();
                              messenger.showSnackBar(
                                const SnackBar(
                                    content: Text("✅ Trajet terminé avec succès !"),
                                    backgroundColor: Colors.green),
                              );
                            }
                          }
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(
                                  content: Text("❌ Erreur: ${e.toString().replaceAll("Exception: ", "")}"),
                                  backgroundColor: Colors.red),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: pool.status == 'accepted'
                            ? TranSenColors.accentGold
                            : (Theme.of(context).brightness == Brightness.dark ? Colors.grey[900] : Colors.black87),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 22),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                        elevation: 0,
                      ),
                      child: Center(
                        child: Text(
                          pool.status == 'accepted'
                              ? "DÉMARRER LE TRAJET"
                              : "TERMINER LE TRAJET",
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        });
  }

  Future<bool> _hasAccess() async {
    final auth = ref.read(authProvider);
    if (auth == null) return false;
    
    // 1. Vérifier l'abonnement
    final subInfo = await SubscriptionService().checkSubscription(auth.userId);
    if (subInfo.isActive) return true;
    
    // 2. Vérifier le solde (Pool prix fixe 10000F, donc 1% = 100F)
    final wallet = ref.read(walletProvider);
    const commission = 100.0; 
    
    if (wallet.balance < commission) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("⚠️ Rechargez votre portefeuille TransPay (${commission.toInt()}F requis) pour contacter les passagers."),
            backgroundColor: Colors.orange.shade900,
            duration: const Duration(seconds: 4),
            action: SnackBarAction(
              label: "RECHARGER",
              textColor: Colors.white,
              onPressed: () {
                if (mounted) {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                }
              },
            ),
          ),
        );
      }
      return false;
    }
    return true;
  }

  Widget _buildHeaderStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: TranSenColors.primaryGreen, size: 18),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _buildStepCard(int step, String name, String passengerId, Map<String, dynamic> passenger, String info) {
    String initialPhone = passenger['phone'] ?? '';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
              blurRadius: 12,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text("$step", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: -0.5)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on, color: Colors.grey, size: 12),
                          const SizedBox(width: 4),
                          Expanded(child: Text(info, style: const TextStyle(fontSize: 12, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, thickness: 0.5),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionCircle(
                  icon: Icons.navigation_outlined, 
                  color: Colors.blue, 
                  onTap: () => launchUrl(Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${passenger['lat']},${passenger['lng']}&travelmode=driving"))
                ),
                _buildActionCircle(
                  icon: Icons.message_outlined, 
                  color: Colors.green, 
                  onTap: () async {
                    if (await _hasAccess()) DeviceUtils.launchWhatsApp(initialPhone);
                  }
                ),
                _buildActionCircle(
                  icon: Icons.chat_bubble_outline_rounded, 
                  color: TranSenColors.primaryGreen, 
                  onTap: () async {
                    if (await _hasAccess()) {
                      if (!mounted) return;
                      Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(tripId: widget.pool.id, otherPartyName: name, passengerId: passengerId)));
                    }
                  }
                ),
                _buildActionCircle(
                  icon: Icons.phone_enabled_outlined, 
                  color: Colors.blueAccent, 
                  onTap: () async {
                    if (await _hasAccess()) {
                      // Fetch fresh phone
                      final userDoc = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(passengerId).get();
                      String phone = initialPhone;
                      if (userDoc.exists && userDoc.data()?['phone'] != null) phone = userDoc.data()!['phone'];
                      DeviceUtils.launchPhoneCall(phone);
                    }
                  }
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCircle({required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }
}
