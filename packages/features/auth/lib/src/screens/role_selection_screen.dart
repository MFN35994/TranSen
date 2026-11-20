import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class RoleSelectionScreen extends ConsumerStatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  ConsumerState<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends ConsumerState<RoleSelectionScreen> {
  bool _localLoading = false;

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: TranSenColors.auroraRose,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final isLoading = (authState?.isLoading ?? false) || _localLoading;

    return Scaffold(
      backgroundColor: TranSenColors.scaffoldBg(isDarkMode),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_rounded,
            color: TranSenColors.primaryText(isDarkMode),
          ),
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text("Retourner à la connexion"),
                content: const Text(
                    "Voulez-vous vous déconnecter pour retourner à l'écran de connexion ?"),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text("Non"),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text("Oui, se déconnecter",
                        style: TextStyle(color: TranSenColors.auroraRose)),
                  ),
                ],
              ),
            );
            if (confirm == true) {
              setState(() => _localLoading = true);
              try {
                await ref.read(authProvider.notifier).logout();
              } catch (e) {
                _showError("Erreur lors de la déconnexion : $e");
              } finally {
                if (mounted) setState(() => _localLoading = false);
              }
            }
          },
        ),
      ),
      body: PremiumBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: TranSenColors.auroraEmeraldLight),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Spacer(),
                      Center(
                        child: Hero(
                          tag: 'auth_icon',
                          child: Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(28),
                              gradient: TranSenColors.auroraPrimaryGradient,
                              boxShadow: [
                                BoxShadow(
                                  color: TranSenColors.auroraEmerald.withValues(alpha: 0.35),
                                  blurRadius: 28,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.verified_user_rounded,
                              size: 44,
                              color: Color(0xFF022C22),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Choisissez votre espace',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w800,
                          color: TranSenColors.primaryText(isDarkMode),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Comment souhaitez-vous utiliser TranSen Aurora ?',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14.5,
                          color: TranSenColors.secondaryText(isDarkMode),
                        ),
                      ),
                      const SizedBox(height: 36),
                      _buildRoleCard(
                        context,
                        title: 'Je suis Passager / Client',
                        subtitle: 'VTC Allô Dakar, bus interurbains, covoiturage & colis Yobanté',
                        badge: 'CLIENT',
                        icon: Icons.person_pin_circle_rounded,
                        color: TranSenColors.auroraEmeraldLight,
                        onTap: () async {
                          await HapticFeedback.mediumImpact();
                          setState(() => _localLoading = true);
                          try {
                            final notifier = ref.read(authProvider.notifier);
                            if (ref.read(authProvider) == null) {
                              await notifier.signInAsAnonymousClient();
                            } else {
                              await notifier.setUserRole('client');
                            }
                          } catch (e) {
                            _showError("Erreur de définition du rôle : ${e.toString()}");
                          } finally {
                            if (mounted) setState(() => _localLoading = false);
                          }
                        },
                      ),
                      const SizedBox(height: 18),
                      _buildRoleCard(
                        context,
                        title: 'Je suis Chauffeur Partenaire',
                        subtitle: 'Recevoir des courses, gérer vos trajets & encaisser vos gains',
                        badge: 'CHAUFFEUR · 5 JOURS OFFERTS',
                        icon: Icons.local_taxi_rounded,
                        color: TranSenColors.auroraGold,
                        onTap: () async {
                          await HapticFeedback.mediumImpact();
                          if (ref.read(authProvider) == null) {
                            _showError("Veuillez d'abord vous connecter par téléphone.");
                            return;
                          }
                          setState(() => _localLoading = true);
                          try {
                            await ref.read(authProvider.notifier).setUserRole('driver');
                          } catch (e) {
                            _showError("Erreur de définition du rôle : ${e.toString()}");
                          } finally {
                            if (mounted) setState(() => _localLoading = false);
                          }
                        },
                      ),
                      const Spacer(),
                      Center(
                        child: AppVersionWidget(
                          color: TranSenColors.secondaryText(isDarkMode).withValues(alpha: 0.6),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String badge,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return AuroraGlassCard(
      onTap: onTap,
      accentColor: color,
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: color.withValues(alpha: 0.4)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w700,
                    color: TranSenColors.primaryText(isDarkMode),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12.5,
                    height: 1.35,
                    color: TranSenColors.secondaryText(isDarkMode),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Icon(Icons.arrow_forward_ios_rounded, size: 16, color: color),
        ],
      ),
    );
  }
}
