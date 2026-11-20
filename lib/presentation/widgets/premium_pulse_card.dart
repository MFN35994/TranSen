import 'dart:async';
import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';

class PremiumPulseCard extends StatefulWidget {
  final String label;
  final String sublabel;
  final IconData icon;
  final List<Color> gradientColors;
  final Color iconColor;
  final VoidCallback onTap;
  final bool animated;
  final String? badge;

  const PremiumPulseCard({
    super.key,
    required this.label,
    required this.sublabel,
    required this.icon,
    required this.gradientColors,
    required this.iconColor,
    required this.onTap,
    this.animated = false,
    this.badge,
  });

  @override
  State<PremiumPulseCard> createState() => _PremiumPulseCardState();
}

class _PremiumPulseCardState extends State<PremiumPulseCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  Timer? _timer;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.035).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    if (widget.animated) {
      _timer = Timer.periodic(const Duration(seconds: 6), (timer) {
        if (mounted) {
          _pulseController.forward().then((_) {
            if (mounted) _pulseController.reverse();
          });
        } else {
          timer.cancel();
        }
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ScaleTransition(
      scale: widget.animated ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: isDark ? TranSenColors.glassSurface : Colors.white,
          border: Border.all(
            color: widget.iconColor.withValues(alpha: isDark ? 0.35 : 0.25),
            width: 1.1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            onTap: widget.onTap,
            borderRadius: BorderRadius.circular(18),
            splashColor: Colors.white.withValues(alpha: 0.14),
            child: Ink(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: widget.gradientColors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(17),
                boxShadow: [
                  BoxShadow(
                    color: widget.gradientColors.last.withValues(alpha: 0.32),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                          ),
                          child: Icon(widget.icon, color: widget.iconColor, size: 20),
                        ),
                        const SizedBox(width: 11),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.label,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12.5,
                                  letterSpacing: 0.1,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                widget.sublabel,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.78),
                                  fontSize: 11,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded,
                            color: Colors.white.withValues(alpha: 0.55), size: 18),
                      ],
                    ),
                  ),
                  if (widget.badge != null)
                    Positioned(
                      top: 6,
                      right: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: TranSenColors.auroraRose,
                          borderRadius: BorderRadius.circular(999),
                          boxShadow: [
                            BoxShadow(
                              color: TranSenColors.auroraRose.withValues(alpha: 0.45),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: Text(
                          widget.badge!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
