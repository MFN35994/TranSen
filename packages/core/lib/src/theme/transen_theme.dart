import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'transen_colors.dart';

/// Système de thèmes Material 3 **TranSen Aurora** (Sombre signature & Clair cristallin).
class TranSenTheme {
  static ThemeData dark() {
    final baseText = GoogleFonts.interTextTheme(ThemeData.dark().textTheme);
    final displayFont = GoogleFonts.soraTextTheme(ThemeData.dark().textTheme);

    final textTheme = baseText.copyWith(
      displayLarge: displayFont.displayLarge?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w800),
      displayMedium: displayFont.displayMedium?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w800),
      displaySmall: displayFont.displaySmall?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w700),
      headlineLarge: displayFont.headlineLarge?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w700),
      headlineMedium: displayFont.headlineMedium?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w700),
      headlineSmall: displayFont.headlineSmall?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w700),
      titleLarge: displayFont.titleLarge?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w700),
      titleMedium: baseText.titleMedium?.copyWith(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w600),
      bodyLarge: baseText.bodyLarge?.copyWith(color: TranSenColors.auroraTextPrimary),
      bodyMedium: baseText.bodyMedium?.copyWith(color: TranSenColors.auroraTextSecondary),
      bodySmall: baseText.bodySmall?.copyWith(color: TranSenColors.auroraTextMuted),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: TranSenColors.obsidianBg,
      canvasColor: TranSenColors.obsidianBg,
      textTheme: textTheme,
      colorScheme: const ColorScheme.dark(
        primary: TranSenColors.auroraEmerald,
        onPrimary: Color(0xFF022C22),
        secondary: TranSenColors.auroraGold,
        onSecondary: Color(0xFF1F1602),
        tertiary: TranSenColors.auroraCyan,
        surface: TranSenColors.glassSurface,
        onSurface: TranSenColors.auroraTextPrimary,
        error: TranSenColors.auroraRose,
        onError: Colors.white,
        outline: TranSenColors.glassBorder,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: TranSenColors.deepSurface,
        foregroundColor: TranSenColors.auroraTextPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.sora(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: TranSenColors.auroraTextPrimary,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: TranSenColors.glassSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: TranSenColors.glassBorder, width: 1),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: TranSenColors.deepSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: TranSenColors.glassBorder),
        ),
        titleTextStyle: GoogleFonts.sora(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: TranSenColors.auroraTextPrimary,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: TranSenColors.deepSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: TranSenColors.elevatedSurface.withValues(alpha: 0.7),
        labelStyle: const TextStyle(color: TranSenColors.auroraTextSecondary),
        hintStyle: const TextStyle(color: TranSenColors.auroraTextMuted),
        prefixIconColor: TranSenColors.auroraEmeraldLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.glassBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.glassBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.auroraEmerald, width: 1.6),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: TranSenColors.auroraEmerald,
          foregroundColor: const Color(0xFF022C22),
          elevation: 0,
          textStyle: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: TranSenColors.auroraEmeraldLight,
          side: const BorderSide(color: TranSenColors.glassBorder, width: 1.2),
          textStyle: GoogleFonts.sora(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: TranSenColors.elevatedSurface,
        contentTextStyle: const TextStyle(color: TranSenColors.auroraTextPrimary, fontWeight: FontWeight.w500),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: TranSenColors.glassBorder),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0x1F34D399),
        thickness: 1,
      ),
    );
  }

  static ThemeData light() {
    final baseText = GoogleFonts.interTextTheme(ThemeData.light().textTheme);
    final displayFont = GoogleFonts.soraTextTheme(ThemeData.light().textTheme);

    final textTheme = baseText.copyWith(
      displayLarge: displayFont.displayLarge?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w800),
      displayMedium: displayFont.displayMedium?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w800),
      headlineMedium: displayFont.headlineMedium?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w700),
      headlineSmall: displayFont.headlineSmall?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w700),
      titleLarge: displayFont.titleLarge?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w700),
      titleMedium: baseText.titleMedium?.copyWith(color: TranSenColors.textDark, fontWeight: FontWeight.w600),
      bodyLarge: baseText.bodyLarge?.copyWith(color: TranSenColors.textDark),
      bodyMedium: baseText.bodyMedium?.copyWith(color: const Color(0xFF334155)),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: TranSenColors.lightBg,
      textTheme: textTheme,
      colorScheme: const ColorScheme.light(
        primary: TranSenColors.darkGreen,
        onPrimary: Colors.white,
        secondary: TranSenColors.auroraGold,
        onSecondary: Color(0xFF1F1602),
        tertiary: TranSenColors.auroraEmerald,
        surface: TranSenColors.lightSurface,
        onSurface: TranSenColors.textDark,
        error: TranSenColors.errorRed,
        outline: TranSenColors.lightBorder,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: TranSenColors.darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.sora(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: TranSenColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: TranSenColors.lightBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.auroraEmerald, width: 1.6),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: TranSenColors.darkGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
