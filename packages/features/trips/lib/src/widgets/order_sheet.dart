
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_trips/transen_trips.dart' as providers;
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';

class OrderSheet extends ConsumerStatefulWidget {
  final String? initialDeparture;
  final String? initialDestination;
  final String? driverId;

  const OrderSheet({
    super.key,
    this.initialDeparture,
    this.initialDestination,
    this.driverId,
  });

  /// Affiche le panneau coulissant (BottomSheet) depuis n'importe où
  static void show(
    BuildContext context, {
    String? departure,
    String? destination,
    String? driverId,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.3),
      builder: (context) => GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {},
        child: Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: OrderSheet(
            initialDeparture: departure,
            initialDestination: destination,
            driverId: driverId,
          ),
        ),
      ),
    );
  }

  @override
  ConsumerState<OrderSheet> createState() => _OrderSheetState();
}

class _OrderSheetState extends ConsumerState<OrderSheet> {
  String _selectedVehicle = 'Voiture 4 places';
  String? _selectedDeparture;
  String? _selectedDestination;
  int _selectedSeats = 1;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  String _paymentMethod = 'Espèces'; // Par défaut
  bool _isProcessing = false;

  final _customDepartureController = TextEditingController();
  final _customDestinationController = TextEditingController();
  double? _preciseDepartureLat;
  double? _preciseDepartureLng;
  bool _isLoadingLocation = false;

  List<Map<String, dynamic>> _departureSuggestions = [];
  List<Map<String, dynamic>> _destinationSuggestions = [];
  bool _isSearchingDeparture = false;
  bool _isSearchingDestination = false;
  Timer? _debounceTimer;

  @override
  void dispose() {
    _customDepartureController.dispose();
    _customDestinationController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchSuggestions(String query, bool isDeparture) async {
    if (query.trim().isEmpty) {
      setState(() {
        if (isDeparture) {
          _departureSuggestions = [];
        } else {
          _destinationSuggestions = [];
        }
      });
      return;
    }

    setState(() {
      if (isDeparture) {
        _isSearchingDeparture = true;
      } else {
        _isSearchingDestination = true;
      }
    });

    try {
      final dio = Dio();
      final encodedQuery = Uri.encodeComponent(query);
      const token = LocationHelper.mapboxToken;
      final url = "https://api.mapbox.com/geocoding/v5/mapbox.places/$encodedQuery.json?access_token=$token&country=sn&types=address,poi,neighborhood,locality&language=fr&limit=5";
      
      final response = await dio.get(url);
      if (response.statusCode == 200) {
        final data = response.data;
        final features = data['features'] as List?;
        if (features != null) {
          final List<Map<String, dynamic>> results = [];
          for (var item in features) {
            final placeName = item['place_name'] as String?;
            final center = item['center'] as List?;
            if (placeName != null && center != null && center.length >= 2) {
              results.add({
                'name': placeName,
                'lng': center[0] as double,
                'lat': center[1] as double,
              });
            }
          }

          if (mounted) {
            setState(() {
              if (isDeparture) {
                _departureSuggestions = results;
              } else {
                _destinationSuggestions = results;
              }
            });
          }
        }
      }
    } catch (e) {
      debugPrint("Mapbox Geocoding Autocomplete error: $e");
    } finally {
      if (mounted) {
        setState(() {
          if (isDeparture) {
            _isSearchingDeparture = false;
          } else {
            _isSearchingDestination = false;
          }
        });
      }
    }
  }

  Future<String?> _reverseGeocode(double lat, double lng) async {
    try {
      final dio = Dio();
      dio.options.headers['User-Agent'] = 'TranSenMobileApp/1.0';
      final url = "https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json&accept-language=fr";
      final response = await dio.get(url);
      if (response.statusCode == 200) {
        final data = response.data;
        final address = data['address'] as Map<String, dynamic>?;
        if (address != null) {
          final locality = address['suburb'] ?? address['neighbourhood'] ?? address['town'] ?? address['village'] ?? address['city'] ?? address['county'];
          if (locality != null) return locality.toString();
        }
      }
    } catch (e) {
      debugPrint("Reverse geocoding error: $e");
    }
    return null;
  }

  Future<void> _getCurrentLocationForDeparture() async {
    setState(() => _isLoadingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );
        _preciseDepartureLat = pos.latitude;
        _preciseDepartureLng = pos.longitude;

        final detectedRegion = LocationHelper.detectRegion(pos);

        final preciseZone = await _reverseGeocode(pos.latitude, pos.longitude);
        if (preciseZone != null && preciseZone.isNotEmpty) {
          setState(() {
            _selectedDeparture = 'Autre (Saisir manuellement)...';
            _customDepartureController.text = "$preciseZone, $detectedRegion";
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Position détectée: $preciseZone ($detectedRegion)"), backgroundColor: TranSenColors.primaryGreen),
            );
          }
        } else {
          setState(() {
            _selectedDeparture = detectedRegion;
          });
        }
      }
    } catch (e) {
      debugPrint("Error detecting position: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  TimeOfDay _roundToNearest15Mins(TimeOfDay time) {
    int minute = time.minute;
    int roundedMinute = (minute / 15).round() * 15;
    int hour = time.hour;
    if (roundedMinute == 60) {
      roundedMinute = 0;
      hour = (hour + 1) % 24;
    }
    return TimeOfDay(hour: hour, minute: roundedMinute);
  }

  DateTime _parseDate(String d) {
    try {
      final parts = d.split(' ');
      final dateParts = parts[0].split('/');
      final timeParts = parts[1].split(':');
      return DateTime(int.parse(dateParts[2]), int.parse(dateParts[1]), int.parse(dateParts[0]), int.parse(timeParts[0]), int.parse(timeParts[1]));
    } catch (_) {
      return DateTime.now();
    }
  }

  String? _preferredDriverName;
  String? _preferredDriverId;

  @override
  void initState() {
    super.initState();
    _selectedTime = _roundToNearest15Mins(TimeOfDay.now());
    _selectedDeparture = widget.initialDeparture;
    _selectedDestination = widget.initialDestination;
    _preferredDriverId = widget.driverId;
    
    if (_preferredDriverId != null) {
      _fetchDriverName();
    }

    if (_selectedDeparture == null) {
      _autoDetectLocation();
    }
  }

  Future<void> _fetchDriverName() async {
    try {
      final doc = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('users').doc(widget.driverId).get();
      if (doc.exists && mounted) {
        setState(() {
          _preferredDriverName = doc.data()?['name'] ?? doc.data()?['firstName'] ?? 'Chauffeur favori';
        });
      }
    } catch (e) {
      debugPrint("Erreur fetch driver name: $e");
    }
  }

  Future<void> _autoDetectLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.low,
            timeLimit: Duration(seconds: 5),
          ),
        );
        final region = LocationHelper.detectRegion(pos);
        if (mounted) {
          setState(() => _selectedDeparture = region);
        }
      }
    } catch (e) {
      debugPrint("Erreur auto-detection: $e");
    }
  }


  // Liste des 14 régions du Sénégal
  final List<String> _regions = [
    'Dakar',
    'Diourbel',
    'Fatick',
    'Kaffrine',
    'Kaolack',
    'Kédougou',
    'Kolda',
    'Louga',
    'Matam',
    'Saint-Louis',
    'Sédhiou',
    'Tambacounda',
    'Thiès',
    'Ziguinchor',
    'Autre (Saisir manuellement)...',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Petite barre horizontale au dessus pour indiquer qu'on peut glisser vers le bas
            Center(
              child: Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),

            // Titre du formulaire
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                const Expanded(
                  child: Text(
                    'Où allez-vous ? (Paiement Espèces)',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48), // Pour équilibrer le titre
              ],
            ),
            const SizedBox(height: 20),
            if (_preferredDriverName != null)
              Container(
                margin: const EdgeInsets.only(bottom: 15),
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        "Chauffeur favori : $_preferredDriverName",
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() {
                        _preferredDriverName = null;
                        _preferredDriverId = null;
                      }),
                    ),
                  ],
                ),
              ),
            // Liste déroulante : Point de départ
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      hintText: 'Région de départ',
                      prefixIcon: const Icon(Icons.my_location, color: Colors.blue),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                    ),
                    initialValue: _selectedDeparture,
                    icon: const Icon(Icons.arrow_drop_down),
                    isExpanded: true,
                    items: _regions.map((region) {
                      return DropdownMenuItem(
                        value: region,
                        child: Text(region),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedDeparture = value;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _isLoadingLocation ? null : _getCurrentLocationForDeparture,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.3)),
                    ),
                    child: _isLoadingLocation
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation(TranSenColors.primaryGreen),
                            ),
                          )
                        : const Icon(Icons.my_location, color: TranSenColors.primaryGreen),
                  ),
                ),
              ],
            ),
            if (_selectedDeparture == 'Autre (Saisir manuellement)...') ...[
              const SizedBox(height: 10),
              TextField(
                controller: _customDepartureController,
                decoration: InputDecoration(
                  hintText: 'Saisissez votre zone de départ (ex: Mbour)',
                  prefixIcon: const Icon(Icons.edit_location_alt_rounded, color: Colors.blueAccent),
                  suffixIcon: _isSearchingDeparture
                      ? const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                ),
                onChanged: (value) {
                  _debounceTimer?.cancel();
                  _debounceTimer = Timer(const Duration(milliseconds: 300), () {
                    _fetchSuggestions(value, true);
                  });
                },
              ),
              if (_departureSuggestions.isNotEmpty) ...[
                const SizedBox(height: 5),
                Container(
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.light ? Colors.white : Colors.grey[900],
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const ClampingScrollPhysics(),
                    padding: EdgeInsets.zero,
                    itemCount: _departureSuggestions.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final suggestion = _departureSuggestions[index];
                      return ListTile(
                        leading: const Icon(Icons.location_on_outlined, color: TranSenColors.primaryGreen),
                        title: Text(
                          suggestion['name'],
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        onTap: () {
                          setState(() {
                            _customDepartureController.text = suggestion['name'];
                            _preciseDepartureLat = suggestion['lat'];
                            _preciseDepartureLng = suggestion['lng'];
                            _departureSuggestions = [];
                          });
                          FocusScope.of(context).unfocus();
                        },
                      );
                    },
                  ),
                ),
              ],
            ],
            const SizedBox(height: 15),

            // --- FAVORIS RAPIDES ---
            Consumer(builder: (context, ref, child) {
              final auth = ref.watch(authProvider);
              final favoritesAsync = ref.watch(favoriteAddressesProvider(auth?.userId ?? ''));
              
              return favoritesAsync.when(
                data: (favs) {
                  if (favs.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Favoris", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 5),
                      SizedBox(
                        height: 35,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: favs.length,
                          itemBuilder: (context, index) {
                            final fav = favs[index];
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ActionChip(
                                avatar: Icon(fav.icon, size: 14, color: TranSenColors.primaryGreen),
                                label: Text(fav.label, style: const TextStyle(fontSize: 11)),
                                onPressed: () => setState(() => _selectedDestination = fav.address),
                                backgroundColor: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: EdgeInsets.zero,
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 15),
                    ],
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              );
            }),

            // Liste déroulante : Destination
            DropdownButtonFormField<String>(
              decoration: InputDecoration(
                hintText: 'Région de destination',
                prefixIcon: const Icon(Icons.location_on, color: Colors.red),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
              ),
              initialValue: _selectedDestination,
              icon: const Icon(Icons.arrow_drop_down),
              isExpanded: true,
              items: _regions.map((region) {
                return DropdownMenuItem(
                  value: region,
                  child: Text(region),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedDestination = value;
                });
              },
            ),
            if (_selectedDestination == 'Autre (Saisir manuellement)...') ...[
              const SizedBox(height: 10),
              TextField(
                controller: _customDestinationController,
                decoration: InputDecoration(
                  hintText: 'Saisissez votre zone de destination (ex: Mboro)',
                  prefixIcon: const Icon(Icons.edit_location_alt_rounded, color: Colors.redAccent),
                  suffixIcon: _isSearchingDestination
                      ? const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                ),
                onChanged: (value) {
                  _debounceTimer?.cancel();
                  _debounceTimer = Timer(const Duration(milliseconds: 300), () {
                    _fetchSuggestions(value, false);
                  });
                },
              ),
              if (_destinationSuggestions.isNotEmpty) ...[
                const SizedBox(height: 5),
                Container(
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.light ? Colors.white : Colors.grey[900],
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const ClampingScrollPhysics(),
                    padding: EdgeInsets.zero,
                    itemCount: _destinationSuggestions.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final suggestion = _destinationSuggestions[index];
                      return ListTile(
                        leading: const Icon(Icons.location_on_outlined, color: Colors.redAccent),
                        title: Text(
                          suggestion['name'],
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        onTap: () {
                          setState(() {
                            _customDestinationController.text = suggestion['name'];
                            _destinationSuggestions = [];
                          });
                          FocusScope.of(context).unfocus();
                        },
                      );
                    },
                  ),
                ),
              ],
            ],
            const SizedBox(height: 15),

            // --- LOGIQUE DE POOLING VISUELLE ---
            if (_selectedDeparture != null && _selectedDestination != null)
              Consumer(
                builder: (context, ref, child) {
                  final poolsAsync = ref.watch(activePoolsProvider);
                  return poolsAsync.when(
                    data: (pools) {
                      final reqDate = _parseDate("${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}");
                      
                      final existingPool = pools.where((p) {
                        if (p.departure != _selectedDeparture || p.destination != _selectedDestination || p.status != 'open') return false;
                        final poolDate = _parseDate(p.scheduledDate);
                        return poolDate.difference(reqDate).inMinutes.abs() <= 30 && p.currentFilling < 4;
                      }).firstOrNull;

                      final currentFilling = existingPool?.currentFilling ?? 0;
                      final estMinutes = (4 - currentFilling) * 15;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: TranSenColors.primaryGreen.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.2)),

                        ),
                        child: Column(
                          children: [
                            PoolProgressIndicator(
                              current: currentFilling,
                              estimatedDeparture: "Départ estimé dans ~$estMinutes min",
                            ),
                            const SizedBox(height: 10),
                            Text(
                              existingPool != null 
                                ? "Groupe trouvé ! Rejoignez-le pour partir plus vite." 
                                : "Aucun groupe en cours. Soyez le premier à lancer ce trajet !",
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                              textAlign: TextAlign.center,
                            ),
                            if (existingPool != null) ...[
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _isProcessing ? null : () => _handleConfirmation(ref, overrideDate: existingPool.scheduledDate),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: TranSenColors.primaryGreen,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 4,
                                ),
                                child: const Text(
                                  "REJOINDRE CE GROUPE", 
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                  );
                },
              ),

            // Nouveau : Nombre de places
            Row(
              children: [
                const Icon(Icons.groups, color: Colors.grey),
                const SizedBox(width: 10),
                const Text('Places à prendre :', style: TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                DropdownButton<int>(
                  value: _selectedSeats,
                  items: [1, 2, 3, 4].map((i) => DropdownMenuItem(value: i, child: Text('$i'))).toList(),
                  onChanged: (val) => setState(() => _selectedSeats = val!),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Nouveau : Date et Heure souhaitées
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 1)),
                      );
                      if (date != null) setState(() => _selectedDate = date);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month, color: TranSenColors.primaryGreen, size: 20),

                          const SizedBox(width: 8),
                          Text('${_selectedDate.day}/${_selectedDate.month}', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: _selectedTime,
                      );
                      if (time != null) {
                        setState(() => _selectedTime = _roundToNearest15Mins(time));
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.light ? Colors.grey[100] : Colors.grey[850],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time, color: TranSenColors.primaryGreen, size: 20),

                          const SizedBox(width: 8),
                          Text(_selectedTime.format(context), style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Sélection du type de véhicule
            const Text(
              'Type de véhicule',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildVehicleOption(
                    'Voiture 4 places',
                    Icons.local_taxi,
                    _selectedVehicle == 'Voiture 4 places',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Sélection du mode de paiement
            const Text(
              'Mode de paiement (Remise espèces au chauffeur)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                   _buildPaymentIconTile('Espèces', null, Colors.green),
                   const SizedBox(width: 10),
                   _buildPaymentIconTile('Wave', 'assets/images/wave.png', Colors.blue),
                   const SizedBox(width: 10),
                   _buildPaymentIconTile('Orange Money', 'assets/images/om.png', Colors.orange),
                   const SizedBox(width: 10),
                   _buildPaymentIconTile('Free Money', 'assets/images/fm.png', Colors.red),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const SizedBox(height: 10),


            Consumer(builder: (context, ref, child) {
              final activePool = ref.watch(providers.activePoolProvider).value;
              final hasActivePool = activePool != null;

              return ElevatedButton(
                onPressed: (_selectedDeparture != null && _selectedDestination != null && !_isProcessing)
                    ? () => _handleConfirmation(ref, hasActivePool: hasActivePool)
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: hasActivePool ? Colors.grey : TranSenColors.primaryGreen,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 8,
                  shadowColor: TranSenColors.primaryGreen.withValues(alpha: 0.5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      hasActivePool ? 'COURSE DÉJÀ EN COURS' : 'REJOINDRE LE TRAJET  • ',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (_isProcessing)
                      const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    else if (!hasActivePool)
                      const Text(
                        '10000 FCFA',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Future<void> _handleConfirmation(WidgetRef ref, {bool hasActivePool = false, String? overrideDate}) async {
    if (hasActivePool) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Vous avez déjà une course en cours. Terminez-la ou attendez avant d'en créer une nouvelle."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final auth = ref.read(authProvider);
    final userId = auth?.userId ?? '';
    
    try {
      setState(() => _isProcessing = true);
      final userData = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(userId).get();
      final data = userData.data();
      String phoneToValidate = data?['phone'] ?? (data?['phoneNumber'] ?? (auth?.phone ?? ''));
      final userPhoneDigits = phoneToValidate.replaceAll(RegExp(r'\D'), '');
      
      if (!mounted) return;
      
      // Validation : au moins 9 chiffres (format Sénégal)
      if (userPhoneDigits.length < 9) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Numéro de téléphone incomplet (9 chiffres requis)."),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isProcessing = false);
        return;
      }

      final userFirstName = userData.data()?['firstName'];
      final userLastName = userData.data()?['lastName'];
      final userName = userData.data()?['name'] ?? "Client ${userId.substring(0, 5)}";
      
      // On s'assure d'avoir les 9 chiffres propres
      String finalPhone = userPhoneDigits;
      if (finalPhone.startsWith('221') && finalPhone.length >= 12) {
        finalPhone = finalPhone.substring(3);
      }

      // Gestion SenePay reportée à l'écran de suivi
      if (_paymentMethod != 'Espèces' && _paymentMethod != 'Portefeuille') {
        // On enregistre juste l'intention de paiement
        await Future.delayed(const Duration(milliseconds: 500));
      }

      final finalDeparture = _selectedDeparture == 'Autre (Saisir manuellement)...'
          ? _customDepartureController.text.trim()
          : _selectedDeparture!;
      final finalDestination = _selectedDestination == 'Autre (Saisir manuellement)...'
          ? _customDestinationController.text.trim()
          : _selectedDestination!;

      if (finalDeparture.isEmpty || finalDestination.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Veuillez saisir les zones de départ et de destination."),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isProcessing = false);
        return;
      }

      final tripRepo = ref.read(tripRepositoryProvider);
      final scheduledDate = overrideDate ?? "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}";
      
      int finalPrice = 10000;

      double lat = _preciseDepartureLat ?? 14.7167; 
      double lng = _preciseDepartureLng ?? -17.4677;
      if (_preciseDepartureLat == null || _preciseDepartureLng == null) {
        try {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
              timeLimit: Duration(seconds: 3),
            ),
          );
          lat = pos.latitude;
          lng = pos.longitude;
        } catch (e) {
          debugPrint("Erreur localisation: $e");
        }
      }

      final poolId = await tripRepo.joinOrCreatePool(
        userId: userId,
        departure: finalDeparture,
        destination: finalDestination,
        scheduledDate: scheduledDate,
        lat: lat,
        lng: lng,
        seats: _selectedSeats,
        preferredDriverId: _preferredDriverId,
        userDetails: {
          'name': userName,
          'firstName': userFirstName,
          'lastName': userLastName,
          'phone': finalPhone,
          'paymentMethod': _paymentMethod,
        },
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);
      
      final navigator = Navigator.of(context);
      navigator.pop();
      
      SuccessDialog.show(
        context,
        title: 'Demande enregistrée !',
        message: 'Votre départ sera confirmé dès que le groupe sera complet.',
        onDismiss: () {
          navigator.push(MaterialPageRoute(
            builder: (_) => ReceiptScreen(
              orderId: 'POOL-${poolId.substring(0, 5).toUpperCase()}',
              departure: finalDeparture,
              destination: finalDestination,
              price: '$finalPrice FCFA',
              type: 'Covoiturage Intelligent',
              tripId: poolId,
            ),
          ));
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red),
        );
      }
    }
  }


  Widget _buildPaymentIconTile(String name, String? assetPath, Color color) {
    final isSelected = _paymentMethod == name;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        setState(() => _paymentMethod = name);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.1) : (isDark ? Colors.grey[850] : Colors.grey[100]),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: isSelected ? color : Colors.transparent, width: 2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (assetPath != null)
              Image.asset(assetPath, width: 24, height: 24, errorBuilder: (_, __, ___) => Icon(Icons.payment, color: color, size: 20))
            else
              Icon(Icons.payments, color: isSelected ? color : Colors.grey, size: 20),
            const SizedBox(width: 8),
            Text(
              name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? color : (isDark ? Colors.white70 : Colors.black87),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget personnalisé pour les options de véhicule
  Widget _buildVehicleOption(String title, IconData icon, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedVehicle = title;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? TranSenColors.primaryGreen.withValues(alpha: isSelected ? (Theme.of(context).brightness == Brightness.light ? 0.05 : 0.15) : 1) 
              : Theme.of(context).colorScheme.surface,
          border: Border.all(
            color: isSelected ? TranSenColors.accentGold : (Theme.of(context).brightness == Brightness.light ? Colors.grey.shade200 : Colors.grey.shade800),
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected ? [
            BoxShadow(
              color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ] : [],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: isSelected ? TranSenColors.primaryGreen : (Theme.of(context).brightness == Brightness.light ? Colors.grey.shade600 : Colors.grey.shade400),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isSelected ? TranSenColors.primaryGreen : (Theme.of(context).brightness == Brightness.light ? Colors.grey.shade800 : Colors.grey.shade400),

                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
