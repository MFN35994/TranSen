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
      barrierColor: Colors.black.withValues(alpha: 0.4),
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

class _OrderSheetState extends ConsumerState<OrderSheet> with WidgetsBindingObserver {
  // Step control: 0 = Route, 1 = Canal selection, 2 = Company selection, 3 = Confirmation & Payment
  int _currentStep = 0;

  // Step 0 variables
  String? _selectedDeparture;
  String? _selectedDestination;
  int _selectedSeats = 1;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();

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
  String? _selectedFixedTime;
  List<Map<String, dynamic>> _scheduledTrips = [];
  bool _isLoadingScheduledTrips = false;
  Map<String, dynamic>? _selectedScheduledTrip;
  List<int> _selectedSeatIndexes = []; // Sièges sélectionnés (ex: [3, 4])
  List<String> _occupiedSeats = []; // Sièges déjà occupés (ex: ["5", "6"])

  // Step 3 variables
  String _paymentMethod = 'Espèces';
  bool _isProcessing = false;
  bool _usePoints = false;

  String? _preferredDriverName;
  String? _preferredDriverId;

  // Payment abandonment / cancellation state
  String? _activeBookingId;
  bool _isWaitingForPayment = false;
  String? _checkoutUrl;

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
    WidgetsBinding.instance.addObserver(this);
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

    _fetchCompanies();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _customDepartureController.dispose();
    _customDestinationController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchCompanies() async {
    setState(() => _isLoadingCompanies = true);
    try {
      final repo = ref.read(tripRepositoryProvider);
      final list = await repo.getCompanies();
      setState(() {
        _companies = list.where((c) => c['category'] == 'BUS_COMPANY').toList();
        _isLoadingCompanies = false;
      });
    } catch (e) {
      debugPrint("Error fetching companies: $e");
      setState(() => _isLoadingCompanies = false);
    }
  }

  Future<void> _loadScheduledTrips() async {
    if (_selectedCompany == null) return;
    setState(() {
      _isLoadingScheduledTrips = true;
      _scheduledTrips = [];
      _selectedScheduledTrip = null;
      _selectedSeatIndexes = [];
      _occupiedSeats = [];
    });

    try {
      final dateStr = "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}";
      final departure = _selectedDeparture == 'Autre (Saisir manuellement)...' ? _customDepartureController.text.trim() : _selectedDeparture!;
      final destination = _selectedDestination == 'Autre (Saisir manuellement)...' ? _customDestinationController.text.trim() : _selectedDestination!;

      final response = await ApiClient().dio.get(
        '/api/trips/search',
        queryParameters: {
          'departure': departure,
          'destination': destination,
          'date': dateStr,
          'companyId': _selectedCompany!['id'],
        },
      );

      if (response.statusCode == 200 && mounted) {
        final list = response.data as List<dynamic>;
        setState(() {
          _scheduledTrips = list.map((e) => e as Map<String, dynamic>).toList();
        });
      }
    } catch (e) {
      debugPrint("Error searching scheduled trips: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoadingScheduledTrips = false);
      }
    }
  }

  Future<void> _loadOccupiedSeats(String tripId) async {
    try {
      final response = await ApiClient().dio.get('/api/bookings/trip/$tripId');
      if (response.statusCode == 200 && mounted) {
        final list = response.data as List<dynamic>;
        final bookings = list.map((e) => e as Map<String, dynamic>).toList();
        final List<String> occupied = [];

        for (var b in bookings) {
          final String status = b['status'] ?? 'PENDING';
          if (status == 'CANCELLED') continue;

          final String? seatNumbersStr = b['seatNumbers'];
          if (seatNumbersStr != null && seatNumbersStr.trim().isNotEmpty) {
            occupied.addAll(seatNumbersStr.split(',').map((s) => s.trim()));
          }
        }

        setState(() {
          _occupiedSeats = occupied;
        });
      }
    } catch (e) {
      debugPrint("Error loading bookings for seats: $e");
    }
  }

  Future<void> _fetchDriverName() async {
    try {
      final doc = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('users')
          .doc(widget.driverId)
          .get();
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

  String _getFixedTimeDateString() {
    if (_selectedFixedTime == null) return "";
    final parts = _selectedFixedTime!.split(':');
    final hour = int.parse(parts[0]);
    final min = int.parse(parts[1]);
    final date = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, hour, min);
    return "${date.day}/${date.month}/${date.year} ${hour.toString().padLeft(2, '0')}:${min.toString().padLeft(2, '0')}";
  }

  String _getDepartureTimeString() {
    return "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} ${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}";
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isWaitingForPayment) {
      return _buildPaymentWaitingScreen(isDark);
    }

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
                  const SizedBox(width: 48), // To balance the back icon
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
        return "Où allez-vous ?";
      case 1:
        return "Choisissez le service";
      case 2:
        return "Sélectionnez la flotte";
      case 3:
        return "Confirmation & Paiement";
      default:
        return "";
    }
  }

  Widget _buildStepContent(bool isDark) {
    switch (_currentStep) {
      case 0:
        return _buildStep0RouteSelection(isDark);
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

  // --- STEP 0: ROUTE SELECTION ---
  Widget _buildStep0RouteSelection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
                    "Chauffeur ciblé : $_preferredDriverName",
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

        // Departure Region Select
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  hintText: 'Région de départ',
                  prefixIcon: const Icon(Icons.my_location, color: Colors.blue),
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
              hintText: 'Saisissez votre zone de départ (ex: Mbour)',
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

        // Destination Region Select
        DropdownButtonFormField<String>(
          decoration: InputDecoration(
            hintText: 'Région de destination',
            prefixIcon: const Icon(Icons.location_on, color: Colors.red),
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
              hintText: 'Saisissez votre zone de destination (ex: Mboro)',
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

        // Seats & Date/Time selectors
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
        const SizedBox(height: 15),

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

        const SizedBox(height: 25),

        // CONTINUE BUTTON
        ElevatedButton(
          onPressed: (_selectedDeparture != null && _selectedDestination != null)
              ? () => setState(() => _currentStep = 1)
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: TranSenColors.primaryGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            elevation: 5,
          ),
          child: const Text('RECHERCHER DISPONIBILITÉS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
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

  // --- STEP 1: SERVICE/CHANNEL SELECTION ---
  Widget _buildStep1ChannelSelection(bool isDark) {
    return Column(
      children: [
        _buildChannelCard(
          title: "Allô Dakar",
          subtitle: "Chauffeurs indépendants rapides en direct",
          icon: Icons.directions_car,
          gradient: const [Color(0xFF1B5E20), Color(0xFF2E7D32)],
          iconColor: const Color(0xFF81C784),
          onTap: () => _selectRouting('INDEPENDENTS_ONLY'),
        ),
        const SizedBox(height: 15),
        _buildChannelCard(
          title: "Compagnies Partenaires",
          subtitle: "Billet réservé à horaire fixe (Voyage Confort)",
          icon: Icons.business_outlined,
          gradient: const [Color(0xFFE65100), Color(0xFFF57C00)],
          iconColor: const Color(0xFFFFB74D),
          onTap: () => _selectRouting('COMPANY_ONLY'),
        ),
        const SizedBox(height: 15),
        _buildChannelCard(
          title: "Marché Public",
          subtitle: "Publication ouverte, premier chauffeur acceptant",
          icon: Icons.public,
          gradient: const [Color(0xFF0D47A1), Color(0xFF1976D2)],
          iconColor: const Color(0xFF64B5F6),
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

  // --- STEP 2: COMPANY SELECTION ---
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
          const Text("Aucune compagnie disponible pour le moment.", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          TextButton(onPressed: _fetchCompanies, child: const Text("Réessayer", style: TextStyle(color: TranSenColors.primaryGreen))),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text("Sélectionnez votre transporteur :", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 10),
        SizedBox(
          height: 110,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _companies.length,
            itemBuilder: (context, index) {
              final comp = _companies[index];
              final isSelected = _selectedCompany?['id'] == comp['id'];
              return _buildCompanyCard(comp, isSelected, isDark);
            },
          ),
        ),
        const SizedBox(height: 20),
        if (_selectedCompany != null) ...[
          const Text("Horaires de départs fixes :", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 10),
          _buildDepartureTimesGrid(isDark),
        ],
        if (_selectedScheduledTrip != null) ...[
          _buildClientSeatMap(isDark),
        ],
        const SizedBox(height: 25),
        ElevatedButton(
          onPressed: (_selectedCompany != null && _selectedFixedTime != null && _selectedSeatIndexes.length == _selectedSeats)
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

  Widget _buildCompanyCard(Map<String, dynamic> comp, bool isSelected, bool isDark) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedCompany = comp;
          _selectedFixedTime = null; // reset fixed time on company switch
          _selectedScheduledTrip = null;
          _selectedSeatIndexes = [];
          _occupiedSeats = [];
        });
        _loadScheduledTrips();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 140,
        margin: const EdgeInsets.only(right: 12, bottom: 5, top: 5),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected 
              ? TranSenColors.primaryGreen.withValues(alpha: 0.1) 
              : (isDark ? Colors.grey[900] : Colors.grey[100]),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? TranSenColors.primaryGreen : Colors.transparent, width: 2.0),
          boxShadow: isSelected ? [BoxShadow(color: TranSenColors.primaryGreen.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 3))] : [],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: isSelected ? TranSenColors.primaryGreen : Colors.grey[400],
              child: Text(comp['logoStub'] ?? "CO", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            ),
            const SizedBox(height: 8),
            Text(comp['name'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 12),
                const SizedBox(width: 3),
                Text((comp['rating'] ?? 4.5).toStringAsFixed(1), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDepartureTimesGrid(bool isDark) {
    if (_isLoadingScheduledTrips) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen)),
      );
    }

    if (_scheduledTrips.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.amber.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
        ),
        child: const Text(
          "Aucun départ disponible à cette date pour cette compagnie.",
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.orange),
        ),
      );
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _scheduledTrips.map((trip) {
        final time = trip['scheduledTime'] ?? "00:00";
        final isSelected = _selectedScheduledTrip?['id'] == trip['id'];
        return InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() {
              _selectedScheduledTrip = trip;
              _selectedFixedTime = time;
              _selectedSeatIndexes = [];
              _occupiedSeats = [];
            });
            _loadOccupiedSeats(trip['id']);
          },
          borderRadius: BorderRadius.circular(12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected 
                  ? TranSenColors.accentGold.withValues(alpha: 0.1)
                  : (isDark ? Colors.grey[850] : Colors.grey[200]),
              border: Border.all(color: isSelected ? TranSenColors.accentGold : Colors.transparent, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  time,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isSelected ? Colors.orange : (isDark ? Colors.white70 : Colors.black87),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "${trip['availableSeats']} places",
                  style: TextStyle(
                    fontSize: 9,
                    color: isSelected ? Colors.orange.withValues(alpha: 0.8) : Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // --- STEP 3: SUMMARY & VALIDATION ---
  Widget _buildStep3SummaryAndValidation(bool isDark) {
    final auth = ref.watch(authProvider);
    final points = auth?.loyaltyPoints ?? 0;
    final pointsValue = points * 10;

    final departure = _selectedDeparture == 'Autre (Saisir manuellement)...' ? _customDepartureController.text.trim() : _selectedDeparture!;
    final destination = _selectedDestination == 'Autre (Saisir manuellement)...' ? _customDestinationController.text.trim() : _selectedDestination!;

    // Calculation logic
    int finalPrice = 10000;
    if (_selectedRoutingType == 'COMPANY_ONLY') {
      if (_selectedScheduledTrip != null && _selectedScheduledTrip!['price'] != null) {
        finalPrice = ((_selectedScheduledTrip!['price'] as num).toInt()) * _selectedSeats;
      } else {
        finalPrice = 3000 * _selectedSeats; // fallback
      }
    }
    int discount = 0;
    if (_usePoints && points >= 10) {
      discount = pointsValue;
    }
    if (finalPrice < discount) {
      discount = finalPrice;
    }
    finalPrice = finalPrice - discount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Summary Card
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
              _buildSummaryRow(
                "Date & Heure",
                _selectedRoutingType == 'COMPANY_ONLY' ? "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} à $_selectedFixedTime" : _getDepartureTimeString(),
                Icons.calendar_today,
              ),
              const Divider(height: 20),
              _buildSummaryRow(
                "Service",
                _selectedRoutingType == 'COMPANY_ONLY' ? "Compagnie (${_selectedCompany?['name']})" : (_selectedRoutingType == 'INDEPENDENTS_ONLY' ? "Allô Dakar" : "Marché Public"),
                Icons.directions_car,
              ),
              const Divider(height: 20),
              _buildSummaryRow("Places à bord", "$_selectedSeats place(s)", Icons.event_seat),
              const Divider(height: 20),
              _buildSummaryRow("Tarif", "${finalPrice + discount} FCFA", Icons.payments),
            ],
          ),
        ),
        const SizedBox(height: 15),

        // Loyalty Switch
        if (points >= 10)
          Container(
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
            ),
            child: SwitchListTile(
              title: Text("Utiliser mes points fidélité", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber.shade800)),
              subtitle: Text("Réduction immédiate de $pointsValue FCFA", style: const TextStyle(fontSize: 12)),
              value: _usePoints,
              activeThumbColor: Colors.amber,
              secondary: const Icon(Icons.stars_rounded, color: Colors.amber),
              onChanged: (val) => setState(() => _usePoints = val),
            ),
          ),
        const SizedBox(height: 20),

        // Payment logic differences
        if (_selectedRoutingType == 'COMPANY_ONLY') ...[
          // Compagnie: Online payment only
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
                    "Paiement obligatoire par SenePay (Wave, Orange Money, Free Money) pour valider votre billet auprès de la compagnie.",
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blue),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          // Allô Dakar / Public: Pay at pickup intention only
          const Text('Mode de règlement privilégié (À bord) :', style: TextStyle(fontWeight: FontWeight.bold)),
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
          onPressed: !_isProcessing ? () => _handleFinalSubmit(departure, destination, finalPrice, discount) : null,
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
                _selectedRoutingType == 'COMPANY_ONLY' ? 'PAYER ET CONFIRMER  • ' : 'CONFIRMER LA DEMANDE  • ',
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

  Future<void> _handleFinalSubmit(String departure, String destination, int finalPrice, int discount) async {
    final auth = ref.read(authProvider);
    final userId = auth?.userId ?? '';

    setState(() => _isProcessing = true);

    try {
      final userData = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(userId).get();
      final data = userData.data();
      String phoneToValidate = data?['phone'] ?? (data?['phoneNumber'] ?? (auth?.phone ?? ''));
      final userPhoneDigits = phoneToValidate.replaceAll(RegExp(r'\D'), '');

      if (userPhoneDigits.length < 9) {
        throw Exception("Numéro de téléphone incomplet (9 chiffres requis).");
      }

      String finalPhone = userPhoneDigits;
      if (finalPhone.startsWith('221') && finalPhone.length >= 12) {
        finalPhone = finalPhone.substring(3);
      }

      final userFirstName = userData.data()?['firstName'];
      final userLastName = userData.data()?['lastName'];
      final userName = userData.data()?['name'] ?? "Client ${userId.substring(0, 5)}";

      final scheduledDate = _selectedRoutingType == 'COMPANY_ONLY' ? _getFixedTimeDateString() : _getDepartureTimeString();

      // Deduct loyalty points if used
      if (discount > 0 && auth != null) {
        final usedPoints = discount ~/ 10;
        await ref.read(authProvider.notifier).addLoyaltyPoints(-usedPoints);
      }

      // If it is a COMPANY TRIP: Payment is required first!
      if (_selectedRoutingType == 'COMPANY_ONLY') {
        final orderId = "TKT-${DateTime.now().millisecondsSinceEpoch}-${userId.substring(0, 4)}";

        // 1. Create Checkout Session via SenePay
        final checkoutUrl = await ref.read(paymentRepositoryProvider).createSenePaySession(
          amount: finalPrice.toDouble(),
          orderId: orderId,
          description: "Achat Billet - ${_selectedCompany?['name']}",
          customerName: userName,
          customerPhone: finalPhone,
        );

        if (checkoutUrl != null && checkoutUrl.isNotEmpty) {
          // 2. Submit the seat booking on the backend
          final seatNumbersStr = _selectedSeatIndexes.join(',');
          final response = await ApiClient().dio.post(
            '/api/bookings/book',
            queryParameters: {
              'tripId': _selectedScheduledTrip!['id'],
              'passengerId': userId,
              'seats': _selectedSeats,
              'seatNumbers': seatNumbersStr,
              'paymentReference': orderId,
            },
          );

          String? bookingId;
          if (response.data != null && response.data is Map) {
            bookingId = response.data['id'] as String?;
          }

          setState(() {
            _activeBookingId = bookingId;
            _isWaitingForPayment = true;
            _checkoutUrl = checkoutUrl;
            _isProcessing = false;
          });

          if (!mounted) return;

          // 3. Launch url with robust try-catch fallback
          final uri = Uri.parse(checkoutUrl);
          try {
            final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
            if (!launched) {
              await launchUrl(uri, mode: LaunchMode.platformDefault);
            }
          } catch (e) {
            try {
              await launchUrl(uri, mode: LaunchMode.platformDefault);
            } catch (e2) {
              debugPrint('Failed to launch SenePay URL: $e2');
            }
          }
        } else {
          throw Exception("Impossible de générer le lien de paiement SenePay.");
        }
      } else {
        // Allô Dakar / Public: Instant booking dispatch
        final tripRepo = ref.read(tripRepositoryProvider);

        // We use the covoiturage pooling mechanism if routing is independents/pool, else backend routing
        final poolId = await tripRepo.joinOrCreatePool(
          userId: userId,
          departure: departure,
          destination: destination,
          scheduledDate: scheduledDate,
          lat: _preciseDepartureLat ?? 14.7167,
          lng: _preciseDepartureLng ?? -17.4677,
          seats: _selectedSeats,
          preferredDriverId: _preferredDriverId,
          userDetails: {
            'name': userName,
            'firstName': userFirstName,
            'lastName': userLastName,
            'phone': finalPhone,
            'paymentMethod': _paymentMethod,
            'pointsDiscount': discount,
            'routingType': _selectedRoutingType,
          },
        );

        setState(() => _isProcessing = false);
        if (!mounted) return;

        final navigator = Navigator.of(context);
        navigator.pop();

        SuccessDialog.show(
          context,
          title: 'Demande enregistrée !',
          message: 'Recherche de chauffeur lancée. Vous serez notifié dès qu\'un chauffeur aura accepté.',
          onDismiss: () {
            navigator.push(MaterialPageRoute(
              builder: (_) => ReceiptScreen(
                orderId: 'POOL-${poolId.substring(0, 5).toUpperCase()}',
                departure: departure,
                destination: destination,
                price: '$finalPrice FCFA',
                type: 'Recherche Chauffeur',
                tripId: poolId,
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

  Widget _buildClientSeatMap(bool isDark) {
    if (_selectedScheduledTrip == null) return const SizedBox.shrink();

    final int totalSeats = (_selectedScheduledTrip!['totalSeats'] as num?)?.toInt() ?? 15;
    
    int crossAxisCount = 4;
    int aisleColumnIndex = 2; // Allée à la 3ème colonne (0-indexed) par défaut
    
    if (totalSeats <= 4) {
      crossAxisCount = 3;
      aisleColumnIndex = -1; // Pas d'allée (berline)
    } else if (totalSeats <= 9) {
      crossAxisCount = 3;
      aisleColumnIndex = -1; // Pas d'allée (minivan)
    } else if (totalSeats <= 22) {
      crossAxisCount = 4;
      aisleColumnIndex = 2; // Minibus 2-1 (2 sièges, allée, 1 siège)
    } else {
      crossAxisCount = 5;
      aisleColumnIndex = 2; // Grand bus 2-2 (2 sièges, allée centrale, 2 sièges)
    }

    final int seatsPerRow = crossAxisCount - (aisleColumnIndex != -1 ? 1 : 0);
    final int rowCount = (totalSeats / seatsPerRow).ceil();
    final int totalGridItems = rowCount * crossAxisCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Choisissez vos sièges :",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            Text(
              "${_selectedSeatIndexes.length} sur $_selectedSeats sélectionné(s)",
              style: TextStyle(
                fontSize: 12, 
                fontWeight: FontWeight.bold, 
                color: _selectedSeatIndexes.length == _selectedSeats ? Colors.amber.shade800 : Colors.grey,
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        
        // Légende
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildLegendItem("Libre", const Color(0xFF10B981), isDark),
            _buildLegendItem("Sélectionné", const Color(0xFFFFD700), isDark),
            _buildLegendItem("Occupé", Colors.grey, isDark),
          ],
        ),
        const SizedBox(height: 20),

        Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: crossAxisCount == 5 ? 320 : 280),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 30),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(40),
              border: Border.all(
                color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                width: 3,
              ),
            ),
            child: Column(
              children: [
                // Cabine Chauffeur
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Icon(Icons.directions_car, size: 24, color: Colors.grey),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(child: Icon(Icons.support_agent, size: 18, color: Colors.grey)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(thickness: 2),
                const SizedBox(height: 20),
                
                // Grille
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: totalGridItems,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1,
                  ),
                  itemBuilder: (context, gridIndex) {
                    final int row = gridIndex ~/ crossAxisCount;
                    final int col = gridIndex % crossAxisCount;

                    if (aisleColumnIndex != -1 && col == aisleColumnIndex) {
                      return const SizedBox.shrink();
                    }

                    int seatIndex = row * seatsPerRow;
                    if (aisleColumnIndex != -1) {
                      if (col < aisleColumnIndex) {
                        seatIndex += col;
                      } else {
                        seatIndex += (col - 1);
                      }
                    } else {
                      seatIndex += col;
                    }

                    final int seatNum = seatIndex + 1;
                    if (seatNum > totalSeats) {
                      return const SizedBox.shrink();
                    }

                    final isOccupied = _occupiedSeats.contains('$seatNum');
                    final isSelected = _selectedSeatIndexes.contains(seatNum);

                    return GlowingSeatWidget(
                      index: seatNum,
                      isSelected: isSelected,
                      isOccupied: isOccupied,
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedSeatIndexes.remove(seatNum);
                          } else {
                            if (_selectedSeatIndexes.length >= _selectedSeats) {
                              _selectedSeatIndexes.removeAt(0); // Supprimer le premier sélectionné
                            }
                            _selectedSeatIndexes.add(seatNum);
                          }
                        });
                      },
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color, bool isDark) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            border: Border.all(color: color, width: 2),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _isWaitingForPayment && _activeBookingId != null) {
      _checkBookingStatusAndPrompt();
    }
  }

  Future<void> _checkBookingStatusAndPrompt() async {
    if (_activeBookingId == null) return;
    try {
      final response = await ApiClient().dio.get('/api/bookings/$_activeBookingId');
      if (response.statusCode == 200 && response.data != null) {
        final paymentStatus = response.data['paymentStatus'] as String?;
        final status = response.data['status'] as String?;

        if (paymentStatus == 'PAID_IN_ADVANCE') {
          _handlePaymentSuccess(Map<String, dynamic>.from(response.data));
        } else if (status == 'CANCELLED') {
          _handlePaymentCancelledOrFailed();
        }
      }
    } catch (e) {
      debugPrint(">>> OrderSheet: Error checking booking status automatically: $e");
    }
  }

  Future<void> _checkBookingStatusManual() async {
    if (_activeBookingId == null) return;
    setState(() => _isProcessing = true);
    try {
      final response = await ApiClient().dio.get('/api/bookings/$_activeBookingId');
      if (response.statusCode == 200 && response.data != null) {
        final paymentStatus = response.data['paymentStatus'] as String?;
        final status = response.data['status'] as String?;

        if (paymentStatus == 'PAID_IN_ADVANCE') {
          _handlePaymentSuccess(Map<String, dynamic>.from(response.data));
        } else if (status == 'CANCELLED') {
          _handlePaymentCancelledOrFailed();
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Le paiement est toujours en cours de traitement. Veuillez finaliser la transaction ou réessayer."),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur de vérification : $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _cancelBookingManually() async {
    if (_activeBookingId == null) return;
    setState(() => _isProcessing = true);
    try {
      await ApiClient().dio.post('/api/bookings/$_activeBookingId/cancel');
      _handlePaymentCancelledOrFailed(message: "Réservation annulée avec succès. Places libérées.");
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur lors de l'annulation : $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _handlePaymentSuccess(Map<String, dynamic> bookingData) {
    setState(() {
      _isWaitingForPayment = false;
      _activeBookingId = null;
      _checkoutUrl = null;
    });
    if (mounted) {
      Navigator.pop(context);
      SuccessDialog.show(
        context,
        title: "Réservation confirmée !",
        message: "Votre billet de bus est validé et payé. Bon voyage !",
        onDismiss: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketScreen(bookingData: bookingData),
            ),
          );
        },
      );
    }
  }

  void _handlePaymentCancelledOrFailed({String message = "Paiement non finalisé. La réservation a été annulée."}) {
    setState(() {
      _isWaitingForPayment = false;
      _activeBookingId = null;
      _checkoutUrl = null;
    });
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  Widget _buildPaymentWaitingScreen(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 50,
              height: 5,
              decoration: const BoxDecoration(
                color: Colors.grey,
                borderRadius: BorderRadius.all(Radius.circular(10)),
              ),
            ),
          ),
          const SizedBox(height: 30),
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  color: TranSenColors.primaryGreen,
                  strokeWidth: 3,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            "Paiement en cours...",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text(
            "Veuillez finaliser le paiement sur l'interface SenePay. Votre réservation sera automatiquement validée après confirmation.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 32),
          if (_checkoutUrl != null && _checkoutUrl!.isNotEmpty) ...[
            ElevatedButton.icon(
              onPressed: () async {
                final uri = Uri.parse(_checkoutUrl!);
                try {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text("Impossible d'ouvrir le lien : $e"), backgroundColor: Colors.orange),
                  );
                }
              },
              icon: const Icon(Icons.open_in_new, size: 18),
              label: const Text("RÉOUVRIR LE LIEN DE PAIEMENT", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                elevation: 4,
              ),
            ),
            const SizedBox(height: 12),
          ],
          ElevatedButton(
            onPressed: _isProcessing ? null : _checkBookingStatusManual,
            style: ElevatedButton.styleFrom(
              backgroundColor: TranSenColors.primaryGreen,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              elevation: 4,
            ),
            child: _isProcessing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text("VÉRIFIER LE STATUT", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _isProcessing ? null : _cancelBookingManually,
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text("ANNULER LA RÉSERVATION", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class GlowingSeatWidget extends StatefulWidget {
  final int index;
  final bool isSelected;
  final bool isOccupied;
  final VoidCallback onTap;

  const GlowingSeatWidget({
    super.key,
    required this.index,
    required this.isSelected,
    required this.isOccupied,
    required this.onTap,
  });

  @override
  State<GlowingSeatWidget> createState() => _GlowingSeatWidgetState();
}

class _GlowingSeatWidgetState extends State<GlowingSeatWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _glowAnimation = Tween<double>(begin: 3.0, end: 12.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.isSelected) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant GlowingSeatWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.repeat(reverse: true);
    } else if (!widget.isSelected && oldWidget.isSelected) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (widget.isOccupied) {
      return Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(
          child: Icon(Icons.close, size: 16, color: Colors.grey),
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap();
      },
      child: AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return Container(
            decoration: BoxDecoration(
              color: widget.isSelected 
                  ? const Color(0xFFFFD700) 
                  : (isDark ? const Color(0xFF1E293B) : Colors.white),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: widget.isSelected 
                    ? const Color(0xFFFF8C00) 
                    : const Color(0xFF10B981),
                width: widget.isSelected ? 2 : 1.5,
              ),
              boxShadow: widget.isSelected
                  ? [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.6),
                        blurRadius: _glowAnimation.value,
                        spreadRadius: _glowAnimation.value / 3,
                      )
                    ]
                  : [],
            ),
            child: Center(
              child: Text(
                '${widget.index}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: widget.isSelected
                      ? Colors.black87
                      : (isDark ? Colors.white70 : Colors.black87),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
