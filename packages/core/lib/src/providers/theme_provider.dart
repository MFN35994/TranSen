import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  SharedPreferences? _prefs;

  @override
  ThemeMode build() {
    if (_prefs != null) {
      final themeIndex = _prefs!.getInt('theme_mode');
      if (themeIndex != null) {
        return ThemeMode.values[themeIndex];
      }
    }
    return ThemeMode.light;
  }

  void init(SharedPreferences prefs) {
    _prefs = prefs;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    if (_prefs != null) {
      await _prefs!.setInt('theme_mode', mode.index);
    }
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);
