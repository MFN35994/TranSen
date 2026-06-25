import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

class AnimatedBackgroundWaves extends StatefulWidget {
  final bool isDark;
  final Color? glowColor;

  const AnimatedBackgroundWaves({
    super.key,
    required this.isDark,
    this.glowColor,
  });

  @override
  State<AnimatedBackgroundWaves> createState() => _AnimatedBackgroundWavesState();
}

class _AnimatedBackgroundWavesState extends State<AnimatedBackgroundWaves>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12), // Elegant, slow 12-second movement
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: BackgroundWavePainter(
            isDark: widget.isDark,
            animationValue: _controller.value,
            glowColor: widget.glowColor,
          ),
        );
      },
    );
  }
}

class BackgroundWavePainter extends CustomPainter {
  final bool isDark;
  final double animationValue;
  final Color? glowColor;

  BackgroundWavePainter({
    required this.isDark,
    required this.animationValue,
    this.glowColor,
  });

  @override
  void paint(ui.Canvas canvas, ui.Size size) {
    // 1. Draw the subtle static background curves (so they are always faintly visible)
    final baseColor = (isDark ? const Color(0xFF1B5E20) : const Color(0xFF81C784)).withValues(alpha: 0.04);
    final staticPaint = Paint()
      ..color = baseColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final path1 = Path();
    path1.moveTo(0, size.height * 0.2);
    path1.quadraticBezierTo(
      size.width * 0.35,
      size.height * 0.1,
      size.width * 0.7,
      size.height * 0.4,
    );
    path1.quadraticBezierTo(
      size.width * 0.85,
      size.height * 0.55,
      size.width,
      size.height * 0.5,
    );

    final path2 = Path();
    path2.moveTo(0, size.height * 0.8);
    path2.quadraticBezierTo(
      size.width * 0.4,
      size.height * 0.9,
      size.width * 0.75,
      size.height * 0.65,
    );
    path2.quadraticBezierTo(
      size.width * 0.9,
      size.height * 0.55,
      size.width,
      size.height * 0.7,
    );

    canvas.drawPath(path1, staticPaint);
    canvas.drawPath(path2, staticPaint);

    // 2. Draw the animated glowing light pulses traveling along the paths
    final activeGlowColor = glowColor ?? (isDark ? const Color(0xFF00C853) : const Color(0xFF2E7D32));

    // Path 1 (top wave) pulse
    _drawGlowingPulse(canvas, path1, animationValue, activeGlowColor);

    // Path 2 (bottom wave) pulse - phase shifted by 0.5 to look natural and organic
    final phaseShiftedValue = (animationValue + 0.5) % 1.0;
    _drawGlowingPulse(canvas, path2, phaseShiftedValue, activeGlowColor);
  }

  void _drawGlowingPulse(ui.Canvas canvas, Path path, double progress, Color color) {
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      final length = metric.length;
      if (length <= 0) continue;

      final pulseDistance = length * progress;
      
      // We extract a segment of 120 pixels representing the trailing neon pulse
      final segmentStart = math.max(0.0, pulseDistance - 120.0);
      final segmentEnd = pulseDistance;
      
      if (segmentEnd > segmentStart) {
        final segmentPath = metric.extractPath(segmentStart, segmentEnd);
        
        // A. Draw the outer wide neon blur (glow halo)
        final blurPaint = Paint()
          ..color = color.withValues(alpha: 0.25)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 6.0
          ..strokeCap = StrokeCap.round
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5.0);
        canvas.drawPath(segmentPath, blurPaint);

        // B. Draw the middle colored core
        final midPaint = Paint()
          ..color = color.withValues(alpha: 0.8)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3.0
          ..strokeCap = StrokeCap.round;
        canvas.drawPath(segmentPath, midPaint);

        // C. Draw the inner super-bright white core leading edge
        final corePaint = Paint()
          ..color = Colors.white.withValues(alpha: 0.9)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2
          ..strokeCap = StrokeCap.round;
        
        // We make the white core shorter (just the tip of the pulse)
        final coreStart = math.max(segmentStart, pulseDistance - 25.0);
        final corePath = metric.extractPath(coreStart, segmentEnd);
        canvas.drawPath(corePath, corePaint);

        // D. Draw the leading spark dot
        final tangent = metric.getTangentForOffset(pulseDistance);
        if (tangent != null) {
          // Inner core spark
          final sparkPaint = Paint()..color = Colors.white;
          canvas.drawCircle(tangent.position, 2.5, sparkPaint);
          
          // Outer spark halo
          final sparkHalo = Paint()
            ..color = color
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3.0);
          canvas.drawCircle(tangent.position, 5.0, sparkHalo);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant BackgroundWavePainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.isDark != isDark ||
        oldDelegate.glowColor != glowColor;
  }
}
