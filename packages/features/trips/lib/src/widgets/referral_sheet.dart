import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_core/transen_core.dart';
import 'package:share_plus/share_plus.dart';

class ReferralSheet extends ConsumerWidget {
  const ReferralSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (auth == null || auth.userId.isEmpty) return const SizedBox.shrink();

    final cleanId = auth.userId.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
    final referralCode = (cleanId.length >= 8 ? cleanId.substring(0, 8) : cleanId.padRight(8, 'X')).toUpperCase();

    return Container(
      height: MediaQuery.of(context).size.height * 0.68,
      decoration: BoxDecoration(
        color: isDark ? TranSenColors.deepSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        border: Border(
          top: BorderSide(
            color: TranSenColors.auroraGold.withValues(alpha: isDark ? 0.35 : 0.25),
            width: 1.2,
          ),
        ),
      ),
      padding: const EdgeInsets.all(25),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: TranSenColors.auroraGold.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 26),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: TranSenColors.auroraGold.withValues(alpha: 0.16),
              shape: BoxShape.circle,
              border: Border.all(color: TranSenColors.auroraGold.withValues(alpha: 0.45)),
            ),
            child: const Icon(Icons.card_giftcard_rounded, size: 48, color: TranSenColors.auroraGold),
          ),
          const SizedBox(height: 18),
          Text(
            "Parrainez et gagnez !",
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: TranSenColors.primaryText(isDark),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Partagez votre code avec vos amis et gagnez 10 points (100 FCFA) pour chaque premier trajet effectué par vos filleuls.",
            textAlign: TextAlign.center,
            style: TextStyle(color: TranSenColors.secondaryText(isDark), height: 1.45),
          ),
          const SizedBox(height: 28),
          AuroraGlassCard(
            accentColor: TranSenColors.auroraGold,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "VOTRE CODE PARRAINAGE",
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                        color: TranSenColors.auroraGold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      referralCode,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.5,
                        color: TranSenColors.primaryText(isDark),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded, color: TranSenColors.auroraGold),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: referralCode));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Code copié dans le presse-papiers !")),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          SizedBox(
            width: double.infinity,
            child: AuroraGradientButton(
              label: "PARTAGER MON CODE",
              icon: Icons.share_rounded,
              gold: true,
              onPressed: () {
                SharePlus.instance.share(
                  ShareParams(
                    text: "Rejoins-moi sur TranSen Aurora et utilise mon code $referralCode pour tes trajets au Sénégal ! https://app.transen.org",
                    subject: "Invitation TranSen Aurora",
                  ),
                );
              },
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("PLUS TARD", style: TextStyle(color: TranSenColors.secondaryText(isDark))),
          ),
        ],
      ),
    );
  }
}
