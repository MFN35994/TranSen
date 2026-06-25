import 'dart:async';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_rating/transen_rating.dart';
import 'package:transen_payment/transen_payment.dart';
import 'package:transen_profile/transen_profile.dart';
import 'package:transen/presentation/widgets/profile_drawer.dart';
import 'package:transen/presentation/widgets/animated_background_waves.dart';
import 'package:transen/presentation/widgets/premium_pulse_card.dart';
import 'package:transen/presentation/widgets/unified_grid_actions_container.dart';
import 'package:transen/presentation/widgets/smart_media_hub_card.dart';
import 'trip_detail_screen.dart';
import 'pool_detail_screen.dart';
import 'destination_pools_screen.dart';
import 'active_deliveries_sheet.dart';
import 'company_reservations_screen.dart';

final driverProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) {
  ref.watch(authProvider); // Re-run when auth details (e.g. name or phone) change
  return ref.read(userRepositoryProvider).getUserData();
});

final pendingTripsProvider =
    StreamProvider.family<List<TripModel>, String>((ref, filterStr) {
  final parts = filterStr.split('|');
  final dep = parts[0] == 'ANY' ? null : parts[0];
  final dest = parts[1] == 'ANY' ? null : parts[1];

  final profileAsync = ref.watch(driverProfileProvider);
  final profile = profileAsync.value;
  final companyId = profile?['companyId'] as String?;

  return ref.watch(tripRepositoryProvider).getPendingTrips(
        departure: dep,
        destination: dest,
        driverCompanyId: companyId,
      );
});

final driverRouteStreamProvider =
    StreamProvider.family<DocumentSnapshot, String>((ref, driverId) {
  return ref.watch(tripRepositoryProvider).getDriverRoute(driverId);
});

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen> with SingleTickerProviderStateMixin {

  bool _isOnline = false;
  Timer? _locationTimer;
  String? _pubDeparture;
  String? _pubDestination;
  bool _isAutoFull = false;
  final _noteController = TextEditingController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  Color _activeMediaGlowColor = const Color(0xFF2E7D32);

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
  ];

  @override
  void initState() {
    super.initState();
  }



  @override
  void dispose() {
    _locationTimer?.cancel();
    _noteController.dispose();
    super.dispose();
  }

  void _toggleOnline(bool val, String driverId) async {
    if (val) {
      // 1. Vérifier si le service de localisation est activé
      bool serviceEnabled = await geo.Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text(
                    "Veuillez activer la localisation sur votre téléphone.")),
          );
        }
        return;
      }

      // 2. Vérifier les permissions
      geo.LocationPermission permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied) {
        permission = await geo.Geolocator.requestPermission();
      }

      if (permission == geo.LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text(
                    "Permission de localisation refusée. Veuillez l'activer dans les paramètres.")),
          );
        }
        return;
      }

      if (permission == geo.LocationPermission.always ||
          permission == geo.LocationPermission.whileInUse) {
        // Récupérer les infos du profil une seule fois
        final userDoc = await FirebaseFirestore.instanceFor(
                app: Firebase.app(), databaseId: 'transen')
            .collection('users')
            .doc(driverId)
            .get();
        final userData = userDoc.data();
        final name = userData?['name'] ?? 'Chauffeur TranSen';

        final phone = userData?['phone'] ?? '';

        setState(() => _isOnline = true);
        _startLocationUpdates(driverId, name, phone);
      }
    } else {
      setState(() {
        _isOnline = false;
        _isAutoFull = false; // Reset auto-full
      });
      _locationTimer?.cancel();
      // Supprimer le marqueur actif
      await FirebaseFirestore.instanceFor(
              app: Firebase.app(), databaseId: 'transen')
          .collection('active_drivers')
          .doc(driverId)
          .delete();
    }
  }

  void _startLocationUpdates(String driverId, String name, String phone) {
    _locationTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      try {
        geo.Position position = await geo.Geolocator.getCurrentPosition();
        await FirebaseFirestore.instanceFor(
                app: Firebase.app(), databaseId: 'transen')
            .collection('active_drivers')
            .doc(driverId)
            .set({
          'lat': position.latitude,
          'lng': position.longitude,
          'lastUpdated': FieldValue.serverTimestamp(),
          'status': 'online',
          'driverName': name,
          'driverPhone': phone,
          'departure': _pubDeparture,
          'destination': _pubDestination,
          'note': _noteController.text.trim(),
        });
      } catch (e) {
        debugPrint("Erreur update position: $e");
      }
    });
  }

  Future<void> _acceptTripDirectly(TripModel trip) async {
    final auth = ref.read(authProvider);
    if (auth == null) return;
    
    final profile = ref.read(driverProfileProvider).value;
    final companyId = profile?['companyId'] as String?;
    final hasCompany = companyId != null && companyId.isNotEmpty;

    try {
      // Pré-validation financière (uniquement pour les chauffeurs indépendants)
      if (!hasCompany) {
        final subInfo = await SubscriptionService().checkSubscription(auth.userId);
        final wallet = ref.read(walletProvider).value;
        final commission = trip.price * 0.01;

        if (!subInfo.isActive && (wallet?.balance ?? 0.0) < commission) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text("Solde insuffisant pour la commission (${commission.toInt()} F). Rechargez votre portefeuille."),
                backgroundColor: Colors.red,
                action: SnackBarAction(
                  label: "RECHARGER",
                  textColor: Colors.white,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen())),
                ),
              ),
            );
          }
          return;
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Acceptation en cours..."), duration: Duration(milliseconds: 500)),
        );
      }

      await ref.read(tripRepositoryProvider).acceptTrip(trip.id, auth.userId);
      
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TripDetailScreen(trip: trip),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll("Exception: ", "")),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<List<Map<String, double>>>>(demandHeatpointsProvider, (previous, next) {
      // Heatmap listener kept for compatibility
    });

    final auth = ref.watch(authProvider);
    final wallet = ref.watch(walletProvider);
    final currentUserId = auth?.userId ?? 'unknown_driver';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final profileAsync = ref.watch(driverProfileProvider);
    final driverName = profileAsync.value?['name'] ?? auth?.name ?? 'Chauffeur TranSen';
    final isCompanyDriver = profileAsync.value?.containsKey('companyId') ?? false;

    return Scaffold(
      key: _scaffoldKey,
      drawer: const ProfileDrawer(),
      body: GestureDetector(
        onHorizontalDragUpdate: (details) {
          if (details.delta.dx > 12) {
            _scaffoldKey.currentState?.openDrawer();
          }
        },
        child: Stack(
          children: [
            // Premium Slate Background
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF0F172A), const Color(0xFF1E293B)]
                        : [const Color(0xFFF8FAFC), const Color(0xFFF1F5F9)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            // Reusable Animated Neon Waves
            Positioned.fill(
              child: AnimatedBackgroundWaves(
                isDark: isDark,
                glowColor: _activeMediaGlowColor,
              ),
            ),
            // Main Content Scrollable
            SafeArea(
              child: ScrollConfiguration(
                behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Premium Header (Avatar + Welcome + Online Pill)
                      _buildHeader(context, currentUserId, driverName),
                      const SizedBox(height: 20),

                      // 2. Subscription Banner (Independent drivers only)
                      if (!isCompanyDriver)
                        StreamBuilder<SubscriptionInfo>(
                          stream: SubscriptionService().watchSubscription(currentUserId),
                          builder: (context, snapshot) {
                            final info = snapshot.data;
                            if (info == null) return const SizedBox.shrink();
                            if (info.isActive && !info.expiresSOon) return const SizedBox.shrink();

                            final isExpired = info.isExpired || info.isNone;
                            final hasBalanceForCommission = (wallet.value?.balance ?? 0.0) >= 100;

                            return GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                              ),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 15),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isExpired
                                      ? (hasBalanceForCommission ? Colors.blue.shade800 : Colors.red.shade800)
                                      : Colors.orange.shade800,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (isExpired
                                          ? (hasBalanceForCommission ? Colors.blue : Colors.red)
                                          : Colors.orange).withValues(alpha: 0.25),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      isExpired
                                          ? (hasBalanceForCommission ? Icons.info_outline : Icons.lock)
                                          : Icons.warning_amber,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        isExpired
                                            ? (hasBalanceForCommission
                                                ? "ℹ️ Mode Commission (1%) actif — Abonnez-vous pour l'illimité"
                                                : '⛔ Solde insuffisant pour la commission (1%) — Rechargez ou Abonnez-vous')
                                            : '⚠️ Abonnement expire dans ${info.daysRemaining}j ${info.hoursRemaining}h — Appuyez pour renouveler',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right, color: Colors.white, size: 18),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                      // 3. Smart Media Hub Card (Same as Client, synchronizes wave colors!)
                      SmartMediaHubCard(
                        onColorChanged: (color) {
                          setState(() {
                            _activeMediaGlowColor = color;
                          });
                        },
                      ),
                      const SizedBox(height: 25),

                      // 4. 2x2 Quick Actions Grid with Unified perimeter light
                      StreamBuilder<SubscriptionInfo>(
                        stream: SubscriptionService().watchSubscription(currentUserId),
                        builder: (context, subSnap) {
                          final subInfo = subSnap.data;
                          return UnifiedGridActionsContainer(
                            glowColor: _activeMediaGlowColor,
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    // TransPay Card
                                    Expanded(
                                      child: PremiumPulseCard(
                                        label: 'TransPay',
                                        sublabel: (wallet.value?.balance ?? 0.0) == 0.0 && (wallet.value?.transactions.isEmpty ?? true)
                                            ? 'chargement...'
                                            : '${wallet.value?.balance.toInt() ?? 0} FCFA',
                                        icon: Icons.account_balance_wallet_rounded,
                                        gradientColors: const [Color(0xFF1A3A5C), Color(0xFF0D6EFD)],
                                        iconColor: const Color(0xFF5BB8FF),
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                                        },
                                        animated: true,
                                      ),
                                    ),
                                    const SizedBox(width: 15),
                                    // Subscription / Reservations Card
                                    Expanded(
                                      child: isCompanyDriver
                                          ? PremiumPulseCard(
                                              label: 'Mes Réservations',
                                              sublabel: 'Gérer les sièges',
                                              icon: Icons.directions_bus_rounded,
                                              gradientColors: const [Color(0xFF0F4D32), Color(0xFF1E824C)],
                                              iconColor: const Color(0xFF2ECC71),
                                              onTap: () {
                                                HapticFeedback.lightImpact();
                                                Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyReservationsScreen()));
                                              },
                                              animated: true,
                                            )
                                          : PremiumPulseCard(
                                              label: 'Abonnement',
                                              sublabel: subSnap.connectionState == ConnectionState.waiting
                                                  ? 'chargement...'
                                                  : subInfo == null
                                                      ? 'Souscrire'
                                                      : subInfo.isActive
                                                          ? '${subInfo.daysRemaining}j restants'
                                                          : 'Renouveler',
                                              icon: Icons.workspace_premium_rounded,
                                              gradientColors: subInfo != null && subInfo.isExpired
                                                  ? const [Color(0xFF5C1A1A), Color(0xFFB71C1C)]
                                                  : const [Color(0xFF3A2A00), Color(0xFFF9A825)],
                                              iconColor: subInfo != null && subInfo.isExpired
                                                  ? Colors.red.shade300
                                                  : const Color(0xFFFFD54F),
                                              badge: subInfo != null && (subInfo.isExpired || subInfo.expiresSOon)
                                                  ? '!'
                                                  : null,
                                              onTap: () {
                                                HapticFeedback.lightImpact();
                                                Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
                                              },
                                              animated: true,
                                            ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 15),
                                Row(
                                  children: [
                                    // Referral Card
                                    Expanded(
                                      child: PremiumPulseCard(
                                        label: 'Parrainage',
                                        sublabel: 'Gagner des points',
                                        icon: Icons.card_giftcard_rounded,
                                        gradientColors: const [Color(0xFF1A3A2A), Color(0xFF2E7D32)],
                                        iconColor: const Color(0xFF81C784),
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
                                        },
                                        animated: false,
                                      ),
                                    ),
                                    const SizedBox(width: 15),
                                    // History Card
                                    Expanded(
                                      child: PremiumPulseCard(
                                        label: 'Historique',
                                        sublabel: 'Mes courses',
                                        icon: Icons.history_rounded,
                                        gradientColors: const [Color(0xFF1A1A3A), Color(0xFF4527A0)],
                                        iconColor: const Color(0xFFB39DDB),
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
                                        },
                                        animated: false,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 25),

                      // 5. Daily Route Card (Mon trajet du jour)
                      _buildDailyRouteCard(context, ref, currentUserId),
                      const SizedBox(height: 20),

                      // 6. Ride Requests (Demandes de courses) Section
                      if (_isOnline) ...[
                        // Active Ongoing Trips
                        Consumer(builder: (context, ref, child) {
                          final pool = ref.watch(driverActivePoolProvider).value;
                          if (pool != null) {
                            return _buildActiveDriverTripCard(context, pool);
                          }
                          return const SizedBox.shrink();
                        }),
                        Consumer(builder: (context, ref, child) {
                          final trip = ref.watch(driverActiveTripProvider).value;
                          if (trip != null) {
                            return _buildActiveVtcTripCard(context, trip);
                          }
                          return const SizedBox.shrink();
                        }),
                        Consumer(builder: (context, ref, child) {
                          final deliveries = ref.watch(driverActiveDeliveriesProvider).value;
                          if (deliveries != null && deliveries.isNotEmpty) {
                            return _buildActiveDeliveriesBanner(context, deliveries);
                          }
                          return const SizedBox.shrink();
                        }),

                        // --- Heatmap Zones ---
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                "Zones de forte demande",
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                              ),
                              TextButton.icon(
                                onPressed: () => setState(() => _isAutoFull = !_isAutoFull),
                                icon: Icon(
                                  _isAutoFull ? Icons.flash_on : Icons.flash_off,
                                  size: 16,
                                  color: _isAutoFull ? TranSenColors.accentGold : Colors.grey,
                                ),
                                label: Text(
                                  _isAutoFull ? "AUTO-FULL ACTIVÉ" : "AUTO-FULL DÉSACTIVÉ",
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: _isAutoFull ? TranSenColors.accentGold : Colors.grey,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: 50,
                          child: Consumer(builder: (context, ref, child) {
                            final heatmapAsync = ref.watch(demandHeatmapProvider);
                            return heatmapAsync.when(
                              data: (heatmap) {
                                if (heatmap.isEmpty) {
                                  return const Center(
                                    child: Text(
                                      "Aucune demande en attente.",
                                      style: TextStyle(fontSize: 12, color: Colors.grey),
                                    ),
                                  );
                                }
                                final sortedEntries = heatmap.entries.toList()
                                  ..sort((a, b) => b.value.compareTo(a.value));
                                return ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: sortedEntries.length,
                                  itemBuilder: (context, index) {
                                    final entry = sortedEntries[index];
                                    return InkWell(
                                      onTap: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => DestinationPoolsScreen(destination: entry.key),
                                        ),
                                      ),
                                      child: Container(
                                        margin: const EdgeInsets.only(right: 10),
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.red.withValues(alpha: entry.value > 5 ? 0.2 : 0.05),
                                          borderRadius: BorderRadius.circular(15),
                                          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                                        ),
                                        child: Center(
                                          child: Text(
                                            "${entry.key} (${entry.value} pers.)",
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.red,
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                              loading: () => const SizedBox.shrink(),
                              error: (_, __) => const SizedBox.shrink(),
                            );
                          }),
                        ),
                        const SizedBox(height: 15),

                        // --- VTC Requests ---
                        Consumer(builder: (context, ref, child) {
                          final tripsAsync = ref.watch(pendingTripsProvider("${_pubDeparture ?? 'ANY'}|ANY"));
                          return tripsAsync.when(
                            data: (trips) {
                              final vtcTrips = trips.where((t) {
                                final type = t.type.toLowerCase();
                                return !type.contains('livraison') &&
                                    !type.contains('colis') &&
                                    !type.contains('yobante') &&
                                    !type.contains('bus_company') &&
                                    (_pubDeparture == null ||
                                        _pubDeparture == 'TOUTES LES RÉGIONS' ||
                                        t.departure == _pubDeparture);
                              }).toList();

                              if (vtcTrips.isEmpty) {
                                return const SizedBox.shrink();
                              }
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Demandes VTC',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                                        ),
                                        Text(
                                          '${vtcTrips.length} en attente',
                                          style: const TextStyle(
                                            color: TranSenColors.primaryGreen,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(
                                    height: 130,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      itemCount: vtcTrips.length,
                                      itemBuilder: (context, index) => _buildVtcSmallCard(context, vtcTrips[index]),
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

                        // --- Yobanté Deliveries ---
                        Consumer(builder: (context, ref, child) {
                          final deliveriesAsync = ref.watch(pendingTripsProvider("${_pubDeparture ?? 'ANY'}|ANY"));
                          return deliveriesAsync.when(
                            data: (trips) {
                              final deliveries = trips.where((t) {
                                final type = t.type.toLowerCase();
                                return (type.contains('livraison') ||
                                        type.contains('colis') ||
                                        type.contains('yobante')) &&
                                    (_pubDeparture == null ||
                                        _pubDeparture == 'TOUTES LES RÉGIONS' ||
                                        t.departure == _pubDeparture);
                              }).toList();

                              if (deliveries.isEmpty) {
                                return const SizedBox.shrink();
                              }
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          "Livraisons Yobanté",
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                                        ),
                                        Text(
                                          "${deliveries.length} colis",
                                          style: const TextStyle(
                                            color: TranSenColors.primaryGreen,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(
                                    height: 130,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      itemCount: deliveries.length,
                                      itemBuilder: (context, index) => _buildDeliverySmallCard(context, deliveries[index]),
                                    ),
                                  ),
                                ],
                              );
                            },
                            loading: () => const SizedBox.shrink(),
                            error: (_, __) => const SizedBox.shrink(),
                          );
                        }),
                      ] else
                        // Offline Placeholder
                        _buildOfflinePlaceholder(),
                      
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflinePlaceholder() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 35),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.wifi_off_rounded, color: Colors.amber, size: 36),
          ),
          const SizedBox(height: 16),
          const Text(
            "Vous êtes Hors Ligne",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            "Activez votre statut 'En Ligne' en haut à droite pour commencer à recevoir des demandes de trajets et de colis en temps réel.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildOnlineToggle(String currentUserId) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _isOnline
            ? Colors.green.withValues(alpha: 0.15)
            : Colors.grey.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isOnline
              ? Colors.green.withValues(alpha: 0.3)
              : Colors.grey.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _isOnline ? Colors.greenAccent : Colors.grey,
              shape: BoxShape.circle,
              boxShadow: _isOnline ? [
                BoxShadow(
                  color: Colors.greenAccent.withValues(alpha: 0.5),
                  blurRadius: 6,
                  spreadRadius: 2,
                ),
              ] : null,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _isOnline ? 'En Ligne' : 'Hors Ligne',
            style: TextStyle(
              color: _isOnline ? Colors.green.shade300 : Colors.grey.shade400,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 6),
          SizedBox(
            height: 20,
            width: 30,
            child: Switch(
              value: _isOnline,
              activeTrackColor: Colors.green.withValues(alpha: 0.3),
              activeThumbColor: Colors.greenAccent,
              inactiveThumbColor: Colors.grey,
              inactiveTrackColor: Colors.grey.withValues(alpha: 0.2),
              onChanged: (val) async {
                await HapticFeedback.mediumImpact();
                _toggleOnline(val, currentUserId);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String currentUserId, String driverName) {
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
                color: _activeMediaGlowColor.withValues(alpha: 0.3),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: _activeMediaGlowColor.withValues(alpha: 0.15),
                  blurRadius: 8,
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 20,
              backgroundColor: Colors.grey.shade800,
              child: const Icon(Icons.person, color: Colors.white, size: 20),
            ),
          ),
        ),
        const SizedBox(width: 10),
        // Welcome Text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Bonjour 👋",
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                driverName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        // Star reviews button
        IconButton(
          onPressed: () => DriverReviewsSheet.show(
            context, currentUserId, driverName,
          ),
          icon: const Icon(Icons.stars, color: Colors.amber, size: 20),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
          tooltip: "Mes Avis",
        ),
        const SizedBox(width: 8),
        // Sleek Online Toggle pill
        _buildOnlineToggle(currentUserId),
      ],
    );
  }

  Widget _buildDailyRouteCard(BuildContext context, WidgetRef ref, String currentUserId) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _activeMediaGlowColor.withValues(alpha: 0.25),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: _activeMediaGlowColor.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _showRouteBottomSheet(context, ref, currentUserId),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _activeMediaGlowColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.route, color: _activeMediaGlowColor, size: 18),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => _showRouteBottomSheet(context, ref, currentUserId),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Trajet du Jour',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _pubDeparture == null && _pubDestination == null
                        ? 'Définir mon trajet du jour...'
                        : '${_pubDeparture ?? '—'}  →  ${_pubDestination ?? '—'}',
                    style: TextStyle(
                      color: _pubDeparture == null ? Colors.white60 : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          if (_pubDeparture != null || _pubDestination != null) ...[
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white70, size: 16),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: () {
                setState(() {
                  _pubDeparture = null;
                  _pubDestination = null;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Trajet annulé.")),
                );
              },
            ),
            const SizedBox(width: 8),
          ],
          GestureDetector(
            onTap: () => _showRouteBottomSheet(context, ref, currentUserId),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Modifier',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveVtcTripCard(BuildContext context, TripModel trip) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade800, Colors.blue.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.blue.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => TripDetailScreen(trip: trip)));
          },
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.inventory_2,
                      color: Colors.white, size: 28),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip.type.contains('Livraison')
                            ? "Livraison Active !"
                            : "Course Active !",
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${trip.departure} ➔ ${trip.destination}",
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Client: ${trip.clientName ?? 'Anonyme'}",
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    color: Colors.white, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActiveDriverTripCard(BuildContext context, PoolModel pool) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade800, Colors.green.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.green.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => PoolDetailScreen(pool: pool)));
          },
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.airport_shuttle,
                      color: Colors.white, size: 28),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Course Active !",
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${pool.departure} ➔ ${pool.destination}",
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        pool.status == 'departed'
                            ? "Trajet en cours"
                            : "En route vers le point de collecte",
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    color: Colors.white, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActiveDeliveriesBanner(BuildContext context, List<TripModel> deliveries) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade800, Colors.blue.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.blue.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            ActiveDeliveriesSheet.show(context, deliveries);
          },
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.inventory_2, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Livraisons Actives",
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${deliveries.length} livraison(s) en cours",
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Cliquez pour gérer",
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    color: Colors.white, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDeliverySmallCard(BuildContext context, TripModel delivery) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: InkWell(
        onTap: null, // Désactivé selon demande utilisateur
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.inventory_2,
                    color: TranSenColors.primaryGreen, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    delivery.departure,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.only(left: 8),
              child: Icon(Icons.arrow_downward, size: 12, color: Colors.grey),
            ),
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.red, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    delivery.destination,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: () => _acceptTripDirectly(delivery),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('ACCEPTER',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white)),
                  ),
                ),
                Text(
                  "${delivery.price.toInt()} F",
                  style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: Colors.green,
                      fontSize: 14),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVtcSmallCard(BuildContext context, TripModel trip) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: 195,
      margin: const EdgeInsets.only(right: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: TranSenColors.primaryGreen.withValues(alpha: 0.4),
            width: 1.5),
        boxShadow: [
          BoxShadow(
              color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 6)),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: null, // Désactivé selon demande utilisateur
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.directions_car,
                        color: TranSenColors.primaryGreen, size: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      trip.clientName ?? 'Client',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.my_location, color: Colors.blue, size: 14),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(trip.departure,
                        style: const TextStyle(fontSize: 11),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.red, size: 14),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(trip.destination,
                        style: const TextStyle(fontSize: 11),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${trip.price.toInt()} FCFA',
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: Colors.green,
                        fontSize: 13),
                  ),
                  GestureDetector(
                    onTap: () => _acceptTripDirectly(trip),
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: TranSenColors.primaryGreen,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('ACCEPTER',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // BOTTOM SHEET : Sélection du trajet du jour
  // ────────────────────────────────────────────────────────────────────────
  void _showRouteBottomSheet(BuildContext context, WidgetRef ref, String driverId) {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
      useSafeArea: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: BoxDecoration(
            color: Theme.of(ctx).brightness == Brightness.dark ? const Color(0xFF1A1A1A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            left: 24, right: 24, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.route, color: TranSenColors.primaryGreen, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text('Mon trajet du jour',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 20),
              const Text('Ville de départ',
                  style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    hint: const Text('Sélectionner le départ'),
                    value: _pubDeparture,
                    isExpanded: true,
                    items: _regions.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) { setState(() => _pubDeparture = val); setModalState(() {}); },
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text("Ville d'arrivée",
                  style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    hint: const Text("Sélectionner l'arrivée"),
                    value: _pubDestination,
                    isExpanded: true,
                    items: _regions.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) { setState(() => _pubDestination = val); setModalState(() {}); },
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text('Message aux passagers (optionnel)',
                  style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                child: TextField(
                  controller: _noteController,
                  decoration: const InputDecoration(
                    hintText: 'Ex: Départ à 8h, Climatisé...',
                    border: InputBorder.none,
                    hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                    prefixIcon: Icon(Icons.chat_bubble_outline, size: 18),
                  ),
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _pubDeparture == null
                      ? null
                      : () {
                          HapticFeedback.mediumImpact();
                          ref.read(tripRepositoryProvider).publishDriverRoute(
                            driverId, _pubDeparture!, _pubDestination, _noteController.text.trim(),
                          );
                          Navigator.pop(ctx);
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TranSenColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Confirmer mon trajet',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
