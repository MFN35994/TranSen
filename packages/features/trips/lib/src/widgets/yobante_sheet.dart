import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_payment/transen_payment.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';

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
      barrierColor: Colors.black.withValues(alpha: 0.4),
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
  // Step control: 0 = Route/Details, 1 = Service Channel, 2 = Logistics Company, 3 = Summary/Payment
  int _currentStep = 0;

  // Step 0 variables
  String? _selectedDeparture;
  String? _selectedDestination;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();

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

  // Step 1 variables
  String? _selectedRoutingType; // 'INDEPENDENTS_ONLY', 'COMPANY_ONLY', 'PUBLIC'

  // Step 2 variables
  List<Map<String, dynamic>> _companies = [];
  bool _isLoadingCompanies = false;
  Map<String, dynamic>? _selectedCompany;

  // Step 3 variables
  String _paymentMethod = 'Espèces';
  bool _isProcessing = false;

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
      String? phone;
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

      if (phone != null && phone.isNotEmpty && mounted) {
        setState(() {
          _senderPhoneController.text = phone!;
        });
      }
    });

    _fetchCompanies();
  }

  @override
  void dispose() {
    _customDepartureController.dispose();
    _customDestinationController.dispose();
    _baggageController.dispose();
    _senderPhoneController.dispose();
    _receiverPhoneController.dispose();
    _userPhoneController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchCompanies() async {
    setState(() => _isLoadingCompanies = true);
    try {
      final repo = ref.read(tripRepositoryProvider);
      final list = await repo.getCompanies();
      setState(() {
        _companies = list.where((c) => c['category'] == 'LOGISTICS' || c['category'] == 'BUS_COMPANY').toList();
        _isLoadingCompanies = false;
      });
    } catch (e) {
      debugPrint("Error fetching companies: $e");
      setState(() => _isLoadingCompanies = false);
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: AnimatedSize(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top drag indicator
              Center(
                child: Container(
                  width: 40,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 15),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[800] : Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),

              // Header Row with back arrow
              Row(
                children: [
                  if (_currentStep > 0)
                    IconButton(
                      icon: Icon(Icons.arrow_back_ios, color: isDark ? Colors.white70 : Colors.black87, size: 18),
                      onPressed: () {
                        setState(() {
                          if (_currentStep == 3 && _selectedRoutingType != 'COMPANY_ONLY') {
                            _currentStep = 1;
                          } else {
                            _currentStep--;
                          }
                        });
                      },
                    )
                  else
                    const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _getStepTitle(),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : Colors.black87,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
              const SizedBox(height: 20),

              // Step Content Switcher
              _buildStepContent(isDark),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return "Yobanté Colis 📦";
      case 1:
        return "Canal de Livraison";
      case 2:
        return "Flottes Logistiques";
      case 3:
        return "Récapitulatif & Paiement";
      default:
        return "";
    }
  }

  Widget _buildStepContent(bool isDark) {
    switch (_currentStep) {
      case 0:
        return _buildStep0DetailsSelection(isDark);
      case 1:
        return _buildStep1ChannelSelection(isDark);
      case 2:
        return _buildStep2CompanySelection(isDark);
      case 3:
        return _buildStep3SummaryAndValidation(isDark);
      default:
        return const SizedBox.shrink();
    }
  }

  // --- STEP 0: ROUTE & PARCEL DETAILS ---
  Widget _buildStep0DetailsSelection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Departure dropdown
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  hintText: 'Région de récupération',
                  prefixIcon: const Icon(Icons.outbox, color: Colors.blue),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
                  filled: true,
                  fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
                ),
                initialValue: _selectedDeparture,
                icon: const Icon(Icons.arrow_drop_down),
                isExpanded: true,
                items: _regions.map((region) => DropdownMenuItem(value: region, child: Text(region))).toList(),
                onChanged: (value) => setState(() => _selectedDeparture = value),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _isLoadingLocation ? null : _getCurrentLocationForDeparture,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: _isLoadingLocation
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(TranSenColors.primaryGreen)))
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
              hintText: 'Saisissez l\'adresse exacte de récupération',
              prefixIcon: const Icon(Icons.edit_location_alt_rounded, color: Colors.blueAccent),
              suffixIcon: _isSearchingDeparture
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
              filled: true,
              fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
            ),
            onChanged: (value) {
              _debounceTimer?.cancel();
              _debounceTimer = Timer(const Duration(milliseconds: 300), () => _fetchSuggestions(value, true));
            },
          ),
          if (_departureSuggestions.isNotEmpty) _buildSuggestionsList(_departureSuggestions, true, isDark),
        ],

        const SizedBox(height: 15),

        // Destination dropdown
        DropdownButtonFormField<String>(
          decoration: InputDecoration(
            hintText: 'Région de livraison',
            prefixIcon: const Icon(Icons.inbox, color: Colors.red),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
            filled: true,
            fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
          ),
          initialValue: _selectedDestination,
          icon: const Icon(Icons.arrow_drop_down),
          isExpanded: true,
          items: _regions.map((region) => DropdownMenuItem(value: region, child: Text(region))).toList(),
          onChanged: (value) => setState(() => _selectedDestination = value),
        ),

        if (_selectedDestination == 'Autre (Saisir manuellement)...') ...[
          const SizedBox(height: 10),
          TextField(
            controller: _customDestinationController,
            decoration: InputDecoration(
              hintText: 'Saisissez l\'adresse exacte de livraison',
              prefixIcon: const Icon(Icons.edit_location_alt_rounded, color: Colors.redAccent),
              suffixIcon: _isSearchingDestination
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
              filled: true,
              fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
            ),
            onChanged: (value) {
              _debounceTimer?.cancel();
              _debounceTimer = Timer(const Duration(milliseconds: 300), () => _fetchSuggestions(value, false));
            },
          ),
          if (_destinationSuggestions.isNotEmpty) _buildSuggestionsList(_destinationSuggestions, false, isDark),
        ],

        const SizedBox(height: 15),

        // Senders / Receivers Phone
        _buildTextField(_senderPhoneController, 'Téléphone de l\'expéditeur', Icons.phone, Colors.blueAccent),
        const SizedBox(height: 10),
        _buildTextField(_receiverPhoneController, 'Téléphone du destinataire', Icons.phone, Colors.green),
        const SizedBox(height: 10),
        _buildTextField(_baggageController, 'Description du colis (ex: Clés, Documents)', Icons.inventory, TranSenColors.primaryGreen, keyboardType: TextInputType.text),
        const SizedBox(height: 15),

        // Pick date / time
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 7)),
                  );
                  if (date != null) setState(() => _selectedDate = date);
                },
                child: Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(color: isDark ? Colors.grey[900] : Colors.grey[100], borderRadius: BorderRadius.circular(15)),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_month, color: TranSenColors.primaryGreen, size: 20),
                      const SizedBox(width: 10),
                      Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: InkWell(
                onTap: () async {
                  final time = await showTimePicker(context: context, initialTime: _selectedTime);
                  if (time != null) setState(() => _selectedTime = _roundToNearest15Mins(time));
                },
                child: Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(color: isDark ? Colors.grey[900] : Colors.grey[100], borderRadius: BorderRadius.circular(15)),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time, color: TranSenColors.primaryGreen, size: 20),
                      const SizedBox(width: 10),
                      Text(_selectedTime.format(context), style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),

        _buildPhoneFieldIfNeeded(),
        const SizedBox(height: 25),

        // CONTINUE BUTTON
        ElevatedButton(
          onPressed: (_selectedDeparture != null && _selectedDestination != null && _senderPhoneController.text.isNotEmpty && _receiverPhoneController.text.isNotEmpty)
              ? () => setState(() => _currentStep = 1)
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: TranSenColors.primaryGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            elevation: 5,
          ),
          child: const Text('RECHERCHER COURSIERS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        ),
      ],
    );
  }

  Widget _buildSuggestionsList(List<Map<String, dynamic>> list, bool isDeparture, bool isDark) {
    return Container(
      constraints: const BoxConstraints(maxHeight: 180),
      margin: const EdgeInsets.only(top: 5),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: list.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final item = list[index];
          return ListTile(
            leading: Icon(isDeparture ? Icons.my_location : Icons.location_on, color: isDeparture ? Colors.blue : Colors.red, size: 18),
            title: Text(item['name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            onTap: () {
              setState(() {
                if (isDeparture) {
                  _customDepartureController.text = item['name'];
                  _preciseDepartureLat = item['lat'];
                  _preciseDepartureLng = item['lng'];
                  _departureSuggestions = [];
                } else {
                  _customDestinationController.text = item['name'];
                  _destinationSuggestions = [];
                }
              });
              FocusScope.of(context).unfocus();
            },
          );
        },
      ),
    );
  }

  // --- STEP 1: SERVICE CHANNEL SELECTION ---
  Widget _buildStep1ChannelSelection(bool isDark) {
    return Column(
      children: [
        _buildChannelCard(
          title: "Coursier Rapide",
          subtitle: "Moto-coursiers ou taxis indépendants immédiats",
          icon: Icons.motorcycle,
          gradient: const [Color(0xFF0F9D58), Color(0xFF0B8043)],
          iconColor: const Color(0xFFA3E2C9),
          onTap: () => _selectRouting('INDEPENDENTS_ONLY'),
        ),
        const SizedBox(height: 15),
        _buildChannelCard(
          title: "Flottes Logistiques",
          subtitle: "Transporteurs agréés de colis (Sécurisé & Suivi)",
          icon: Icons.local_shipping,
          gradient: const [Color(0xFFF4B400), Color(0xFFE37400)],
          iconColor: const Color(0xFFFFE082),
          onTap: () => _selectRouting('COMPANY_ONLY'),
        ),
        const SizedBox(height: 15),
        _buildChannelCard(
          title: "Marché Public",
          subtitle: "Demande publique ouverte aux transporteurs de passage",
          icon: Icons.share,
          gradient: const [Color(0xFF4285F4), Color(0xFF1A5276)],
          iconColor: const Color(0xFFADCAF9),
          onTap: () => _selectRouting('PUBLIC'),
        ),
      ],
    );
  }

  Widget _buildChannelCard({
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
        boxShadow: [BoxShadow(color: gradient.last.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))],
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
            padding: const EdgeInsets.all(22),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), shape: BoxShape.circle),
                  child: Icon(icon, color: iconColor, size: 28),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _selectRouting(String routing) {
    setState(() {
      _selectedRoutingType = routing;
      if (routing == 'COMPANY_ONLY') {
        _currentStep = 2; // Jump to Company selection
      } else {
        _currentStep = 3; // Jump directly to summary
      }
    });
  }

  // --- STEP 2: LOGISTICS COMPANY SELECTION ---
  Widget _buildStep2CompanySelection(bool isDark) {
    if (_isLoadingCompanies) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen)),
      );
    }

    if (_companies.isEmpty) {
      return Column(
        children: [
          const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.orange),
          const SizedBox(height: 12),
          const Text("Aucun partenaire logistique disponible.", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          TextButton(onPressed: _fetchCompanies, child: const Text("Réessayer", style: TextStyle(color: TranSenColors.primaryGreen))),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text("Sélectionnez votre transporteur agréé :", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 15),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _companies.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final comp = _companies[index];
            final isSelected = _selectedCompany?['id'] == comp['id'];
            return _buildCompanyCardRow(comp, isSelected, isDark);
          },
        ),
        const SizedBox(height: 25),
        ElevatedButton(
          onPressed: (_selectedCompany != null)
              ? () => setState(() => _currentStep = 3)
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: TranSenColors.primaryGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          ),
          child: const Text('CONTINUER', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildCompanyCardRow(Map<String, dynamic> comp, bool isSelected, bool isDark) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedCompany = comp;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: isSelected 
              ? TranSenColors.primaryGreen.withValues(alpha: 0.1) 
              : (isDark ? Colors.grey[900] : Colors.grey[100]),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? TranSenColors.primaryGreen : Colors.transparent, width: 2.0),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: isSelected ? TranSenColors.primaryGreen : Colors.grey[400],
              child: Text(comp['logoStub'] ?? "L", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(comp['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 14),
                      const SizedBox(width: 4),
                      Text((comp['rating'] ?? 4.5).toStringAsFixed(1), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle, color: TranSenColors.primaryGreen),
          ],
        ),
      ),
    );
  }

  // --- STEP 3: SUMMARY & CONFIRMATION ---
  Widget _buildStep3SummaryAndValidation(bool isDark) {
    final departure = _selectedDeparture == 'Autre (Saisir manuellement)...' ? _customDepartureController.text.trim() : _selectedDeparture!;
    final destination = _selectedDestination == 'Autre (Saisir manuellement)...' ? _customDestinationController.text.trim() : _selectedDestination!;

    int finalPrice = _selectedRoutingType == 'COMPANY_ONLY' ? 6000 : 5000;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? Colors.grey[900] : Colors.grey[100],
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: TranSenColors.primaryGreen.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              _buildSummaryRow("Itinéraire", "$departure ➔ $destination", Icons.navigation_outlined),
              const Divider(height: 20),
              _buildSummaryRow("Date & Heure", "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.format(context)}", Icons.calendar_today),
              const Divider(height: 20),
              _buildSummaryRow(
                "Service Colis",
                _selectedRoutingType == 'COMPANY_ONLY' ? "Flotte (${_selectedCompany?['name']})" : (_selectedRoutingType == 'INDEPENDENTS_ONLY' ? "Coursier Rapide" : "Marché Public"),
                Icons.local_shipping,
              ),
              const Divider(height: 20),
              _buildSummaryRow("Expéditeur", _senderPhoneController.text, Icons.phone),
              const Divider(height: 20),
              _buildSummaryRow("Destinataire", _receiverPhoneController.text, Icons.phone),
              const Divider(height: 20),
              _buildSummaryRow("Description", _baggageController.text.isEmpty ? "Colis Standard" : _baggageController.text, Icons.inventory),
              const Divider(height: 20),
              _buildSummaryRow("Tarif", "$finalPrice FCFA", Icons.payments),
            ],
          ),
        ),
        const SizedBox(height: 15),

        if (_selectedRoutingType == 'COMPANY_ONLY') ...[
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "Paiement obligatoire par SenePay (Wave, Orange Money, Free Money) pour confirmer la livraison avec ce transporteur agréé.",
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blue),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          const Text('Mode de règlement privilégié (À bord/Livraison) :', style: TextStyle(fontWeight: FontWeight.bold)),
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
        ],

        const SizedBox(height: 25),

        // CONFIRMATION BUTTON
        ElevatedButton(
          onPressed: !_isProcessing ? () => _handleFinalSubmit(departure, destination, finalPrice) : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: TranSenColors.primaryGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            elevation: 8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _selectedRoutingType == 'COMPANY_ONLY' ? 'PAYER ET CONFIRMER  • ' : 'CONFIRMER L\'ENVOI  • ',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              if (_isProcessing)
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              else
                Text('$finalPrice FCFA', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String val, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.grey, fontSize: 13)),
        const Spacer(),
        Expanded(
          child: Text(
            val,
            textAlign: TextAlign.right,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
        ),
      ],
    );
  }

  Future<void> _handleFinalSubmit(String departure, String destination, int finalPrice) async {
    final auth = ref.read(authProvider);
    final userId = auth?.userId ?? '';

    setState(() => _isProcessing = true);

    try {
      final userData = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(userId).get();
      final data = userData.data();
      String phoneToValidate = data?['phone'] ?? (data?['phoneNumber'] ?? (auth?.phone ?? ''));
      final userPhoneDigits = phoneToValidate.replaceAll(RegExp(r'\D'), '');

      if (userPhoneDigits.length < 9) {
        throw Exception("Votre numéro de téléphone est obligatoire.");
      }

      String finalPhone = userPhoneDigits;
      if (finalPhone.startsWith('221') && finalPhone.length >= 12) {
        finalPhone = finalPhone.substring(3);
      }

      String cleanSenderPhone = _senderPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
      String cleanReceiverPhone = _receiverPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');

      if (cleanSenderPhone.startsWith('221') && cleanSenderPhone.length >= 12) {
        cleanSenderPhone = cleanSenderPhone.substring(3);
      }
      if (cleanReceiverPhone.startsWith('221') && cleanReceiverPhone.length >= 12) {
        cleanReceiverPhone = cleanReceiverPhone.substring(3);
      }

      final userName = userData.data()?['name'] ?? "Client ${userId.substring(0, 5)}";
      final scheduledDateStr = "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}";

      double lat = _preciseDepartureLat ?? 14.7167;
      double lng = _preciseDepartureLng ?? -17.4677;

      if (_selectedRoutingType == 'COMPANY_ONLY') {
        final orderId = "TKT-${DateTime.now().millisecondsSinceEpoch}-${userId.substring(0, 4)}";

        // Generate checkout url
        final checkoutUrl = await ref.read(paymentRepositoryProvider).createSenePaySession(
          amount: finalPrice.toDouble(),
          orderId: orderId,
          description: "Envoi Colis - ${_selectedCompany?['name']}",
          customerName: userName,
          customerPhone: finalPhone,
        );

        if (checkoutUrl != null && checkoutUrl.isNotEmpty) {
          // Submit the logistics order
          final tripRepo = ref.read(tripRepositoryProvider);
          await tripRepo.createTrip(TripModel(
            id: '',
            departure: departure,
            destination: destination,
            type: 'Livraison de colis',
            price: finalPrice.toDouble(),
            status: 'pending',
            createdAt: DateTime.now(),
            scheduledDate: scheduledDateStr,
            clientName: userName,
            clientPhone: finalPhone,
            clientId: userId,
            senderPhone: cleanSenderPhone,
            receiverPhone: cleanReceiverPhone,
            paymentMethod: 'SenePay',
            departureLat: lat,
            departureLng: lng,
            routingType: 'COMPANY_ONLY',
            targetCompanyId: _selectedCompany?['id'],
          ));

          setState(() => _isProcessing = false);
          if (!mounted) return;
          Navigator.pop(context);

          // Redirect to checkout
          final uri = Uri.parse(checkoutUrl);
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          throw Exception("Impossible de générer le lien de paiement SenePay.");
        }
      } else {
        // Normal parcel flow (instant search)
        final tripRepo = ref.read(tripRepositoryProvider);
        final tripId = await tripRepo.createTrip(TripModel(
          id: '',
          departure: departure,
          destination: destination,
          type: 'Livraison de colis',
          price: finalPrice.toDouble(),
          status: 'pending',
          createdAt: DateTime.now(),
          scheduledDate: scheduledDateStr,
          baggageDescription: _baggageController.text,
          clientName: userName,
          clientPhone: finalPhone,
          clientId: userId,
          senderPhone: cleanSenderPhone,
          receiverPhone: cleanReceiverPhone,
          paymentMethod: _paymentMethod,
          departureLat: lat,
          departureLng: lng,
          routingType: _selectedRoutingType,
        ));

        setState(() => _isProcessing = false);
        if (!mounted) return;

        final navigator = Navigator.of(context);
        navigator.pop();

        SuccessDialog.show(
          context,
          title: 'Livraison programmée !',
          message: 'Votre demande a été publiée. Un coursier vous contactera pour la récupération.',
          onDismiss: () {
            navigator.push(MaterialPageRoute(
              builder: (_) => ReceiptScreen(
                orderId: 'YOB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                departure: departure,
                destination: destination,
                price: '$finalPrice FCFA',
                type: 'Livraison de colis',
                tripId: tripId,
              ),
            ));
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
      }
    }
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, Color color, {TextInputType keyboardType = TextInputType.phone}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: color),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
        filled: true,
        fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
      ),
    );
  }

  Widget _buildPhoneFieldIfNeeded() {
    final auth = ref.watch(authProvider);
    if (auth == null) return const SizedBox.shrink();

    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(auth.userId).get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox.shrink();
        final data = snapshot.data!.data() as Map<String, dynamic>?;
        if (data?['phone'] != null && (data?['phone'] as String).isNotEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            const Text('Votre téléphone est obligatoire pour cette opération', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 12)),
            const SizedBox(height: 5),
            _buildTextField(_userPhoneController, 'Votre numéro (ex: 77...)', Icons.phone_android, TranSenColors.primaryGreen),
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
}
