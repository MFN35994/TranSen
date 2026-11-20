import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_profile/transen_profile.dart';
import 'package:transen_payment/transen_payment.dart';
import 'package:transen_trips/transen_trips.dart';
import '../settings/support_ticket_screen.dart';
import '../driver/statistics_screen.dart';

final userFutureProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, userId) async {
  ref.watch(authProvider); // Re-run and refresh cache whenever the user details change
  return ref.read(userRepositoryProvider).getUserData();
});


class ProfileDrawer extends ConsumerWidget {
  const ProfileDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final userId = auth?.userId ?? '';
    // Sécurité : on s'assure que le rôle est bien détecté, sinon défaut à 'client'
    final role = auth?.role ?? 'client';
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Drawer(
      backgroundColor: isDark ? TranSenColors.deepSurface : TranSenColors.lightSurface,
      child: Column(
        children: [
          // En-tête Profil
          _buildHeader(context, ref, userId, role),
          
          const SizedBox(height: 10),

          // Menu Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildMenuItem(
                  context: context,
                  icon: Icons.person_outline,
                  title: 'Mon Profil',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
                  },
                ),
                _buildMenuItem(
                  context: context,
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'TransPay Wallet',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                  },
                ),
                _buildMenuItem(
                  context: context,
                  icon: Icons.receipt_long_outlined,
                  title: 'Mes Trajets & Billets',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
                  },
                ),
                _buildMenuItem(
                  context: context,
                  icon: Icons.favorite_border,
                  title: 'Adresses & Favoris',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoritesScreen()));
                  },
                ),
                _buildMenuItem(
                  context: context,
                  icon: Icons.card_giftcard_outlined,
                  title: 'Parrainage & Bonus',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
                  },
                ),
                if (role == 'driver') ...[
                  _buildMenuItem(
                    context: context,
                    icon: Icons.bar_chart_rounded,
                    title: 'Mes Statistiques & Avis',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const StatisticsScreen()));
                    },
                  ),
                  _buildMenuItem(
                    context: context,
                    icon: Icons.workspace_premium_outlined,
                    title: 'Abonnement Chauffeur',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
                    },
                  ),
                ],
                _buildMenuItem(
                  context: context,
                  icon: Icons.support_agent,
                  title: 'Assistance & Contact (IA)',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SupportTicketScreen()),
                    );
                  },
                ),
                _buildMenuItem(
                  context: context,
                  icon: Icons.settings_outlined,
                  title: 'Paramètres',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
                  },
                ),
                Consumer(
                  builder: (context, ref, child) {
                    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
                    final isDark = Theme.of(context).brightness == Brightness.dark;
                    return ListTile(
                      leading: Icon(isDarkMode ? Icons.dark_mode : Icons.light_mode, color: isDark ? Colors.white70 : Colors.black87),
                      title: Text(
                        'Mode Sombre',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      trailing: Switch(
                        value: isDarkMode,
                        onChanged: (val) {
                          ref.read(themeProvider.notifier).setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
                        },
                        activeThumbColor: TranSenColors.primaryGreen,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 25, vertical: 0),
                    );
                  },
                ),

                const Divider(indent: 20, endIndent: 20),

                _buildMenuItem(
                  context: context,
                  icon: Icons.logout,
                  title: 'Déconnexion',
                  titleColor: Colors.red,
                  iconColor: Colors.red,
                  onTap: () async {
                    // On ferme le tiroir avant de se déconnecter
                    Navigator.pop(context);
                    ref.invalidate(driverProfileProvider);
                    await ref.read(authProvider.notifier).logout();
                  },
                ),
              ],
            ),
          ),

          // Version en bas
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: AppVersionWidget(
              fontSize: 12,
              color: TranSenColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, String userId, String? role) {
    if (userId.isEmpty) return const SizedBox.shrink();

    final userFuture = ref.watch(userFutureProvider(userId));

    return userFuture.when(
      data: (userData) {
        String name = (userData?['fullName'] ?? userData?['name'] ?? '').toString().trim();
        if (name.isEmpty && userData?['firstName'] != null) {
          name = "${userData!['firstName']} ${userData['lastName'] ?? ''}".trim();
        }
        if (name.isEmpty) {
          name = role == 'driver' ? 'Chauffeur TranSen' : 'Client TranSen';
        }

        final String? avatarUrl = userData?['avatarUrl'] as String?;
        final String phoneStr = (userData?['phone'] ?? '').toString();
        final String email = (userData?['email'] ?? '').toString().trim();
        final int points = (userData?['loyaltyPoints'] as num?)?.toInt() ?? 0;

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 58, bottom: 26, left: 22, right: 22),
          decoration: BoxDecoration(
            gradient: role == 'driver'
                ? const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF0A291E), Color(0xFF04140E)],
                  )
                : const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF064E3B), Color(0xFF0B6E4F), Color(0xFF042F24)],
                  ),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(36),
              bottomRight: Radius.circular(18),
            ),
            border: Border(
              bottom: BorderSide(
                color: (role == 'driver'
                        ? TranSenColors.auroraGold
                        : TranSenColors.auroraEmeraldLight)
                    .withValues(alpha: 0.4),
              ),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(2.5),
                    decoration: BoxDecoration(
                      gradient: role == 'driver'
                          ? TranSenColors.auroraGoldGradient
                          : TranSenColors.auroraPrimaryGradient,
                      shape: BoxShape.circle,
                    ),
                    child: CircleAvatar(
                      radius: 32,
                      backgroundColor: TranSenColors.obsidianBg,
                      backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                          ? NetworkImage(avatarUrl)
                          : null,
                      child: avatarUrl != null && avatarUrl.isNotEmpty
                          ? null
                          : const Icon(Icons.person_rounded,
                              size: 36, color: TranSenColors.auroraEmeraldLight),
                    ),
                  ),
                  const Spacer(),
                  AuroraStatusPill(
                    label: role == 'driver' ? 'CHAUFFEUR' : '$points PTS',
                    color: role == 'driver'
                        ? TranSenColors.auroraGoldBright
                        : TranSenColors.auroraCyan,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: TranSenColors.auroraTextPrimary,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (userData?['isVerified'] == true) ...[
                    const SizedBox(width: 6),
                    const Icon(Icons.verified_rounded, color: TranSenColors.auroraCyan, size: 19),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              if (phoneStr.isNotEmpty)
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, color: TranSenColors.auroraEmeraldLight, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      phoneStr,
                      style: const TextStyle(color: TranSenColors.auroraTextSecondary, fontSize: 13),
                    ),
                  ],
                ),
              if (email.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.email_outlined, color: Colors.white60, size: 14),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        email,
                        style: const TextStyle(color: Colors.white70, fontSize: 12.5),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 14),
              // Pillule TransPay Wallet
              Consumer(
                builder: (context, ref, child) {
                  try {
                    final wallet = ref.watch(walletProvider);
                    return GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                        decoration: BoxDecoration(
                          color: TranSenColors.obsidianBg.withValues(alpha: 0.48),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: TranSenColors.auroraGold.withValues(alpha: 0.42),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.account_balance_wallet_rounded,
                                color: TranSenColors.auroraGoldBright, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              "${wallet.value?.balance.toInt() ?? 0} FCFA",
                              style: const TextStyle(
                                color: TranSenColors.auroraGoldBright,
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.chevron_right, color: Colors.white70, size: 16),
                          ],
                        ),
                      ),
                    );
                  } catch (e) {
                    // Fallback silencieux si le provider n'est pas prêt
                    return const SizedBox.shrink();
                  }
                }
              ),
              const SizedBox(height: 15),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  role == 'driver' ? 'CHAUFFEUR' : 'CLIENT',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => Container(
        width: double.infinity,
        height: 250,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              role == 'driver' ? TranSenColors.darkGreen : Theme.of(context).colorScheme.primary,
              role == 'driver' ? TranSenColors.primaryGreen : Theme.of(context).colorScheme.primary.withValues(alpha: 0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(40)),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white70),
        ),
      ),
      error: (_, __) => Container(
        width: double.infinity,
        height: 250,
        decoration: BoxDecoration(
          color: Colors.grey[800],
          borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(40)),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.white54, size: 40),
            SizedBox(height: 10),
            Text("Profil indisponible", style: TextStyle(color: Colors.white70, fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? iconColor,
    Color? titleColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListTile(
      leading: Icon(icon, color: iconColor ?? (isDark ? Colors.white70 : Colors.black87)),
      title: Text(
        title,
        style: TextStyle(
          color: titleColor ?? (isDark ? Colors.white : Colors.black87),
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 25, vertical: 5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
    );
  }

}
