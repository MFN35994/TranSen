import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_core/transen_core.dart';
import 'dart:async';
import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:transen_auth/transen_auth.dart';
import '../data/repositories/trip_repository.dart';

enum VtcSheetState { search, selectVehicle }

class VtcBookingSheet extends ConsumerStatefulWidget {
  final VoidCallback? onBackToHome;
  final Function(String destination, double distance, double duration)? onRouteSelected;
  final double? userLatitude;
  final double? userLongitude;

  const VtcBookingSheet({
    super.key,
    this.onBackToHome,
    this.onRouteSelected,
    this.userLatitude,
    this.userLongitude,
  });

  @override
  ConsumerState<VtcBookingSheet> createState() => _VtcBookingSheetState();
}

class _VtcBookingSheetState extends ConsumerState<VtcBookingSheet> {
  VtcSheetState _currentState = VtcSheetState.search;
  final TextEditingController _pickupController = TextEditingController(text: "Ma position actuelle");
  final TextEditingController _destinationController = TextEditingController();
  
  bool _isLoadingPrices = false;
  bool _isOrdering = false;
  List<Map<String, dynamic>> _pricingEstimations = [];
  String _selectedVehicleClass = "CLASSIQUE";
  String _selectedPaymentMethod = "CASH"; // CASH, WALLET, WAVEM
  
  final String _mapboxToken = "pk.eyJ1IjoidHJhbnNlbiIsImEiOiJjbXA4Nm5menUwM205MnNwOGZmb3N3ZTM4In0.SMFaXkbJJi5bM6Bk3_p8ng";
  final Dio _mapboxDio = Dio();
  Timer? _debounceTimer;
  
  // Liste des hubs régionaux majeurs du Sénégal avec coordonnées réelles
  final List<Map<String, dynamic>> _nationalHubs = [
    {"name": "Dakar Plateau", "lat": 14.6677, "lng": -17.4358},
    {"name": "Aéroport Blaise Diagne (AIBD)", "lat": 14.6710, "lng": -17.0673},
    {"name": "Thiès (Centre-Ville)", "lat": 14.7912, "lng": -16.9359},
    {"name": "Saly / Mbour", "lat": 14.4414, "lng": -16.9861},
    {"name": "Saint-Louis (Île Historique)", "lat": 16.0244, "lng": -16.5015},
    {"name": "Touba (Grande Mosquée)", "lat": 14.8647, "lng": -15.8881},
    {"name": "Ziguinchor (Escale)", "lat": 12.5592, "lng": -16.2723},
  ];

  List<Map<String, dynamic>> _filteredSuggestions = [];

  @override
  void initState() {
    super.initState();
    _loadDefaultSuggestions();
  }

  @override
  void didUpdateWidget(covariant VtcBookingSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userLatitude != widget.userLatitude || oldWidget.userLongitude != widget.userLongitude) {
      if (_destinationController.text.isEmpty) {
        _loadDefaultSuggestions();
      }
    }
  }

  void _loadDefaultSuggestions() {
    final List<Map<String, dynamic>> suggestions = [];
    
    for (var hub in _nationalHubs) {
      double distance = 10.0;
      double duration = 15.0;
      
      if (widget.userLatitude != null && widget.userLongitude != null) {
        distance = _calculateDistance(
          widget.userLatitude!,
          widget.userLongitude!,
          hub['lat'] as double,
          hub['lng'] as double,
        );
        // Vitesse moyenne de 45 km/h sur réseau routier mixte national
        duration = (distance / 45.0) * 60.0;
        if (duration < 5) duration = 5;
      } else {
        // Valeurs par défaut si le GPS n'est pas encore prêt
        if (hub['name'].toString().contains("Dakar")) {
          distance = 12.0;
          duration = 20.0;
        } else if (hub['name'].toString().contains("Thiès")) {
          distance = 70.0;
          duration = 60.0;
        } else if (hub['name'].toString().contains("Saint-Louis")) {
          distance = 260.0;
          duration = 240.0;
        } else {
          distance = 100.0;
          duration = 90.0;
        }
      }
      
      suggestions.add({
        "name": hub['name'],
        "distance": double.parse(distance.toStringAsFixed(1)),
        "duration": double.parse(duration.toStringAsFixed(0)),
        "latitude": hub['lat'],
        "longitude": hub['lng'],
      });
    }
    
    // Trier les propositions pour afficher d'abord les villes les plus proches de l'utilisateur !
    suggestions.sort((a, b) => (a['distance'] as double).compareTo(b['distance'] as double));
    
    setState(() {
      _filteredSuggestions = suggestions;
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double r = 6371; // Earth radius in km
    final double dLat = _toRadians(lat2 - lat1);
    final double dLon = _toRadians(lon2 - lon1);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(lat1)) * math.cos(_toRadians(lat2)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  double _toRadians(double degree) {
    return degree * math.pi / 180;
  }

  Future<void> _fetchMapboxSuggestions(String query) async {
    if (query.isEmpty) {
      _loadDefaultSuggestions();
      return;
    }

    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    
    _debounceTimer = Timer(const Duration(milliseconds: 400), () async {
      try {
        final Map<String, dynamic> queryParams = {
          'access_token': _mapboxToken,
          'country': 'SN',
          'language': 'fr',
          'types': 'poi,address,neighborhood,locality',
          'limit': 5,
        };

        if (widget.userLongitude != null && widget.userLatitude != null) {
          queryParams['proximity'] = '${widget.userLongitude},${widget.userLatitude}';
        }

        final response = await _mapboxDio.get(
          'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(query)}.json',
          queryParameters: queryParams,
        );

        if (response.statusCode == 200 && response.data != null) {
          final features = response.data['features'] as List;
          final List<Map<String, dynamic>> newSuggestions = [];

          for (var feat in features) {
            final placeName = feat['place_name'] as String;
            final geometry = feat['geometry'] as Map<String, dynamic>;
            final coordinates = geometry['coordinates'] as List;
            final double destLng = (coordinates[0] as num).toDouble();
            final double destLat = (coordinates[1] as num).toDouble();

            double distance = 10.0;
            double duration = 15.0;

            if (widget.userLongitude != null && widget.userLatitude != null) {
              distance = _calculateDistance(
                widget.userLatitude!,
                widget.userLongitude!,
                destLat,
                destLng,
              );
              // Estimating duration assuming avg 30 km/h in Dakar traffic
              duration = (distance / 30.0) * 60.0;
              if (duration < 3) duration = 3;
            }

            newSuggestions.add({
              "name": placeName,
              "distance": double.parse(distance.toStringAsFixed(1)),
              "duration": double.parse(duration.toStringAsFixed(0)),
              "latitude": destLat,
              "longitude": destLng,
            });
          }

          setState(() {
            _filteredSuggestions = newSuggestions;
          });
        }
      } catch (e) {
        debugPrint("Error querying Mapbox Geocoding: $e");
      }
    });
  }

  void _onDestinationSearch(String query) {
    _fetchMapboxSuggestions(query);
  }

  Future<void> _fetchPricingEstimations(double distance, double duration) async {
    setState(() {
      _isLoadingPrices = true;
      _pricingEstimations = [];
    });

    try {
      final response = await ApiClient().dio.get(
        '/api/vtc/calculate-price',
        queryParameters: {
          'distanceKm': distance,
          'durationMinutes': duration,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        setState(() {
          _pricingEstimations = List<Map<String, dynamic>>.from(response.data);
          _isLoadingPrices = false;
        });
      } else {
        throw Exception("Impossible de charger les tarifs");
      }
    } catch (e) {
      debugPrint("Error loading VTC pricing: $e");
      setState(() {
        _isLoadingPrices = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur de tarification : $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _selectRoute(Map<String, dynamic> route) {
    HapticFeedback.selectionClick();
    final destName = route['name'] as String;
    final distance = route['distance'] as double;
    final duration = route['duration'] as double;

    // Règle métier nationale : courses interrégionales (> 80 km) bloquées en VTC Urbain
    if (distance > 80.0) {
      HapticFeedback.vibrate();
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
              SizedBox(width: 10),
              Text("Course Interrégionale", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          content: const Text(
            "Les trajets entre régions se font exclusivement via le service Interurbain.\n\n"
            "Le service VTC Urbain est réservé aux courses locales au sein d'une même région.\n\n"
            "Veuillez basculer sur l'onglet 'Interurbain' en haut de l'écran pour réserver ce trajet.",
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("COMPRIS", style: TextStyle(color: TranSenColors.primaryGreen, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    _destinationController.text = destName;
    
    setState(() {
      _currentState = VtcSheetState.selectVehicle;
    });

    if (widget.onRouteSelected != null) {
      widget.onRouteSelected!(destName, distance, duration);
    }

    _fetchPricingEstimations(distance, duration);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161616) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 5,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.grey[300],
              borderRadius: BorderRadius.circular(2.5),
            ),
          ),

          AnimatedCrossFade(
            duration: const Duration(milliseconds: 300),
            firstCurve: Curves.easeInOutCubic,
            secondCurve: Curves.easeInOutCubic,
            crossFadeState: _currentState == VtcSheetState.search
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            firstChild: _buildSearchLayout(isDark),
            secondChild: _buildSelectVehicleLayout(isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchLayout(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Où allez-vous ?",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
          const SizedBox(height: 15),
          
          // Saisie Départ & Destination
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Column(
                  children: [
                    const Icon(Icons.my_location, color: TranSenColors.primaryGreen, size: 20),
                    Container(
                      width: 2,
                      height: 30,
                      color: isDark ? Colors.white24 : Colors.grey[300],
                    ),
                    const Icon(Icons.location_on, color: Colors.red, size: 20),
                  ],
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    children: [
                      TextField(
                        controller: _pickupController,
                        readOnly: true,
                        decoration: const InputDecoration(
                          hintText: "Lieu de départ",
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 8),
                        ),
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Divider(color: isDark ? Colors.white10 : Colors.grey[300]),
                      TextField(
                        controller: _destinationController,
                        onChanged: _onDestinationSearch,
                        autofocus: false,
                        decoration: const InputDecoration(
                          hintText: "Saisir la destination",
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 8),
                        ),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          const Text(
            "PROPOSITIONS",
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1),
          ),
          const SizedBox(height: 10),
          
          // Liste de suggestions
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _filteredSuggestions.length,
              itemBuilder: (context, index) {
                final suggestion = _filteredSuggestions[index];
                return ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey[200],
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _destinationController.text.isEmpty ? Icons.history : Icons.location_on_outlined,
                      size: 18,
                      color: _destinationController.text.isEmpty ? Colors.grey : TranSenColors.primaryGreen,
                    ),
                  ),
                  title: Text(
                    suggestion['name'],
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  subtitle: Text(
                    "${suggestion['distance']} km • env. ${suggestion['duration'].toInt()} min",
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  onTap: () => _selectRoute(suggestion),
                  contentPadding: EdgeInsets.zero,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectVehicleLayout(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header avec retour
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _currentState = VtcSheetState.search;
                  });
                },
              ),
              const Expanded(
                child: Text(
                  "Choisissez votre trajet",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Shimmer loading loader
          if (_isLoadingPrices)
            _buildPricingShimmer(isDark)
          else
            Column(
              children: [
                // Liste des gammes de véhicules VTC
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _pricingEstimations.length,
                  itemBuilder: (context, index) {
                    final estimation = _pricingEstimations[index];
                    final String vehicleClass = estimation['vehicleClass'];
                    final String displayName = estimation['displayName'];
                    final double price = (estimation['price'] as num).toDouble();
                    final isSelected = vehicleClass == _selectedVehicleClass;

                    IconData vehicleIcon = Icons.directions_car;
                    String desc = "Rapide et économique";
                    if (vehicleClass == "CONFORT") {
                      vehicleIcon = Icons.airport_shuttle;
                      desc = "Véhicule climatisé et spacieux";
                    } else if (vehicleClass == "VIP") {
                      vehicleIcon = Icons.local_taxi;
                      desc = "Service haut de gamme premium";
                    }

                    return InkWell(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedVehicleClass = vehicleClass;
                        });
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? TranSenColors.primaryGreen.withValues(alpha: isDark ? 0.15 : 0.08)
                              : (isDark ? Colors.white.withValues(alpha: 0.02) : Colors.grey[50]),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? TranSenColors.primaryGreen
                                : (isDark ? Colors.white10 : Colors.grey[200]!),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? TranSenColors.primaryGreen.withValues(alpha: 0.2)
                                    : (isDark ? Colors.white10 : Colors.grey[200]),
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: Icon(
                                vehicleIcon,
                                color: isSelected ? TranSenColors.primaryGreen : Colors.grey,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    displayName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    desc,
                                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              "${price.toInt()} F",
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                                color: isSelected ? TranSenColors.primaryGreen : (isDark ? Colors.white : Colors.black87),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 10),
                Divider(color: isDark ? Colors.white10 : Colors.grey[300]),
                // Moyen de paiement à bord
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(
                            _selectedPaymentMethod == "CASH" ? Icons.payments_outlined : Icons.phone_android_outlined,
                            color: TranSenColors.primaryGreen,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedPaymentMethod == "CASH" ? "Espèces (Direct au chauffeur)" : "Mobile Money (Wave / OM direct)",
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _selectedPaymentMethod == "CASH"
                                      ? "Payez en cash à la fin du trajet"
                                      : "Transférez sur le numéro du chauffeur à l'arrivée",
                                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _selectedPaymentMethod = _selectedPaymentMethod == "CASH" ? "MOBILE_MONEY" : "CASH";
                        });
                      },
                      child: const Text(
                        "Modifier",
                        style: TextStyle(color: TranSenColors.primaryGreen, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 15),
 
                // Bouton principal Commander
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isOrdering ? null : () async {
                      HapticFeedback.mediumImpact();
                      setState(() {
                        _isOrdering = true;
                      });

                      try {
                        final auth = ref.read(authProvider);
                        final userId = auth?.userId ?? '';
                        if (userId.isEmpty) {
                          throw Exception("Utilisateur non connecté.");
                        }

                        // Charger les informations détaillées de l'utilisateur
                        final firestore = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');
                        final userDataSnapshot = await firestore.collection('users').doc(userId).get();
                        final userData = userDataSnapshot.data();

                        final String userName = userData?['name'] ?? "Client ${userId.substring(0, 5)}";
                        final String userPhone = userData?['phone'] ?? (userData?['phoneNumber'] ?? (auth?.phone ?? ''));

                        final selectedEstimation = _pricingEstimations.firstWhere(
                          (est) => est['vehicleClass'] == _selectedVehicleClass,
                          orElse: () => {"price": 0.0},
                        );
                        final double price = (selectedEstimation['price'] as num).toDouble();

                        final scheduledDateStr = "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year} ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}";

                        // Appeler le repository pour créer et enregistrer la course
                        final tripRepo = ref.read(tripRepositoryProvider);
                        await tripRepo.createTrip(TripModel(
                          id: '',
                          departure: _pickupController.text,
                          destination: _destinationController.text,
                          type: 'Course Urbaine VTC',
                          price: price,
                          status: 'pending',
                          createdAt: DateTime.now(),
                          scheduledDate: scheduledDateStr,
                          clientName: userName,
                          clientPhone: userPhone,
                          clientId: userId,
                          paymentMethod: _selectedPaymentMethod,
                          departureLat: widget.userLatitude ?? 14.7167,
                          departureLng: widget.userLongitude ?? -17.4677,
                          routingType: 'PUBLIC', // Visible par tous les chauffeurs
                        ));

                        setState(() {
                          _isOrdering = false;
                        });

                        if (!mounted) return;

                        // Simulation / Alerte de confirmation avec règlement en direct
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (context) => AlertDialog(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            title: const Row(
                              children: [
                                Icon(Icons.check_circle_outline, color: TranSenColors.primaryGreen, size: 28),
                                SizedBox(width: 10),
                                Text("Course Commandée !", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              ],
                            ),
                            content: Text(
                              "Votre demande de course en TranSen $_selectedVehicleClass a bien été enregistrée.\n\n"
                              "Recherche d'un chauffeur à proximité...\n\n"
                              "💳 Tarif estimé : ${price.toInt()} F CFA\n"
                              "🤝 Règlement en direct : Le paiement se fera à bord à l'arrivée, directement auprès du chauffeur par ${_selectedPaymentMethod == "CASH" ? "espèces" : "Mobile Money (Wave / OM)"}.",
                              style: const TextStyle(fontSize: 14),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  setState(() {
                                    _currentState = VtcSheetState.search;
                                    _destinationController.clear();
                                    _loadDefaultSuggestions();
                                  });
                                  if (widget.onBackToHome != null) {
                                    widget.onBackToHome!();
                                  }
                                },
                                child: const Text("OK", style: TextStyle(color: TranSenColors.primaryGreen, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        );
                      } catch (e) {
                        setState(() {
                          _isOrdering = false;
                        });
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Erreur lors de la création de la course : $e"), backgroundColor: Colors.red),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: TranSenColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      elevation: 0,
                    ),
                    child: _isOrdering
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            "COMMANDER MA COURSE",
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5),
                          ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildPricingShimmer(bool isDark) {
    return Column(
      children: List.generate(3, (index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: PulseContainer(
          height: 80,
          borderRadius: 20,
        ),
      )),
    );
  }
}

class PulseContainer extends StatefulWidget {
  final double height;
  final double width;
  final double borderRadius;

  const PulseContainer({
    super.key,
    required this.height,
    this.width = double.infinity,
    this.borderRadius = 8,
  });

  @override
  State<PulseContainer> createState() => _PulseContainerState();
}

class _PulseContainerState extends State<PulseContainer> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 0.8).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return FadeTransition(
      opacity: _animation,
      child: Container(
        height: widget.height,
        width: widget.width,
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey[300],
          borderRadius: BorderRadius.circular(widget.borderRadius),
        ),
      ),
    );
  }
}
