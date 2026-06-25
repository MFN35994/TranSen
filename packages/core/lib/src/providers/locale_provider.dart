import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleNotifier extends Notifier<Locale> {
  SharedPreferences? _prefs;

  @override
  Locale build() {
    if (_prefs != null) {
      final savedCode = _prefs!.getString('language_code');
      if (savedCode != null) {
        return Locale(savedCode);
      }
    }
    return const Locale('fr');
  }

  void init(SharedPreferences prefs) {
    _prefs = prefs;
  }

  Future<void> setLocale(Locale locale) async {
    if (_prefs != null) {
      await _prefs!.setString('language_code', locale.languageCode);
    }
    state = locale;
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(() {
  return LocaleNotifier();
});
