import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_core/transen_core.dart';
import 'package:google_fonts/google_fonts.dart';

// --- Models ---
enum SeatStatus { free, reserved, boarded }

class SeatInfo {
  final int index;
  final SeatStatus status;
  final Map<String, dynamic>? booking;

  SeatInfo({
    required this.index,
    required this.status,
    this.booking,
  });
}

// --- Screen 1: List of Company Busses/Trips ---
class CompanyReservationsScreen extends ConsumerStatefulWidget {
  const CompanyReservationsScreen({super.key});

  @override
  ConsumerState<CompanyReservationsScreen> createState() => _CompanyReservationsScreenState();
}

class _CompanyReservationsScreenState extends ConsumerState<CompanyReservationsScreen> {
  bool _isLoading = false;
  List<Map<String, dynamic>> _trips = [];

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiClient().dio.get('/api/trips/history');
      if (response.statusCode == 200) {
        final list = response.data as List<dynamic>;
        setState(() {
          // Filtrer les trajets de type bus/compagnie
          _trips = list.map((e) => e as Map<String, dynamic>).toList();
        });
      }
    } catch (e) {
      debugPrint("Erreur chargement trajets compagnie: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Mes Trajets & Réservations',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        backgroundColor: TranSenColors.darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTrips,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen))
          : _trips.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _trips.length,
                  itemBuilder: (context, index) {
                    final trip = _trips[index];
                    return _buildTripCard(trip, isDark);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.directions_bus_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            "Aucun trajet assigné pour le moment",
            style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip, bool isDark) {
    final String from = trip['pickupLocation'] ?? 'Départ';
    final String to = trip['dropoffLocation'] ?? 'Destination';
    final String tripId = trip['id'];
    final double price = (trip['price'] as num?)?.toDouble() ?? 0.0;
    final String status = trip['status'] ?? 'PENDING';
    final String dateStr = trip['createdAt'] != null
        ? trip['createdAt'].toString().substring(0, 10)
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => VisualSeatMapScreen(
                    tripId: tripId,
                    routeLabel: '$from ➔ $to',
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: TranSenColors.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Text(
                          "BUS SCHEDULER",
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: TranSenColors.primaryGreen,
                          ),
                        ),
                      ),
                      Text(
                        dateStr,
                        style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.circle, size: 10, color: TranSenColors.primaryGreen),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          from,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    margin: const EdgeInsets.only(left: 4, top: 4, bottom: 4),
                    height: 20,
                    width: 2,
                    color: Colors.grey.withValues(alpha: 0.3),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 12, color: Colors.redAccent),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          to,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Tarif Billet",
                            style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey),
                          ),
                          Text(
                            "${price.toInt()} F CFA",
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: status == 'COMPLETED'
                              ? Colors.grey.withValues(alpha: 0.1)
                              : Colors.amber.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              status == 'COMPLETED' ? Icons.check_circle : Icons.directions_run,
                              size: 14,
                              color: status == 'COMPLETED' ? Colors.grey : Colors.amber.shade800,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              status == 'COMPLETED' ? 'Terminé' : 'En cours',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: status == 'COMPLETED' ? Colors.grey : Colors.amber.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// --- Screen 2: Visual Seat Grid view ---
class VisualSeatMapScreen extends StatefulWidget {
  final String tripId;
  final String routeLabel;

  const VisualSeatMapScreen({
    super.key,
    required this.tripId,
    required this.routeLabel,
  });

  @override
  State<VisualSeatMapScreen> createState() => _VisualSeatMapScreenState();
}

class _VisualSeatMapScreenState extends State<VisualSeatMapScreen> {
  bool _isLoading = false;
  List<SeatInfo> _seats = [];
  int _totalSeats = 15; // Valeur par défaut
  int _boardedCount = 0;
  int _reservedCount = 0;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiClient().dio.get('/api/bookings/trip/${widget.tripId}');
      if (response.statusCode == 200) {
        final list = response.data as List<dynamic>;
        final bookings = list.map((e) => e as Map<String, dynamic>).toList();

        // Récupérer le nombre de places total de la course (de préférence 15, 30 ou plus)
        // Pour la démo, on utilise 15 places si non spécifié
        _totalSeats = 15;
        
        // Initialiser tous les sièges comme libres
        final List<SeatInfo> seatList = List.generate(
          _totalSeats,
          (index) => SeatInfo(index: index + 1, status: SeatStatus.free),
        );

        int currentSeatIndex = 0;
        int boarded = 0;
        int reserved = 0;

        for (var b in bookings) {
          final String status = b['status'] ?? 'PENDING';
          if (status == 'CANCELLED') continue;
          
          final int seatsCount = (b['seatsBooked'] as num?)?.toInt() ?? 1;
          final SeatStatus sStatus = status == 'BOARDED' ? SeatStatus.boarded : SeatStatus.reserved;

          if (sStatus == SeatStatus.boarded) boarded += seatsCount;
          if (sStatus == SeatStatus.reserved) reserved += seatsCount;

          for (int i = 0; i < seatsCount; i++) {
            if (currentSeatIndex < _totalSeats) {
              seatList[currentSeatIndex] = SeatInfo(
                index: currentSeatIndex + 1,
                status: sStatus,
                booking: b,
              );
              currentSeatIndex++;
            }
          }
        }

        setState(() {
          _seats = seatList;
          _boardedCount = boarded;
          _reservedCount = reserved;
        });
      }
    } catch (e) {
      debugPrint("Erreur chargement bookings: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Plan des Sièges',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              widget.routeLabel,
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
        backgroundColor: TranSenColors.darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadBookings,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen))
          : Column(
              children: [
                _buildStatBanner(isDark),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: _buildBusLayout(isDark),
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => QRScannerScreen(tripId: widget.tripId),
            ),
          );
          if (result == true) {
            _loadBookings();
          }
        },
        backgroundColor: TranSenColors.primaryGreen,
        icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
        label: Text(
          "SCANNER TICKET",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, letterSpacing: 0.5, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildStatBanner(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatIndicator(SeatStatus.free, "Libre (${_totalSeats - _boardedCount - _reservedCount})"),
          _buildStatIndicator(SeatStatus.reserved, "Réservé ($_reservedCount)"),
          _buildStatIndicator(SeatStatus.boarded, "À Bord ($_boardedCount)"),
        ],
      ),
    );
  }

  Widget _buildStatIndicator(SeatStatus status, String label) {
    Color color;
    switch (status) {
      case SeatStatus.free:
        color = Colors.green;
        break;
      case SeatStatus.reserved:
        color = Colors.blueAccent;
        break;
      case SeatStatus.boarded:
        color = Colors.purple;
        break;
    }

    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildBusLayout(bool isDark) {
    // Modélisation 3 colonnes : Siège gauche, Allée, Siège droite (Layout standard bus 2-1 ou Minibus)
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280),
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
            
            // Grille des sièges
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 20, // 5 rangées de 4 éléments (2 sièges, allée vide, 1 siège)
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1,
              ),
              itemBuilder: (context, gridIndex) {
                final int row = gridIndex ~/ 4;
                final int col = gridIndex % 4;

                // Allée centrale à l'index col = 2 (colonne 3)
                if (col == 2) {
                  return const SizedBox.shrink();
                }

                // Calculer l'index du siège dans _seats
                int seatIndex = row * 3;
                if (col < 2) {
                  seatIndex += col;
                } else {
                  seatIndex += (col - 1);
                }

                if (seatIndex >= _totalSeats) {
                  return const SizedBox.shrink();
                }

                final seat = _seats[seatIndex];
                return _buildSeatWidget(seat);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeatWidget(SeatInfo seat) {
    Color seatColor;
    IconData icon;
    
    switch (seat.status) {
      case SeatStatus.free:
        seatColor = Colors.green;
        icon = Icons.event_seat_outlined;
        break;
      case SeatStatus.reserved:
        seatColor = Colors.blueAccent;
        icon = Icons.event_seat;
        break;
      case SeatStatus.boarded:
        seatColor = Colors.purple;
        icon = Icons.check_circle;
        break;
    }

    return GestureDetector(
      onTap: () => _onSeatTap(seat),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          color: seatColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: seatColor, width: 2),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: seatColor),
              const SizedBox(height: 2),
              Text(
                "${seat.index}",
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: seatColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onSeatTap(SeatInfo seat) {
    if (seat.status == SeatStatus.free) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Le siège ${seat.index} est libre."),
          duration: const Duration(seconds: 1),
        ),
      );
      return;
    }

    // Afficher le bottom sheet premium
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
      builder: (context) {
        final b = seat.booking!;
        final name = b['passengerName'] ?? 'N/A';
        final phone = b['passengerPhone'] ?? 'N/A';
        final seats = b['seatsBooked'] ?? 1;
        final payStatus = b['paymentStatus'] ?? 'PENDING';
        final boardStatus = b['status'] ?? 'PENDING';
        final nir = b['boardingCode'] ?? 'N/A';

        final isPaid = payStatus == 'PAID_IN_ADVANCE';
        final isBoarded = boardStatus == 'BOARDED';

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Siège ${seat.index} : Détails",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: const BoxDecoration(
                        color: TranSenColors.primaryGreen,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.person, color: Colors.white, size: 24),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          phone,
                          style: GoogleFonts.outfit(color: Colors.grey, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                _buildDetailRow("Nombre de places", "$seats place(s)"),
                _buildDetailRow("Code de réservation (NIR)", nir),
                _buildDetailRow(
                  "Paiement",
                  isPaid ? "PAYÉ EN LIGNE" : "ESPÈCES À L'EMBARQUEMENT",
                  valueColor: isPaid ? Colors.green : Colors.orange,
                ),
                _buildDetailRow(
                  "Embarquement",
                  isBoarded ? "À BORD" : "EN ATTENTE",
                  valueColor: isBoarded ? Colors.purple : Colors.blueAccent,
                ),
                const SizedBox(height: 24),
                if (!isBoarded)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        _validateBoarding(nir);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        "VALIDER L'EMBARQUEMENT MANUELLEMENT",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String title, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13)),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _validateBoarding(String code) async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiClient().dio.post('/api/bookings/$code/scan');
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.data.toString()),
              backgroundColor: Colors.green,
            ),
          );
        }
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Une erreur est survenue lors de la validation."),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}

// --- Screen 3: QR Scanner Overlay Simulation ---
class QRScannerScreen extends StatefulWidget {
  final String tripId;

  const QRScannerScreen({super.key, required this.tripId});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _codeController = TextEditingController();
  late AnimationController _animController;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _codeController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _submitCode(String code) async {
    if (code.isEmpty) return;
    setState(() => _isProcessing = true);
    try {
      final response = await ApiClient().dio.post('/api/bookings/$code/scan');
      if (response.statusCode == 200) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: Row(
                children: const [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 10),
                  Text("Billet Validé"),
                ],
              ),
              content: const Text("Le passager a été enregistré à bord avec succès !"),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context, true); // Quitter l'écran de scan avec succès
                  },
                  child: const Text("OK"),
                )
              ],
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Row(
              children: const [
                Icon(Icons.error_outline, color: Colors.red),
                SizedBox(width: 10),
                Text("Validation Échouée"),
              ],
            ),
            content: const Text("Le code NIR est invalide ou déjà scanné."),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text("REESSAYER"),
              )
            ],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          'Scanner le Ticket',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 40),
            // Cadre Scanner
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white70, width: 2),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: Container(
                        color: Colors.white10,
                        child: const Center(
                          child: Icon(
                            Icons.qr_code,
                            size: 120,
                            color: Colors.white24,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Ligne de scan animée
                  AnimatedBuilder(
                    animation: _animController,
                    builder: (context, child) {
                      return Positioned(
                        top: 250 * _animController.value,
                        left: 10,
                        right: 10,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.green.withValues(alpha: 0.8),
                                blurRadius: 10,
                                spreadRadius: 2,
                              )
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
            Text(
              "Placez le QR Code dans le cadre ci-dessus",
              style: GoogleFonts.outfit(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 40),
            // Section Saisie Manuelle
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Saisie manuelle du code NIR",
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _codeController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "Saisir le code (ex: TX-89234)",
                      hintStyle: const TextStyle(color: Colors.white30),
                      fillColor: Colors.black26,
                      filled: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      suffixIcon: _isProcessing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              ),
                            )
                          : IconButton(
                              icon: const Icon(Icons.arrow_forward, color: Colors.white),
                              onPressed: () => _submitCode(_codeController.text.trim()),
                            ),
                    ),
                    onSubmitted: (val) => _submitCode(val.trim()),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
