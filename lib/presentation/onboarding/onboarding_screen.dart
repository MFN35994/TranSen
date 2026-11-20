import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:transen_core/transen_core.dart';
import '../../main.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingSlide> _pages = const [
    _OnboardingSlide(
      badge: 'URBAIN & INTERURBAIN · 14 RÉGIONS',
      title: 'Bienvenue dans\nl\'ère TranSen Aurora',
      description:
          'Allô Dakar VTC, bus interurbains climatisés et covoiturage intelligent réunis dans une seule super-app sénégalaise.',
      icon: Icons.directions_car_filled_rounded,
      accent: TranSenColors.auroraEmeraldLight,
      highlights: ['Suivi GPS temps réel', 'Tarifs transparents', '14 Régions couvertes'],
    ),
    _OnboardingSlide(
      badge: 'FINTECH TRANSPAY · 2 % SEULEMENT',
      title: 'Voyagez & payez\nsans friction',
      description:
          'Réservez votre siège avec billet QR sécurisé via Wave, Orange Money, Free Money ou votre portefeuille TransPay.',
      icon: Icons.qr_code_2_rounded,
      accent: TranSenColors.auroraGold,
      highlights: ['Billet QR instantané', 'Wave & Orange Money', 'Sécurité chiffrée'],
    ),
    _OnboardingSlide(
      badge: 'LOGISTIQUE NATIONALE YOBANTÉ',
      title: 'Expédiez vos colis\npartout au Sénégal',
      description:
          'Confiez vos colis à nos chauffeurs et compagnies partenaires vérifiés, avec suivi en direct jusqu\'à la remise.',
      icon: Icons.local_shipping_rounded,
      accent: TranSenColors.auroraCyan,
      highlights: ['Livraison rapide', 'Chauffeurs vérifiés', 'Support IA 24/7'],
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finishOnboarding() async {
    await HapticFeedback.lightImpact();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AuthGate()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeSlide = _pages[_currentPage];

    return Scaffold(
      backgroundColor: TranSenColors.scaffoldBg(isDark),
      body: PremiumBackground(
        blobColors: [
          activeSlide.accent.withValues(alpha: 0.24),
          TranSenColors.auroraEmerald.withValues(alpha: 0.16),
          TranSenColors.auroraGold.withValues(alpha: 0.10),
        ],
        child: SafeArea(
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: TranSenColors.glassSurface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: TranSenColors.glassBorder),
                          ),
                          child: Image.asset(
                            'assets/images/logo.png',
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.bolt_rounded,
                              color: TranSenColors.auroraEmeraldLight,
                              size: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'TranSen',
                          style: GoogleFonts.sora(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: TranSenColors.primaryText(isDark),
                          ),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: _finishOnboarding,
                      child: Text(
                        'PASSER',
                        style: GoogleFonts.inter(
                          color: TranSenColors.secondaryText(isDark),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Pages
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _pages.length,
                  onPageChanged: (index) => setState(() => _currentPage = index),
                  itemBuilder: (context, index) => _OnboardingPage(
                    slide: _pages[index],
                    isDark: isDark,
                  ),
                ),
              ),

              // Bottom controls
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 10, 24, 28),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: List.generate(
                        _pages.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 280),
                          margin: const EdgeInsets.only(right: 8),
                          height: 8,
                          width: _currentPage == index ? 28 : 8,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? activeSlide.accent
                                : (isDark ? Colors.white24 : Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: _currentPage == index
                                ? [
                                    BoxShadow(
                                      color: activeSlide.accent.withValues(alpha: 0.5),
                                      blurRadius: 10,
                                    ),
                                  ]
                                : null,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 175,
                      child: AuroraGradientButton(
                        label: _currentPage == _pages.length - 1 ? 'COMMENCER' : 'SUIVANT',
                        icon: _currentPage == _pages.length - 1
                            ? Icons.rocket_launch_rounded
                            : Icons.arrow_forward_rounded,
                        gold: _currentPage == _pages.length - 1,
                        height: 50,
                        onPressed: () {
                          if (_currentPage == _pages.length - 1) {
                            _finishOnboarding();
                          } else {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 420),
                              curve: Curves.easeOutCubic,
                            );
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  final String badge;
  final String title;
  final String description;
  final IconData icon;
  final Color accent;
  final List<String> highlights;

  const _OnboardingSlide({
    required this.badge,
    required this.title,
    required this.description,
    required this.icon,
    required this.accent,
    required this.highlights,
  });
}

class _OnboardingPage extends StatelessWidget {
  final _OnboardingSlide slide;
  final bool isDark;

  const _OnboardingPage({required this.slide, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 26),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Futuristic Aurora Orb Illustration (100% offline-safe & instant)
          Container(
            width: 196,
            height: 196,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  slide.accent.withValues(alpha: 0.28),
                  slide.accent.withValues(alpha: 0.05),
                  Colors.transparent,
                ],
              ),
              border: Border.all(color: slide.accent.withValues(alpha: 0.35), width: 1.4),
              boxShadow: [
                BoxShadow(
                  color: slide.accent.withValues(alpha: 0.25),
                  blurRadius: 48,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Center(
              child: Container(
                width: 118,
                height: 118,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(34),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      isDark ? TranSenColors.elevatedSurface : Colors.white,
                      isDark ? TranSenColors.deepSurface : const Color(0xFFE6F7EF),
                    ],
                  ),
                  border: Border.all(color: slide.accent.withValues(alpha: 0.55), width: 1.5),
                ),
                child: Icon(slide.icon, size: 58, color: slide.accent),
              ),
            ),
          ),
          const SizedBox(height: 30),
          AuroraStatusPill(label: slide.badge, color: slide.accent),
          const SizedBox(height: 18),
          Text(
            slide.title,
            textAlign: TextAlign.center,
            style: GoogleFonts.sora(
              fontSize: 28,
              height: 1.18,
              fontWeight: FontWeight.w800,
              color: TranSenColors.primaryText(isDark),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            slide.description,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14.5,
              height: 1.55,
              color: TranSenColors.secondaryText(isDark),
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: slide.highlights
                .map(
                  (h) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: isDark
                          ? TranSenColors.glassSurface.withValues(alpha: 0.85)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? slide.accent.withValues(alpha: 0.25) : TranSenColors.lightBorder,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle_rounded, size: 14, color: slide.accent),
                        const SizedBox(width: 6),
                        Text(
                          h,
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: TranSenColors.primaryText(isDark),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}
