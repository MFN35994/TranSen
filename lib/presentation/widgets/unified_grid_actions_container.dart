import 'dart:math' as math;
import 'package:flutter/material.dart';

class UnifiedGridActionsContainer extends StatefulWidget {
  final Widget child;
  final Color glowColor;

  const UnifiedGridActionsContainer({
    super.key,
    required this.child,
    required this.glowColor,
  });

  @override
  State<UnifiedGridActionsContainer> createState() => _UnifiedGridActionsContainerState();
}

class _UnifiedGridActionsContainerState extends State<UnifiedGridActionsContainer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000), // Run the sweep once over 2 seconds
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // The grid actions children
        widget.child,
        // The overlay CustomPaint for the animated borders
        Positioned.fill(
          child: IgnorePointer(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return CustomPaint(
                  painter: UnifiedGridBorderPainter(
                    animationValue: _controller.value,
                    glowColor: widget.glowColor,
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class UnifiedGridBorderPainter extends CustomPainter {
  final double animationValue;
  final Color glowColor;

  UnifiedGridBorderPainter({
    required this.animationValue,
    required this.glowColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final progress = animationValue;
    
    // If the animation is finished, don't draw anything to save rendering cycles
    if (progress >= 1.0) {
      return;
    }
    
    // Calculate fade opacity
    double opacity = 1.0;
    if (progress < 0.15) {
      opacity = progress / 0.15; // Fade in
    } else if (progress > 0.85) {
      opacity = (1.0 - progress) / 0.15; // Fade out
    }

    final R = 18.0; // corner radius to match buttons

    // 1. Define Left Path (Counter-clockwise: top-center -> top-left -> bottom-left -> bottom-center)
    final leftPath = Path();
    leftPath.moveTo(size.width / 2, 0);
    leftPath.lineTo(R, 0);
    leftPath.arcToPoint(
      Offset(0, R),
      radius: Radius.circular(R),
      clockwise: false,
    );
    leftPath.lineTo(0, size.height - R);
    leftPath.arcToPoint(
      Offset(R, size.height),
      radius: Radius.circular(R),
      clockwise: false,
    );
    leftPath.lineTo(size.width / 2, size.height);

    // 2. Define Right Path (Clockwise: top-center -> top-right -> bottom-right -> bottom-center)
    final rightPath = Path();
    rightPath.moveTo(size.width / 2, 0);
    rightPath.lineTo(size.width - R, 0);
    rightPath.arcToPoint(
      Offset(size.width, R),
      radius: Radius.circular(R),
      clockwise: true,
    );
    rightPath.lineTo(size.width, size.height - R);
    rightPath.arcToPoint(
      Offset(size.width - R, size.height),
      radius: Radius.circular(R),
      clockwise: true,
    );
    rightPath.lineTo(size.width / 2, size.height);

    // Draw comets on both paths
    _drawComet(canvas, leftPath, progress, opacity);
    _drawComet(canvas, rightPath, progress, opacity);
  }

  void _drawComet(Canvas canvas, Path path, double progress, double opacity) {
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      final length = metric.length;
      if (length <= 0) continue;

      final pulseDistance = length * progress;
      
      // Extract a 60-pixel trailing segment for the comet
      final segmentStart = math.max(0.0, pulseDistance - 60.0);
      final segmentEnd = pulseDistance;

      if (segmentEnd > segmentStart) {
        final segmentPath = metric.extractPath(segmentStart, segmentEnd);

        // A. Wide diffuse neon blur
        final blurPaint = Paint()
          ..color = glowColor.withValues(alpha: 0.25 * opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 5.5
          ..strokeCap = StrokeCap.round
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4.0);
        canvas.drawPath(segmentPath, blurPaint);

        // B. Rich colored core
        final corePaint = Paint()
          ..color = glowColor.withValues(alpha: 0.85 * opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5
          ..strokeCap = StrokeCap.round;
        canvas.drawPath(segmentPath, corePaint);

        // C. Bright white leading edge
        final whitePaint = Paint()
          ..color = Colors.white.withValues(alpha: 0.9 * opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2
          ..strokeCap = StrokeCap.round;
        
        final whiteStart = math.max(segmentStart, pulseDistance - 15.0);
        final whitePath = metric.extractPath(whiteStart, segmentEnd);
        canvas.drawPath(whitePath, whitePaint);

        // D. Spark head dot
        final tangent = metric.getTangentForOffset(pulseDistance);
        if (tangent != null) {
          final sparkPaint = Paint()..color = Colors.white.withValues(alpha: opacity);
          canvas.drawCircle(tangent.position, 2.2, sparkPaint);

          final sparkHalo = Paint()
            ..color = glowColor.withValues(alpha: opacity)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2.5);
          canvas.drawCircle(tangent.position, 4.0, sparkHalo);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant UnifiedGridBorderPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.glowColor != glowColor;
  }
}
