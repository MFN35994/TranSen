import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';
import 'dart:typed_data';

class MapMarkerUtils {
  static Future<Uint8List> getCarIconBytes() async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    const size = 48.0;

    final paint = Paint()..color = TranSenColors.primaryGreen;
    
    // Corps voiture
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(8, 16, 32, 20), const Radius.circular(6)),
      paint,
    );
    // Toit
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(14, 8, 20, 12), const Radius.circular(4)),
      paint,
    );
    // Roue avant
    canvas.drawCircle(const Offset(14, 36), 5, Paint()..color = Colors.black87);
    // Roue arriere
    canvas.drawCircle(const Offset(34, 36), 5, Paint()..color = Colors.black87);

    final picture = recorder.endRecording();
    final img = await picture.toImage(size.toInt(), size.toInt());
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    
    return byteData!.buffer.asUint8List();
  }

  static Future<Uint8List> getPassengerIconBytes() async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    const size = 64.0;

    final bgPaint = Paint()..color = Colors.white;
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.2)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    
    // Shadow
    canvas.drawCircle(const Offset(32, 32), 26, shadowPaint);
    // White background circle
    canvas.drawCircle(const Offset(32, 32), 24, bgPaint);
    // Green border circle
    final borderPaint = Paint()
      ..color = TranSenColors.primaryGreen
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(const Offset(32, 32), 24, borderPaint);

    // Emoji passager africain
    const emoji = "🧑🏾";
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    textPainter.text = const TextSpan(
      text: emoji,
      style: TextStyle(fontSize: 32.0),
    );
    textPainter.layout();
    
    final offset = Offset(
      32.0 - textPainter.width / 2,
      32.0 - textPainter.height / 2,
    );
    textPainter.paint(canvas, offset);

    final picture = recorder.endRecording();
    final img = await picture.toImage(size.toInt(), size.toInt());
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    
    return byteData!.buffer.asUint8List();
  }
}

