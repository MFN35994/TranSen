import 'dart:ui';
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
      backgroundColor: Colors.redAccent,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final isLoading = (authState?.isLoading ?? false) || _localLoading;

    return Scaffold(
      backgroundColor: isDarkMode ? const Color(0xFF121212) : TranSenColors.primaryGreen,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text("Retourner en arrière"),
                content: const Text("Voulez-vous vous déconnecter pour retourner à l'écran de connexion ?"),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text("Non"),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text("Oui, se déconnecter", style: TextStyle(color: Colors.red)),
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
        blobColors: isDarkMode 
          ? [Colors.blue.withValues(alpha: 0.1), Colors.purple.withValues(alpha: 0.1)]
          : [Colors.white.withValues(alpha: 0.2), Colors.greenAccent.withValues(alpha: 0.2)],
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Hero(
                        tag: 'auth_icon',
                        child: Icon(Icons.account_circle, 
                          size: 80, 
                          color: isDarkMode ? TranSenColors.primaryGreen : Colors.white),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Finalisez votre profil',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Comment souhaitez-vous utiliser TranSen ?',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16, color: isDarkMode ? Colors.white70 : Colors.white.withValues(alpha: 0.8)),
                      ),
                      const SizedBox(height: 50),
                      
                      _buildRoleCard(
                        context,
                        title: 'Je suis Client',
                        subtitle: 'Commander des courses et colis',
                        icon: Icons.person_pin,
                        color: TranSenColors.primaryGreen,
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
                      
                      const SizedBox(height: 20),
                      
                      _buildRoleCard(
                        context,
                        title: 'Je suis Chauffeur',
                        subtitle: 'Accepter des courses et gagner de l argent',
                        icon: Icons.local_taxi,
                        color: Colors.black87,
                        onTap: () async {
                          await HapticFeedback.mediumImpact();
                          setState(() => _localLoading = true);
                          try {
                            final notifier = ref.read(authProvider.notifier);
                            if (ref.read(authProvider) == null) {
                              await notifier.signInAsAnonymousClient();
                            } else {
                              await notifier.setUserRole('driver');
                            }
                          } catch (e) {
                            _showError("Erreur de définition du rôle : ${e.toString()}");
                          } finally {
                            if (mounted) setState(() => _localLoading = false);
                          }
                        },
                      ),
                      const Spacer(),
                      Text(
                        'v1.0.0+1',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: isDarkMode ? Colors.white24 : Colors.white54,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDarkMode 
                ? Colors.white.withValues(alpha: 0.05) 
                : Colors.white.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDarkMode 
                  ? Colors.white.withValues(alpha: 0.1) 
                  : Colors.white.withValues(alpha: 0.3)
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                )
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: isDarkMode ? color.withValues(alpha: 0.1) : TranSenColors.primaryGreen.withValues(alpha: 0.1),
                  child: Icon(icon, color: isDarkMode ? color : TranSenColors.primaryGreen),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, 
                        style: TextStyle(
                          fontSize: 18, 
                          fontWeight: FontWeight.bold, 
                          color: isDarkMode ? Colors.white : TranSenColors.primaryGreen
                        )
                      ),
                      Text(subtitle, 
                        style: TextStyle(
                          fontSize: 13, 
                          color: isDarkMode ? Colors.white70 : TranSenColors.primaryGreen.withValues(alpha: 0.7)
                        )
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: isDarkMode ? Colors.white30 : TranSenColors.primaryGreen),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
