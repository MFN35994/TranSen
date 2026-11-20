import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/transen_colors.dart';

/// Carte verre signature **TranSen Aurora** avec bordure lumineuse et halo subtil.
class AuroraGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Color? accentColor;
  final VoidCallback? onTap;

  const AuroraGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.borderRadius = 22,
    this.accentColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = accentColor ?? TranSenColors.auroraEmerald;

    final card = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        gradient: isDark
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  TranSenColors.glassSurface.withValues(alpha: 0.94),
                  TranSenColors.deepSurface.withValues(alpha: 0.96),
                ],
              )
            : null,
        color: isDark ? null : Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isDark ? accent.withValues(alpha: 0.24) : TranSenColors.lightBorder,
          width: 1.1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? accent.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
            blurRadius: isDark ? 24 : 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: card,
      ),
    );
  }
}

/// Bouton CTA principal **TranSen Aurora** (dégradé émeraude ou or souverain).
class AuroraGradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool gold;
  final double height;

  const AuroraGradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.gold = false,
    this.height = 54,
  });

  @override
  Widget build(BuildContext context) {
    final gradient = gold
        ? TranSenColors.auroraGoldGradient
        : TranSenColors.auroraPrimaryGradient;
    final fgColor = gold ? const Color(0xFF1F1602) : const Color(0xFF022C22);
    final glowColor = gold ? TranSenColors.auroraGold : TranSenColors.auroraEmerald;

    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: onPressed == null || isLoading
            ? LinearGradient(colors: [Colors.grey.shade700, Colors.grey.shade800])
            : gradient,
        borderRadius: BorderRadius.circular(18),
        boxShadow: onPressed == null || isLoading
            ? null
            : [
                BoxShadow(
                  color: glowColor.withValues(alpha: 0.34),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(18),
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: fgColor),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: fgColor, size: 20),
                        const SizedBox(width: 10),
                      ],
                      Text(
                        label,
                        style: GoogleFonts.sora(
                          color: fgColor,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          letterSpacing: 0.3,
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

/// Badge statut en direct (pulsation émeraude / cyan / or).
class AuroraStatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;

  const AuroraStatusPill({
    super.key,
    required this.label,
    this.color = TranSenColors.auroraEmeraldLight,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.38), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
          ] else ...[
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: color.withValues(alpha: 0.7), blurRadius: 6)],
              ),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: GoogleFonts.inter(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// Radar cartographique **TranSen Aurora** optimisé pour Flutter Web (`app.transen.org`)
/// où le SDK natif Mapbox GL Mobile n'est pas disponible.
/// Évite tout crash Web tout en offrant une télémétrie visuelle futuriste et un lien Google Maps.
class AuroraWebMapRadar extends StatefulWidget {
  final String title;
  final String subtitle;
  final double? latitude;
  final double? longitude;
  final String? departureLabel;
  final String? destinationLabel;
  final int? activeDriversCount;

  const AuroraWebMapRadar({
    super.key,
    this.title = 'Radar TranSen Aurora',
    this.subtitle = 'Suivi GPS temps réel synchronisé',
    this.latitude,
    this.longitude,
    this.departureLabel,
    this.destinationLabel,
    this.activeDriversCount,
  });

  @override
  State<AuroraWebMapRadar> createState() => _AuroraWebMapRadarState();
}

class _AuroraWebMapRadarState extends State<AuroraWebMapRadar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _openExternalMap() async {
    final lat = widget.latitude ?? 14.7167;
    final lng = widget.longitude ?? -17.4677;
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lat = widget.latitude ?? 14.7167;
    final lng = widget.longitude ?? -17.4677;

    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0, -0.15),
          radius: 1.05,
          colors: [
            Color(0xFF0A2E22),
            Color(0xFF051812),
            Color(0xFF030E0A),
          ],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) => CustomPaint(
              painter: _AuroraRadarPainter(progress: _pulseController.value),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 64, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AuroraStatusPill(
                    label: widget.activeDriversCount != null
                        ? '${widget.activeDriversCount} CHAUFFEURS EN LIGNE'
                        : 'RADAR GPS ACTIF · WEB',
                    color: TranSenColors.auroraCyan,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: TranSenColors.auroraEmerald.withValues(alpha: 0.14),
                      shape: BoxShape.circle,
                      border: Border.all(color: TranSenColors.auroraEmeraldLight.withValues(alpha: 0.5), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: TranSenColors.auroraEmerald.withValues(alpha: 0.35),
                          blurRadius: 28,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.radar_rounded,
                      color: TranSenColors.auroraEmeraldLight,
                      size: 38,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    widget.title,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.sora(
                      color: TranSenColors.auroraTextPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.subtitle,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      color: TranSenColors.auroraTextSecondary,
                      fontSize: 12.5,
                    ),
                  ),
                  if (widget.departureLabel != null || widget.destinationLabel != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: TranSenColors.glassSurface.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: TranSenColors.glassBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.trip_origin, size: 14, color: TranSenColors.auroraEmeraldLight),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              widget.departureLabel ?? 'Dakar',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 8),
                            child: Icon(Icons.arrow_forward_rounded, size: 14, color: TranSenColors.auroraGold),
                          ),
                          Flexible(
                            child: Text(
                              widget.destinationLabel ?? 'Destination',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: TranSenColors.auroraGoldBright, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Text(
                    'GPS ${lat.toStringAsFixed(4)}° N · ${lng.toStringAsFixed(4)}° W',
                    style: GoogleFonts.jetBrainsMono(
                      color: TranSenColors.auroraCyan.withValues(alpha: 0.85),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: _openExternalMap,
                    icon: const Icon(Icons.open_in_new_rounded, size: 15, color: TranSenColors.auroraGoldBright),
                    label: Text(
                      'Ouvrir la position dans Google Maps',
                      style: GoogleFonts.inter(
                        color: TranSenColors.auroraGoldBright,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuroraRadarPainter extends CustomPainter {
  final double progress;
  _AuroraRadarPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.44);
    final maxRadius = math.min(size.width, size.height) * 0.45;

    final gridPaint = Paint()
      ..color = TranSenColors.auroraEmerald.withValues(alpha: 0.08)
      ..strokeWidth = 1;

    const step = 36.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;

    for (int i = 1; i <= 3; i++) {
      ringPaint.color = TranSenColors.auroraEmeraldLight.withValues(alpha: 0.16 / i);
      canvas.drawCircle(center, maxRadius * (i / 3), ringPaint);
    }

    // Expanding pulse ring
    final pulseRadius = maxRadius * progress;
    final pulseAlpha = (1.0 - progress) * 0.35;
    canvas.drawCircle(
      center,
      pulseRadius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = TranSenColors.auroraCyan.withValues(alpha: pulseAlpha),
    );
  }

  @override
  bool shouldRepaint(covariant _AuroraRadarPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
