import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';

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
    final accent = glowColor ?? TranSenColors.auroraEmerald;

    // Halo Aurora supérieur discret
    final topGlow = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.85, -0.85),
        radius: 0.9,
        colors: [
          accent.withValues(alpha: isDark ? 0.14 : 0.08),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), topGlow);

    // Halo cyan inférieur discret
    final bottomGlow = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.85, 0.9),
        radius: 0.85,
        colors: [
          TranSenColors.auroraCyan.withValues(alpha: isDark ? 0.09 : 0.05),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bottomGlow);

    // Courbes géométriques signature TranSen Aurora
    final linePaint1 = Paint()
      ..color = accent.withValues(alpha: isDark ? 0.14 : 0.09)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    final linePaint2 = Paint()
      ..color = TranSenColors.auroraGold.withValues(alpha: isDark ? 0.10 : 0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final path1 = Path()
      ..moveTo(0, size.height * 0.18)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.08, size.width * 0.7, size.height * 0.36)
      ..quadraticBezierTo(size.width * 0.86, size.height * 0.52, size.width, size.height * 0.46);

    final path2 = Path()
      ..moveTo(0, size.height * 0.82)
      ..quadraticBezierTo(size.width * 0.4, size.height * 0.92, size.width * 0.75, size.height * 0.66)
      ..quadraticBezierTo(size.width * 0.9, size.height * 0.56, size.width, size.height * 0.72);

    canvas.drawPath(path1, linePaint1);
    canvas.drawPath(path2, linePaint2);
  }

  @override
  bool shouldRepaint(covariant BackgroundWavePainter oldDelegate) {
    return oldDelegate.isDark != isDark || oldDelegate.glowColor != glowColor;
  }
}
