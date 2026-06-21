import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

class TicketScreen extends StatefulWidget {
  final Map<String, dynamic> bookingData;

  const TicketScreen({super.key, required this.bookingData});

  @override
  State<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends State<TicketScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey _ticketKey = GlobalKey();
  late AnimationController _animationController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeIn = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOut));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  bool get _isPaid =>
      widget.bookingData['paymentStatus'] == 'PAID_IN_ADVANCE';

  String get _boardingCode =>
      widget.bookingData['boardingCode'] as String? ?? 'TX-PENDING';

  String get _qrData => _boardingCode;

  Future<void> _shareTicket() async {
    try {
      final boundary = _ticketKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      final bytes = byteData.buffer.asUint8List();
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/billet_transen.png');
      await file.writeAsBytes(bytes);
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'Mon billet TranSen — Code: $_boardingCode',
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Impossible de partager : $e'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final data = widget.bookingData;

    final String companyName = data['companyName'] as String? ?? '';
    final String departure = data['departure'] as String? ?? '';
    final String destination = data['destination'] as String? ?? '';
    final String scheduledDate = data['scheduledDate'] as String? ?? '';
    final int seats = (data['numberOfSeatsBooked'] as num?)?.toInt() ?? 1;
    final String seatNumbers = data['seatNumbers'] as String? ?? '';
    final String passengerName = data['passengerName'] as String? ?? '';
    final String passengerPhone = data['passengerPhone'] as String? ?? '';
    final dynamic priceRaw = data['price'];
    final String price = priceRaw != null ? '$priceRaw FCFA' : '';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0D0D1A) : const Color(0xFFF0F4FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        title: const Text(
          'Mon Billet',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _shareTicket,
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Partager le billet',
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeIn,
        child: SlideTransition(
          position: _slideUp,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Column(
              children: [
                // Status banner
                _StatusBanner(isPaid: _isPaid),
                const SizedBox(height: 20),

                // Ticket card (capturable for share)
                RepaintBoundary(
                  key: _ticketKey,
                  child: _TicketCard(
                    isDark: isDark,
                    companyName: companyName,
                    departure: departure,
                    destination: destination,
                    scheduledDate: scheduledDate,
                    seats: seats,
                    seatNumbers: seatNumbers,
                    passengerName: passengerName,
                    passengerPhone: passengerPhone,
                    price: price,
                    boardingCode: _boardingCode,
                    qrData: _qrData,
                    isPaid: _isPaid,
                  ),
                ),

                const SizedBox(height: 24),

                // Share button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _shareTicket,
                    icon: const Icon(Icons.share),
                    label: const Text(
                      'PARTAGER MON BILLET',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B5E20),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                      elevation: 4,
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Copy code button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: _boardingCode));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Code copié dans le presse-papiers'),
                          backgroundColor: Colors.green,
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    icon: const Icon(Icons.copy),
                    label: Text(
                      'COPIER LE CODE : $_boardingCode',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                    ),
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  final bool isPaid;
  const _StatusBanner({required this.isPaid});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isPaid
            ? Colors.green.withValues(alpha: 0.15)
            : Colors.orange.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPaid ? Colors.green : Colors.orange,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isPaid ? Icons.check_circle : Icons.hourglass_empty,
            color: isPaid ? Colors.green : Colors.orange,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPaid ? '✅ Réservation confirmée' : '⏳ Confirmation en cours',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isPaid ? Colors.green : Colors.orange,
                    fontSize: 14,
                  ),
                ),
                Text(
                  isPaid
                      ? 'Votre paiement a été reçu. Bon voyage !'
                      : 'SenePay traite votre paiement. Le billet se met à jour automatiquement.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isPaid
                        ? Colors.green.shade700
                        : Colors.orange.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final bool isDark;
  final String companyName;
  final String departure;
  final String destination;
  final String scheduledDate;
  final int seats;
  final String seatNumbers;
  final String passengerName;
  final String passengerPhone;
  final String price;
  final String boardingCode;
  final String qrData;
  final bool isPaid;

  const _TicketCard({
    required this.isDark,
    required this.companyName,
    required this.departure,
    required this.destination,
    required this.scheduledDate,
    required this.seats,
    required this.seatNumbers,
    required this.passengerName,
    required this.passengerPhone,
    required this.price,
    required this.boardingCode,
    required this.qrData,
    required this.isPaid,
  });

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF1E1E35) : Colors.white;
    final dividerColor =
        isDark ? Colors.white12 : Colors.grey.withValues(alpha: 0.2);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Header strip ──────────────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isPaid
                    ? [const Color(0xFF1B5E20), const Color(0xFF43A047)]
                    : [const Color(0xFF6D4C41), const Color(0xFFFF8F00)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                const Icon(Icons.directions_bus_rounded,
                    color: Colors.white, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'BILLET DE TRANSPORT',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (companyName.isNotEmpty)
                        Text(
                          companyName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isPaid ? 'PAYÉ' : 'EN ATTENTE',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Route section ─────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('DÉPART',
                          style: TextStyle(
                              color: Colors.grey,
                              fontSize: 10,
                              letterSpacing: 1.2)),
                      const SizedBox(height: 4),
                      Text(
                        departure.isNotEmpty ? departure : '—',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    const Icon(Icons.arrow_forward,
                        color: Colors.grey, size: 20),
                    const SizedBox(height: 2),
                    Container(
                      height: 2,
                      width: 40,
                      color: Colors.grey.withValues(alpha: 0.3),
                    ),
                  ],
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('ARRIVÉE',
                          style: TextStyle(
                              color: Colors.grey,
                              fontSize: 10,
                              letterSpacing: 1.2)),
                      const SizedBox(height: 4),
                      Text(
                        destination.isNotEmpty ? destination : '—',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Info grid ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                if (scheduledDate.isNotEmpty) ...[
                  _infoRow(
                      Icons.calendar_today_outlined, 'Date & Heure', scheduledDate),
                  Divider(color: dividerColor, height: 20),
                ],
                _infoRow(
                    Icons.person_outline, 'Passager',
                    passengerName.isNotEmpty ? passengerName : '—'),
                if (passengerPhone.isNotEmpty) ...[
                  Divider(color: dividerColor, height: 20),
                  _infoRow(Icons.phone_outlined, 'Téléphone', passengerPhone),
                ],
                Divider(color: dividerColor, height: 20),
                _infoRow(Icons.event_seat_outlined, 'Places réservées',
                    '$seats place(s)${seatNumbers.isNotEmpty ? " — Sièges: $seatNumbers" : ""}'),
                if (price.isNotEmpty) ...[
                  Divider(color: dividerColor, height: 20),
                  _infoRow(
                    Icons.payments_outlined,
                    'Montant payé',
                    price,
                    valueColor: Colors.green,
                    bold: true,
                  ),
                ],
              ],
            ),
          ),

          // ── Perforated divider ────────────────────────────────────────
          _PerforatedDivider(isDark: isDark),

          // ── QR Code section ───────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const Text(
                  'Présentez ce QR Code au chauffeur',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: qrData,
                    version: QrVersions.auto,
                    size: 180,
                    backgroundColor: Colors.white,
                    eyeStyle: QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: isPaid ? const Color(0xFF1B5E20) : Colors.orange,
                    ),
                    dataModuleStyle: QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: isPaid ? const Color(0xFF1B5E20) : Colors.orange,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Boarding code
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : Colors.grey.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: isDark ? Colors.white24 : Colors.grey.shade200),
                  ),
                  child: SelectableText(
                    boardingCode,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 3,
                      fontFamily: 'monospace',
                      color: isPaid
                          ? const Color(0xFF1B5E20)
                          : Colors.orange.shade700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value,
      {Color? valueColor, bool bold = false}) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: bold ? FontWeight.bold : FontWeight.w500,
                  color: valueColor,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Dashed perforated divider between ticket body and QR section
class _PerforatedDivider extends StatelessWidget {
  final bool isDark;
  const _PerforatedDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _notch(isDark, leftSide: true),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final count = (constraints.maxWidth / 10).floor();
              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(
                  count,
                  (_) => Container(
                    width: 5,
                    height: 2,
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                  ),
                ),
              );
            },
          ),
        ),
        _notch(isDark, leftSide: false),
      ],
    );
  }

  Widget _notch(bool isDark, {required bool leftSide}) {
    final bg = isDark ? const Color(0xFF0D0D1A) : const Color(0xFFF0F4FF);
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
      ),
      transform: Matrix4.translationValues(
        leftSide ? -10 : 10,
        0,
        0,
      ),
    );
  }
}
