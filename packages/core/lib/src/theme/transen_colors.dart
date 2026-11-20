import 'package:flutter/material.dart';

/// Palette officielle **TranSen Aurora** — Identité visuelle unifiée
/// (app.transen.org · Android · iOS · transen.org · compagnie · admin · investir)
class TranSenColors {
  // === Couleurs principales (Compatibilité héritée + Aurora) ===
  static const Color primaryGreen = Color(0xFF10B981); // Aurora Emerald
  static const Color darkGreen = Color(0xFF064E3B);    // Deep Forest Emerald
  static const Color accentGold = Color(0xFFF5B83D);   // Aurora Gold

  // === Palette Signature TranSen Aurora Dark ===
  static const Color obsidianBg = Color(0xFF03100B);       // Fond principal obsidienne émeraude
  static const Color deepSurface = Color(0xFF061510);      // Surface secondaire profonde
  static const Color glassSurface = Color(0xFF0A2219);     // Carte verre émeraude
  static const Color elevatedSurface = Color(0xFF0F2E22);  // Surface surélevée / input
  static const Color auroraEmerald = Color(0xFF10B981);    // Accent principal émeraude
  static const Color auroraEmeraldLight = Color(0xFF34D399);
  static const Color auroraCyan = Color(0xFF22D3EE);       // Reflet cyan télémétrie
  static const Color auroraGold = Color(0xFFF5B83D);       // Or souverain premium
  static const Color auroraGoldBright = Color(0xFFFDE68A);
  static const Color auroraRose = Color(0xFFFB7185);       // Alerte / danger doux

  // === Palette Aurora Light (Mode Clair raffiné) ===
  static const Color lightBg = Color(0xFFF2FAF6);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFD1EAE0);

  // === Textes & Bordures ===
  static const Color auroraTextPrimary = Color(0xFFF0FDF7);
  static const Color auroraTextSecondary = Color(0xFFCBD5E1);
  static const Color auroraTextMuted = Color(0xFF94A3B8);
  static const Color glassBorder = Color(0x2E34D399); // ~18% emerald border

  // === Couleurs héritées (préservées pour rétrocompatibilité totale) ===
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF062016);
  static const Color textLight = Color(0xFFF0FDF7);

  // === Couleurs utilitaires ===
  static const Color errorRed = Color(0xFFEF4444);
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color infoBlue = Color(0xFF0EA5E9);
  static const Color grey = Color(0xFF94A3B8);

  // === Dégradés Signature Aurora ===
  static const LinearGradient auroraPrimaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF059669), Color(0xFF10B981), Color(0xFF34D399)],
  );

  static const LinearGradient auroraGoldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD97706), Color(0xFFF5B83D), Color(0xFFFDE68A)],
  );

  static const LinearGradient auroraObsidianGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF020B08), Color(0xFF03100B), Color(0xFF071E16)],
  );

  static const LinearGradient auroraCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xE60B261B), Color(0xE6061610)],
  );

  static Color scaffoldBg(bool isDark) => isDark ? obsidianBg : lightBg;
  static Color cardBg(bool isDark) => isDark ? glassSurface : lightSurface;
  static Color surfaceBg(bool isDark) => isDark ? deepSurface : const Color(0xFFEAF6F0);
  static Color borderColor(bool isDark) => isDark ? glassBorder : lightBorder;
  static Color primaryText(bool isDark) => isDark ? auroraTextPrimary : textDark;
  static Color secondaryText(bool isDark) => isDark ? auroraTextSecondary : const Color(0xFF475569);
}
