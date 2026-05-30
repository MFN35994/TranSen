import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/trip_repository.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController cameraController = MobileScannerController();
  bool isProcessing = false;

  Future<void> _handleScan(BarcodeCapture capture) async {
    if (isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        setState(() {
          isProcessing = true;
        });

        try {
          final tripRepo = ref.read(tripRepositoryProvider);
          await tripRepo.scanTicket(code);
          
          if (!mounted) return;
          _showResultDialog(context, true, 'Billet validé avec succès !');
        } catch (e) {
          if (!mounted) return;
          _showResultDialog(context, false, e.toString().replaceAll('Exception: ', ''));
        } finally {
          if (mounted) {
            setState(() {
              isProcessing = false;
            });
          }
        }
      }
    }
  }

  void _showResultDialog(BuildContext context, bool isSuccess, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Icon(
            isSuccess ? Icons.check_circle : Icons.error,
            color: isSuccess ? Colors.green : Colors.red,
            size: 64,
          ),
          content: Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Ferme le dialogue
                // cameraController.start(); // Relance la caméra si nécessaire
              },
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner de Billet'),
        actions: [
          IconButton(
            color: Colors.white,
            icon: const Icon(Icons.flash_on),
            iconSize: 32.0,
            onPressed: () => cameraController.toggleTorch(),
          ),
          IconButton(
            color: Colors.white,
            icon: const Icon(Icons.cameraswitch),
            iconSize: 32.0,
            onPressed: () => cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: cameraController,
            onDetect: _handleScan,
          ),
          if (isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Visez le QR Code du passager',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }
}
