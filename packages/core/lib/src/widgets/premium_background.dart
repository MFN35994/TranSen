import 'package:flutter/material.dart';
import '../theme/transen_colors.dart';

/// Fond d'ambiance **TranSen Aurora** haute performance (60fps GPU-friendly via RadialGradient,
/// sans BackdropFilter plein écran coûteux sur mobile et Web).
class PremiumBackground extends StatelessWidget {
  final Widget child;
  final List<Color>? blobColors;

  const PremiumBackground({
    super.key,
    required this.child,
    this.blobColors,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = blobColors ??
        (isDark
            ? [
                TranSenColors.auroraEmerald.withValues(alpha: 0.22),
                TranSenColors.auroraCyan.withValues(alpha: 0.14),
                TranSenColors.auroraGold.withValues(alpha: 0.10),
              ]
            : [
                TranSenColors.auroraEmerald.withValues(alpha: 0.16),
                TranSenColors.auroraCyan.withValues(alpha: 0.10),
                TranSenColors.auroraGold.withValues(alpha: 0.08),
              ]);

    return Container(
      decoration: BoxDecoration(
        color: TranSenColors.scaffoldBg(isDark),
        gradient: isDark ? TranSenColors.auroraObsidianGradient : null,
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned(
            top: -120,
            right: -90,
            child: _AuroraOrb(color: colors[0], size: 360),
          ),
          Positioned(
            bottom: -110,
            left: -120,
            child: _AuroraOrb(color: colors.length > 1 ? colors[1] : colors[0], size: 420),
          ),
          if (colors.length > 2)
            Positioned(
              top: 220,
              left: -80,
              child: _AuroraOrb(color: colors[2], size: 260),
            ),
          child,
        ],
      ),
    );
  }
}

class _AuroraOrb extends StatelessWidget {
  final Color color;
  final double size;

  const _AuroraOrb({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color,
              color.withValues(alpha: 0.0),
            ],
            stops: const [0.0, 1.0],
          ),
        ),
      ),
    );
  }
}
