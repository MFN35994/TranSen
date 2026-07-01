import 'package:flutter/material.dart';

class AnimatedBackgroundWaves extends StatelessWidget {
  final bool isDark;
  final Color? glowColor;

  const AnimatedBackgroundWaves({
    super.key,
    required this.isDark,
    this.glowColor,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: BackgroundWavePainter(
        isDark: isDark,
        glowColor: glowColor,
      ),
    );
  }
}

class BackgroundWavePainter extends CustomPainter {
  final bool isDark;
  final Color? glowColor;

  BackgroundWavePainter({
    required this.isDark,
    this.glowColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw the subtle static background curves (so they are always faintly visible)
    final baseColor = (isDark ? const Color(0xFF1B5E20) : const Color(0xFF81C784)).withValues(alpha: 0.06);
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
  }

  @override
  bool shouldRepaint(covariant BackgroundWavePainter oldDelegate) {
    return oldDelegate.isDark != isDark ||
        oldDelegate.glowColor != glowColor;
  }
}
