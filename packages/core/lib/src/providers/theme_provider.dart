import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  SharedPreferences? _prefs;

  @override
  ThemeMode build() {
    if (_prefs != null) {
      final themeIndex = _prefs!.getInt('theme_mode');
      if (themeIndex != null && themeIndex >= 0 && themeIndex < ThemeMode.values.length) {
        return ThemeMode.values[themeIndex];
      }
    }
    // Identité signature TranSen Aurora Dark par défaut
    return ThemeMode.dark;
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

class NotificationsPreferenceNotifier extends Notifier<bool> {
  @override
  bool build() {
    _load();
    return true;
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getBool('notifications_enabled');
    if (saved != null && saved != state) {
      state = saved;
    }
  }

  Future<void> setEnabled(bool enabled) async {
    state = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
  }
}

final notificationsPreferenceProvider =
    NotifierProvider<NotificationsPreferenceNotifier, bool>(NotificationsPreferenceNotifier.new);
