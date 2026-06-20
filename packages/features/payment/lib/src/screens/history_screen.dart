import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';
import 'package:transen_core/transen_core.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String _selectedType = 'Tous';
  final List<String> _types = ['Tous', 'Covoiturage', 'Course', 'Yobanté'];

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isDriver = auth?.role == 'driver';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : Colors.grey[50],
      appBar: AppBar(
        title: const Text('Historique des Trajets'),
        backgroundColor: isDark ? const Color(0xFF1A1A1A) : TranSenColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _buildTripsTab(context, auth?.userId ?? '', isDriver),
    );
  }


  Widget _buildTripsTab(BuildContext context, String userId, bool isDriver) {
    return Column(
      children: [
        _buildFilters(),
        Expanded(child: _buildTripsList(context, userId, isDriver)),
      ],
    );
  }

  Widget _buildFilters() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        itemCount: _types.length,
        itemBuilder: (context, index) {
          final type = _types[index];
          final isSelected = _selectedType == type;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(type),
              selected: isSelected,
              onSelected: (val) => setState(() => _selectedType = type),
              selectedColor: TranSenColors.primaryGreen,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                fontSize: 12,
              ),
              backgroundColor: isDark ? Colors.grey[900] : Colors.white,
              checkmarkColor: Colors.white,
            ),
          );
        },
      ),
    );
  }

  Widget _buildTripsList(BuildContext context, String userId, bool isDriver) {
    final tripsAsync = ref.watch(tripHistoryProvider(userId));
    
    return tripsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen)),
      error: (err, _) => Center(child: Text("Erreur: $err")),
      data: (dataTrips) {
        var trips = dataTrips;
        
        // Appliquer le filtre
        if (_selectedType != 'Tous') {
          trips = trips.where((t) {
            if (_selectedType == 'Covoiturage') return t.type.contains('Covoiturage');
            if (_selectedType == 'Course') return t.type == 'Course';
            if (_selectedType == 'Yobanté') return t.type.contains('Livraison');
            return true;
          }).toList();
        }

        if (trips.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.directions_car_outlined, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                const Text('Aucun trajet correspondant.', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        // Calcul du résumé mensuel
        final now = DateTime.now();
        final monthlyTrips = trips.where((t) => t.createdAt.month == now.month && t.createdAt.year == now.year).toList();
        final double monthlyTotal = monthlyTrips.fold(0, (sum, t) => sum + t.price);
        
        return ListView(
          padding: const EdgeInsets.all(15),
          children: [
            _buildSummaryCard(monthlyTotal, monthlyTrips.length, isDriver),
            const SizedBox(height: 20),
            ...trips.map((trip) => _buildTripCard(trip, isDriver)),
          ],
        );
      },
    );
  }

  Widget _buildSummaryCard(double total, int count, bool isDriver) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [TranSenColors.primaryGreen, TranSenColors.darkGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: TranSenColors.primaryGreen.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'RÉSUMÉ DU MOIS',
            style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSummaryItem(isDriver ? 'Revenus' : 'Dépenses', '${total.toInt()} FCFA'),
              _buildSummaryItem('Trajets', '$count'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _buildTripCard(TripModel trip, bool isDriver) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bool isBusBilling = trip.category == 'BUS_COMPANY';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 0,
      color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
      child: Column(
        children: [
          ListTile(
            leading: CircleAvatar(
              backgroundColor: isBusBilling
                  ? Colors.blue.withValues(alpha: 0.1)
                  : TranSenColors.primaryGreen.withValues(alpha: 0.1),
              child: Icon(
                isBusBilling
                    ? Icons.directions_bus_outlined
                    : trip.type.contains('Livraison')
                        ? Icons.inventory_2_outlined
                        : Icons.directions_car_outlined,
                color: isBusBilling ? Colors.blue : TranSenColors.primaryGreen,
              ),
            ),
            title: Text("${trip.departure} ➔ ${trip.destination}",
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isDark ? Colors.white : Colors.black)),
            subtitle: Text(
              '${trip.createdAt.day}/${trip.createdAt.month}/${trip.createdAt.year} • ${trip.type}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            trailing: Text(
              '${trip.price.toInt()} F',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black),
            ),
          ),
          if (!isDriver)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (isBusBilling)
                    OutlinedButton.icon(
                      onPressed: () => _openMyTicket(trip),
                      icon: const Icon(Icons.qr_code, size: 16),
                      label: const Text('MON BILLET',
                          style: TextStyle(
                              fontSize: 10, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue,
                        side: const BorderSide(color: Colors.blue),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  if (isBusBilling) const SizedBox(width: 8),
                  if (!isBusBilling)
                    OutlinedButton.icon(
                      onPressed: () => _reorderTrip(trip),
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('COMMANDER À NOUVEAU',
                          style: TextStyle(
                              fontSize: 10, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: TranSenColors.primaryGreen,
                        side: const BorderSide(color: TranSenColors.primaryGreen),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openMyTicket(TripModel trip) async {
    try {
      final response = await ApiClient().dio.get('/api/bookings/my-ticket?tripId=${trip.id}');
      if (response.statusCode == 200 && response.data != null) {
        if (!mounted) return;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TicketScreen(
              bookingData: Map<String, dynamic>.from(response.data),
            ),
          ),
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Billet introuvable pour ce trajet.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur : $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _reorderTrip(TripModel trip) {
    if (trip.type.contains('Livraison')) {
      YobanteSheet.show(
        context,
        departure: trip.departure,
        destination: trip.destination,
      );
    } else {
      OrderSheet.show(
        context,
        departure: trip.departure,
        destination: trip.destination,
      );
    }
  }
}
