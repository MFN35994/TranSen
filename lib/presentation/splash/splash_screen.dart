import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:transen_core/transen_core.dart';

/// Écran de démarrage signature **TranSen Aurora** (purement présentationnel,
/// piloté réactivement par `InitialGate` / `AuthGate` sans Timer conflictuel).
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1900),
    )..repeat(reverse: true);
    _scaleAnim = Tween<double>(begin: 0.96, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TranSenColors.obsidianBg,
      body: PremiumBackground(
        blobColors: [
          TranSenColors.auroraEmerald.withValues(alpha: 0.28),
          TranSenColors.auroraCyan.withValues(alpha: 0.16),
          TranSenColors.auroraGold.withValues(alpha: 0.14),
        ],
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ScaleTransition(
                  scale: _scaleAnim,
                  child: Container(
                    width: 148,
                    height: 148,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(38),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF0E3426), Color(0xFF061A12)],
                      ),
                      border: Border.all(
                        color: TranSenColors.auroraEmeraldLight.withValues(alpha: 0.45),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: TranSenColors.auroraEmerald.withValues(alpha: 0.35),
                          blurRadius: 46,
                          spreadRadius: 2,
                        ),
                        BoxShadow(
                          color: TranSenColors.auroraCyan.withValues(alpha: 0.18),
                          blurRadius: 28,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.directions_transit_filled_rounded,
                        size: 72,
                        color: TranSenColors.auroraEmeraldLight,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [
                      TranSenColors.auroraTextPrimary,
                      TranSenColors.auroraEmeraldLight,
                      TranSenColors.auroraGoldBright,
                    ],
                  ).createShader(bounds),
                  child: Text(
                    'TranSen',
                    style: GoogleFonts.sora(
                      fontSize: 38,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'MOBILITÉ SOUVERAINE · SÉNÉGAL',
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: TranSenColors.auroraTextSecondary.withValues(alpha: 0.8),
                    letterSpacing: 2.4,
                  ),
                ),
                const SizedBox(height: 34),
                SizedBox(
                  width: 140,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: const LinearProgressIndicator(
                      minHeight: 3.5,
                      backgroundColor: Color(0x2634D399),
                      valueColor: AlwaysStoppedAnimation<Color>(TranSenColors.auroraEmeraldLight),
                    ),
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
