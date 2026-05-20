
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_trips/transen_trips.dart' as providers;
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';


class YobanteSheet extends ConsumerStatefulWidget {
  final String? initialDeparture;
  final String? initialDestination;

  const YobanteSheet({
    super.key,
    this.initialDeparture,
    this.initialDestination,
  });

  static void show(BuildContext context, {String? departure, String? destination}) {
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
          child: YobanteSheet(
            initialDeparture: departure,
            initialDestination: destination,
          ),
        ),
      ),
    );
  }

  @override
  ConsumerState<YobanteSheet> createState() => _YobanteSheetState();
}

class _YobanteSheetState extends ConsumerState<YobanteSheet> {
  String? _selectedDeparture;
  String? _selectedDestination;

  final _baggageController = TextEditingController();
  final _senderPhoneController = TextEditingController();
  final _receiverPhoneController = TextEditingController();
  final _userPhoneController = TextEditingController();
  
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

  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  String _paymentMethod = 'Espèces';
  bool _isProcessing = false;

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

        // Auto-detect general region as helper
        String detectedRegion = 'Dakar';
        if (pos.latitude > 15.0) {
          detectedRegion = 'Saint-Louis';
        } else if (pos.longitude > -16.5) {
          detectedRegion = 'Thiès';
        }

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
  void initState() {
    super.initState();
    _selectedTime = _roundToNearest15Mins(TimeOfDay.now());
    _selectedDeparture = widget.initialDeparture;
    _selectedDestination = widget.initialDestination;
    
    if (_selectedDeparture == null) {
      _autoDetectLocation();
    }
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final fbUser = FirebaseAuth.instance.currentUser;
      String? phone = fbUser?.phoneNumber;

      if (phone == null || phone.isEmpty) {
        final auth = ref.read(authProvider);
        if (auth?.phone != null && auth!.phone!.isNotEmpty) {
          phone = auth.phone;
        } else if (auth?.userId != null) {
          try {
            final doc = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
                .collection('users')
                .doc(auth!.userId)
                .get();
            final data = doc.data();
            if (data != null && data['phone'] != null) {
              phone = data['phone'];
            }
          } catch (_) {}
        }
      }

      if (phone != null && phone.isNotEmpty && mounted) {
        setState(() {
          _senderPhoneController.text = phone!;
        });
      }
    });
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
            Center(
              child: Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                Expanded(
                  child: Text(
                    'Yobanté (Paiement Espèces) 📦',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48), // Pour équilibrer le titre
              ],
            ),
            const SizedBox(height: 20),
            // Départ
            Row(
              children: [
                Expanded(
                  child: _buildDropdown(
                      'Région de récupération',
                      Icons.outbox,
                      Colors.blue,
                      _selectedDeparture,
                      (val) => setState(() => _selectedDeparture = val)),
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
                  hintText: 'Saisissez votre zone de récupération (ex: Mbour)',
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

            // Arrivée
            _buildDropdown(
                'Région de livraison',
                Icons.inbox,
                Colors.red,
                _selectedDestination,
                (val) => setState(() => _selectedDestination = val)),
            if (_selectedDestination == 'Autre (Saisir manuellement)...') ...[
              const SizedBox(height: 10),
              TextField(
                controller: _customDestinationController,
                decoration: InputDecoration(
                  hintText: 'Saisissez votre zone de livraison (ex: Mboro)',
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

            // Téléphones
            _buildTextField(_senderPhoneController,
                'Téléphone de l\'expéditeur', Icons.phone, Colors.blueAccent),
            const SizedBox(height: 10),
            _buildTextField(_receiverPhoneController,
                'Téléphone du destinataire', Icons.phone, Colors.green),
            const SizedBox(height: 10),
            _buildTextField(
              _baggageController,
              'Description des bagages',
              Icons.inventory,
              TranSenColors.primaryGreen,

              keyboardType: TextInputType.text,
            ),
            const SizedBox(height: 15),

            // Date & Heure
            _buildDateTimePickers(),
            const SizedBox(height: 15),



            _buildPhoneFieldIfNeeded(),
            const SizedBox(height: 10),

            // Type de véhicule (optionnel ici mais gardé pour cohérence)
            _buildVehicleOption('Voiture 4 places', Icons.local_taxi, true),
            const SizedBox(height: 20),

            const Text(
              'Mode de paiement (Espèces au chauffeur)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
            const SizedBox(height: 25),

            ElevatedButton(
              onPressed: (_selectedDeparture != null && _selectedDestination != null && !_isProcessing)
                  ? () async {
                      final navigator = Navigator.of(context);
                      try {
                        setState(() => _isProcessing = true);
                        final activeTrip = ref.read(providers.activeTripProvider).value;
                        if (activeTrip != null) {
                          _showSnackBar("Vous avez déjà une livraison en cours. Attendez qu'elle se termine.", Colors.orange);
                          setState(() => _isProcessing = false);
                          return;
                        }

                        final auth = ref.read(authProvider);
                        final userId = auth?.userId ?? '';
                        final userData = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
                            .collection('users')
                            .doc(userId)
                            .get();
                        
                        final data = userData.data();
                        String existingPhone = data?['phone'] ?? (data?['phoneNumber'] ?? (auth?.phone ?? ''));
                        
                        if (existingPhone.isEmpty && _userPhoneController.text.isNotEmpty) {
                          existingPhone = _userPhoneController.text.trim();
                        }

                        final userPhoneDigits = existingPhone.replaceAll(RegExp(r'\D'), '');
                        
                        if (userPhoneDigits.length < 9) {
                          _showSnackBar("Votre numéro de téléphone est incomplet. Veuillez le corriger.", Colors.red);
                          setState(() => _isProcessing = false);
                          return;
                        }

                        // Nettoyage des téléphones expéditeur/destinataire
                        String senderPhone = _senderPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
                        String receiverPhone = _receiverPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');

                        if (senderPhone.length < 9 || receiverPhone.length < 9) {
                          _showSnackBar("Les numéros expéditeur/destinataire doivent avoir 9 chiffres.", Colors.red);
                          setState(() => _isProcessing = false);
                          return;
                        }

                        // Normalisation Sénégal : on ne garde que les 9 chiffres
                        String cleanUserPhone = userPhoneDigits;
                        if (cleanUserPhone.startsWith('221') && cleanUserPhone.length >= 12) {
                          cleanUserPhone = cleanUserPhone.substring(3);
                        }
                        
                        String cleanSenderPhone = senderPhone;
                        if (cleanSenderPhone.startsWith('221') && cleanSenderPhone.length >= 12) {
                          cleanSenderPhone = cleanSenderPhone.substring(3);
                        }
                        
                        String cleanReceiverPhone = receiverPhone;
                        if (cleanReceiverPhone.startsWith('221') && cleanReceiverPhone.length >= 12) {
                          cleanReceiverPhone = cleanReceiverPhone.substring(3);
                        }

                        final finalUserPhone = cleanUserPhone;
                        final finalSenderPhone = cleanSenderPhone;
                        final finalReceiverPhone = cleanReceiverPhone;
                        final userName = userData.data()?['name'] ?? "Client ${userId.substring(0, 5)}";

                        // Gestion SenePay reportée à l'écran de suivi
                        if (_paymentMethod != 'Espèces' && _paymentMethod != 'Portefeuille') {
                          // On enregistre juste l'intention de paiement
                          await Future.delayed(const Duration(milliseconds: 500));
                        }

                        if (_userPhoneController.text.isNotEmpty) {
                          await ref.read(authProvider.notifier).updateUserData(
                              phone: finalUserPhone);
                        }

                        final finalDeparture = _selectedDeparture == 'Autre (Saisir manuellement)...'
                            ? _customDepartureController.text.trim()
                            : _selectedDeparture!;
                        final finalDestination = _selectedDestination == 'Autre (Saisir manuellement)...'
                            ? _customDestinationController.text.trim()
                            : _selectedDestination!;

                        if (finalDeparture.isEmpty || finalDestination.isEmpty) {
                          _showSnackBar("Veuillez saisir les zones de récupération et de livraison.", Colors.red);
                          setState(() => _isProcessing = false);
                          return;
                        }

                        final userPhone = finalUserPhone;
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
                            debugPrint("Erreur localisation Yobante: $e");
                          }
                        }

                        final tripId = await ref
                            .read(tripRepositoryProvider)
                            .createTrip(TripModel(
                              id: '',
                              departure: finalDeparture,
                              destination: finalDestination,
                              type: 'Livraison de colis',
                              price: 5000,
                              status: 'pending',
                              createdAt: DateTime.now(),
                              scheduledDate:
                                  "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}",
                              baggageDescription: _baggageController.text,
                              clientName: userName,
                              clientPhone: userPhone,
                              clientId: userId,
                              senderPhone: finalSenderPhone,
                              receiverPhone: finalReceiverPhone,
                              paymentMethod: _paymentMethod,
                              passengerDetails: {
                                userId: {
                                  'name': userName,
                                  'phone': userPhone,
                                  'lat': lat,
                                  'lng': lng,
                                }
                              },
                            ));

                        if (!context.mounted) return;
                        setState(() => _isProcessing = false);
                        
                        navigator.pop();

                        if (!context.mounted) return;
                        SuccessDialog.show(
                          context,
                          title: 'Livraison programmée !',
                          message: 'Votre colis a été enregistré. Un chauffeur vous contactera bientôt.',
                          onDismiss: () {
                            if (!context.mounted) return;
                            navigator.push(MaterialPageRoute(
                                builder: (_) => ReceiptScreen(
                                  orderId: 'YOB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                                  departure: finalDeparture,
                                  destination: finalDestination,
                                  price: '5 000 FCFA',
                                  type: 'Livraison de colis',
                                  tripId: tripId,
                                ),
                              ));
                            },
                          );
                      } catch (e) {
                        if (mounted) {
                          setState(() => _isProcessing = false);
                          _showSnackBar("Erreur : $e", Colors.red);
                        }
                      }
                    }
                  : null,
              style: _buttonStyle(),
              child: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Confirmer • 5 000 FCFA',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown(String hint, IconData icon, Color color, String? value,
      Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      decoration: _inputDecoration(hint, icon, color),
      initialValue: value,
      items: _regions
          .map((r) => DropdownMenuItem(value: r, child: Text(r)))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildTextField(
      TextEditingController controller, String hint, IconData icon, Color color,
      {TextInputType keyboardType = TextInputType.phone}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: _inputDecoration(hint, icon, color),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon, Color color) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: color),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      filled: true,
      fillColor: Theme.of(context).brightness == Brightness.light
          ? Colors.grey[100]
          : Colors.grey[850],
    );
  }

  Widget _buildDateTimePickers() {
    return Row(
      children: [
        Expanded(
            child: _buildPickerCell(Icons.calendar_month,
                '${_selectedDate.day}/${_selectedDate.month}', () async {
          final d = await showDatePicker(
              context: context,
              initialDate: _selectedDate,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 1)));
          if (d != null) setState(() => _selectedDate = d);
        })),
        const SizedBox(width: 10),
        Expanded(
            child: _buildPickerCell(
                Icons.access_time, _selectedTime.format(context), () async {
          final t = await showTimePicker(
              context: context, initialTime: _selectedTime);
          if (t != null) {
            setState(() => _selectedTime = _roundToNearest15Mins(t));
          }
        })),
      ],
    );
  }

  Widget _buildPickerCell(IconData icon, String text, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.light
              ? Colors.grey[100]
              : Colors.grey[850],
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Icon(icon, color: TranSenColors.primaryGreen, size: 20),

          const SizedBox(width: 8),
          Text(text)
        ]),
      ),
    );
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: TranSenColors.primaryGreen,

      padding: const EdgeInsets.symmetric(vertical: 18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
      elevation: 8,
    );
  }

  void _showSnackBar(String msg, Color color) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  Widget _buildPhoneFieldIfNeeded() {
    final auth = ref.watch(authProvider);
    if (auth == null) return const SizedBox.shrink();

    return FutureBuilder<DocumentSnapshot>(
      future:
          FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(auth.userId).get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox.shrink();
        final data = snapshot.data!.data() as Map<String, dynamic>?;
        if (data?['phone'] != null && (data?['phone'] as String).isNotEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Votre téléphone est obligatoire pour cette opération',
                style:
                    TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
            const SizedBox(height: 5),
            TextField(
                controller: _userPhoneController,
                decoration: _inputDecoration('Votre numéro (ex: 77...)',
                    Icons.phone_android, TranSenColors.primaryGreen)),

          ],
        );
      },
    );
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

  Widget _buildVehicleOption(String title, IconData icon, bool isSelected) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TranSenColors.primaryGreen.withValues(alpha: isDark ? 0.15 : 0.05),
        border: Border.all(color: TranSenColors.primaryGreen, width: 2),

        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: TranSenColors.primaryGreen),

          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: TranSenColors.primaryGreen),

          ),
        ],
      ),
    );
  }
}
