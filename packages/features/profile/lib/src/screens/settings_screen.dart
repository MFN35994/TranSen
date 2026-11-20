import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_core/transen_core.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final notificationsEnabled = ref.watch(notificationsPreferenceProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      backgroundColor: TranSenColors.scaffoldBg(isDark),
      appBar: AppBar(
        title: const Text('Paramètres'),
        backgroundColor: isDark ? TranSenColors.deepSurface : TranSenColors.darkGreen,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSection(
            context,
            isDark,
            'Apparence & Expérience',
            [
              ListTile(
                leading: Icon(
                  isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                  color: TranSenColors.auroraEmeraldLight,
                ),
                title: Text(
                  'Thème TranSen Aurora Sombre',
                  style: TextStyle(color: TranSenColors.primaryText(isDark), fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  isDarkMode ? 'Émeraude-Obsidienne actif' : 'Mode Clair cristallin actif',
                  style: TextStyle(color: TranSenColors.secondaryText(isDark), fontSize: 12),
                ),
                trailing: Switch(
                  value: isDarkMode,
                  onChanged: (val) => ref
                      .read(themeProvider.notifier)
                      .setThemeMode(val ? ThemeMode.dark : ThemeMode.light),
                  activeThumbColor: TranSenColors.auroraEmeraldLight,
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.notifications_active_outlined, color: TranSenColors.auroraCyan),
                title: Text(
                  'Notifications & Alertes Trajets',
                  style: TextStyle(color: TranSenColors.primaryText(isDark), fontWeight: FontWeight.w600),
                ),
                trailing: Switch(
                  value: notificationsEnabled,
                  onChanged: (val) => ref.read(notificationsPreferenceProvider.notifier).setEnabled(val),
                  activeThumbColor: TranSenColors.auroraEmeraldLight,
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.translate_rounded, color: TranSenColors.auroraGold),
                title: Text(
                  'Langue de l\'application',
                  style: TextStyle(color: TranSenColors.primaryText(isDark), fontWeight: FontWeight.w600),
                ),
                trailing: DropdownButton<String>(
                  value: locale.languageCode,
                  underline: const SizedBox.shrink(),
                  dropdownColor: isDark ? TranSenColors.deepSurface : Colors.white,
                  style: TextStyle(
                    color: TranSenColors.auroraEmeraldLight,
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                  ),
                  items: const [
                    DropdownMenuItem(value: 'fr', child: Text('Français')),
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'wo', child: Text('Wolof')),
                  ],
                  onChanged: (code) {
                    if (code != null) {
                      ref.read(localeProvider.notifier).setLocale(Locale(code));
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildSection(
            context,
            isDark,
            'Mentions Légales & Confidentialité',
            [
              ListTile(
                leading: const Icon(Icons.description_outlined, color: TranSenColors.auroraEmeraldLight),
                title: Text(
                  'Conditions Générales d\'Utilisation',
                  style: TextStyle(color: TranSenColors.primaryText(isDark), fontWeight: FontWeight.w600),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const LegalScreen(
                      title: 'Conditions Générales',
                      assetPath: 'assets/legal/cgu.md',
                    ),
                  ),
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined, color: TranSenColors.auroraCyan),
                title: Text(
                  'Politique de Confidentialité',
                  style: TextStyle(color: TranSenColors.primaryText(isDark), fontWeight: FontWeight.w600),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const LegalScreen(
                      title: 'Politique de Confidentialité',
                      assetPath: 'assets/legal/politique_confidentialite.md',
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildSection(
            context,
            isDark,
            'Compte & Sécurité',
            [
              ListTile(
                leading: const Icon(Icons.delete_forever_outlined, color: TranSenColors.auroraRose),
                title: const Text(
                  'Supprimer définitivement mon compte',
                  style: TextStyle(color: TranSenColors.auroraRose, fontWeight: FontWeight.w700),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: TranSenColors.auroraRose),
                onTap: () => _showDeleteConfirmation(context, ref),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Center(
            child: AppVersionWidget(
              color: TranSenColors.secondaryText(isDark).withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, bool isDark, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 10),
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 1.2,
              color: TranSenColors.secondaryText(isDark),
            ),
          ),
        ),
        AuroraGlassCard(
          padding: const EdgeInsets.symmetric(vertical: 4),
          borderRadius: 20,
          child: Column(children: children),
        ),
      ],
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Supprimer le compte ?"),
        content: const Text(
          "Cette action est irréversible. Toutes vos données personnelles seront définitivement supprimées.",
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("ANNULER")),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(authProvider.notifier).deleteAccount();
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(e.toString().replaceAll("Exception: ", "")),
                      backgroundColor: TranSenColors.auroraRose,
                    ),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: TranSenColors.auroraRose),
            child: const Text("SUPPRIMER DÉFINITIVEMENT"),
          ),
        ],
      ),
    );
  }
}
