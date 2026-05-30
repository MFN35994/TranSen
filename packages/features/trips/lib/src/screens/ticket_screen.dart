import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class TicketScreen extends StatelessWidget {
  final Map<String, dynamic> bookingData;

  const TicketScreen({super.key, required this.bookingData});

  @override
  Widget build(BuildContext context) {
    final String boardingCode = bookingData['boardingCode'] ?? 'UNKNOWN';
    final int seats = bookingData['numberOfSeatsBooked'] ?? 1;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Billet'),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(25),
                  blurRadius: 10,
                  spreadRadius: 2,
                )
              ],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.directions_bus, size: 48, color: Colors.blueAccent),
                const SizedBox(height: 16),
                const Text(
                  'Billet de Transport',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  '$seats Place(s) Réservée(s)',
                  style: const TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const Divider(height: 32),
                const Text(
                  'Présentez ce QR Code au chauffeur lors de l\'embarquement.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 24),
                QrImageView(
                  data: boardingCode,
                  version: QrVersions.auto,
                  size: 200.0,
                  backgroundColor: Colors.white,
                ),
                const SizedBox(height: 24),
                Text(
                  'Code: $boardingCode',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
