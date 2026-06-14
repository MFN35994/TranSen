import "package:firebase_core/firebase_core.dart";
import "package:cloud_firestore/cloud_firestore.dart";
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'package:transen_core/transen_core.dart';
import '../data/repositories/auth_repository.dart';

class AuthState {
  final String userId;
  final String role; // 'client', 'driver', or 'none'
  final bool isLoading;
  final bool codeSent;
  final String? name;
  final String? phone;
  final int loyaltyPoints;

  AuthState({
    required this.userId,
    required this.role,
    this.isLoading = false,
    this.codeSent = false,
    this.name,
    this.phone,
    this.loyaltyPoints = 0,
  });

  AuthState copyWith({
    String? userId,
    String? role,
    bool? isLoading,
    bool? codeSent,
    String? name,
    String? phone,
    int? loyaltyPoints,
  }) {
    return AuthState(
      userId: userId ?? this.userId,
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
      codeSent: codeSent ?? this.codeSent,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
    );
  }

  Widget when({
    required Widget Function(AuthState auth) data,
    required Widget Function() loading,
    required Widget Function(Object error, StackTrace? stack) error,
  }) {
    if (isLoading) return loading();
    return data(this);
  }
}

class AuthNotifier extends Notifier<AuthState?> {
  late final AuthRepository _repository;
  final FirebaseFirestore _firestore =
      FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');

  @override
  AuthState? build() {
    _repository = ref.watch(authRepositoryProvider);
    
    // Vérification asynchrone du token local
    _checkLocalToken();
    
    return null;
  }

  Future<void> _checkLocalToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    final userId = prefs.getString('user_id');
    
    if (token != null && userId != null) {
      state = AuthState(userId: userId, role: 'none', isLoading: true);
      await _fetchUserRole(userId);
    } else {
      state = null;
    }
  }

  Future<void> _fetchUserRole(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final role = data['role'] ?? 'none';
        final name = data['name'] ?? data['firstName'];
        final phone = data['phone'] ?? state?.phone;
        final points = data['loyaltyPoints'] ?? 0;
        state = state?.copyWith(role: role, name: name, phone: phone, loyaltyPoints: points, isLoading: false);
        NotificationService().init(uid);
      } else {
        state = state?.copyWith(role: 'none', isLoading: false);
      }
    } catch (e) {
      state = state?.copyWith(role: 'none', isLoading: false);
    }
  }

  Future<void> setUserRole(String role) async {
    if (state == null) return;
    try {
      // 1. Mettre à jour le rôle sur le backend REST (met à jour Postgres et déclenche la sync Firestore)
      await ApiClient().dio.put(
        '/api/users/me',
        data: {
          'role': role,
        },
      );

      // 2. Écrire aussi localement dans Firestore par sécurité pour une mise à jour immédiate de l'écouteur
      await _firestore.collection('users').doc(state!.userId).set({
        'role': role,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      // 3. Mettre à jour les SharedPreferences locales pour préserver le rôle correct
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_role', role);

      state = state?.copyWith(role: role, isLoading: false);
      NotificationService().init(state!.userId);
    } catch (e) {
      debugPrint("Erreur saving role: $e");
      rethrow;
    }
  }

  Future<void> addLoyaltyPoints(int pointsToAdd) async {
    if (state == null) return;
    try {
      final newPoints = state!.loyaltyPoints + pointsToAdd;
      await _firestore.collection('users').doc(state!.userId).set({
        'loyaltyPoints': FieldValue.increment(pointsToAdd),
      }, SetOptions(merge: true));
      
      state = state?.copyWith(loyaltyPoints: newPoints);
    } catch (e) {
      debugPrint("Erreur ajout points fidélité: $e");
    }
  }

  Future<void> updateUserData({
    String? firstName,
    String? lastName,
    String? phone,
    String? email,
  }) async {
    try {
      final name = (firstName != null && lastName != null)
          ? "$firstName $lastName"
          : null;
      
      final updates = <String, dynamic>{
        'lastActive': FieldValue.serverTimestamp(),
      };
      if (name != null) updates['name'] = name;
      if (firstName != null) updates['firstName'] = firstName;
      if (lastName != null) updates['lastName'] = lastName;
      if (phone != null) updates['phone'] = phone.replaceAll(' ', '');
      if (email != null) updates['email'] = email;

      await _firestore.collection('users').doc(state!.userId).set(updates, SetOptions(merge: true));
      
      // Mise à jour immédiate du state
      state = state?.copyWith(
        name: name ?? state!.name,
        phone: phone ?? state!.phone,
        isLoading: false,
      );
    } catch (e) {
      debugPrint("Erreur saving user data: $e");
      rethrow;
    }
  }

  String? _phoneNumberBeingVerified;

  Future<void> sendPhoneVerificationCode(String phoneNumber) async {
    state = state?.copyWith(isLoading: true) ??
        AuthState(userId: '', role: 'none', isLoading: true);
    
    try {
      await _repository.sendOtp(phoneNumber);
      _phoneNumberBeingVerified = phoneNumber;
      state = state?.copyWith(isLoading: false, codeSent: true);
    } catch (e) {
      state = state?.copyWith(isLoading: false);
      throw Exception(e.toString());
    }
  }

  Future<void> verifySmsCode(String smsCode, {String? companyAccessCode}) async {
    state = state?.copyWith(isLoading: true);
    try {
      if (_phoneNumberBeingVerified == null) {
        throw Exception("Demandez d'abord un code SMS.");
      }
      
      final response = await _repository.verifyOtp(
        _phoneNumberBeingVerified!, 
        smsCode, 
        companyAccessCode: companyAccessCode
      );
      
      final token = response['token'];
      final role = response['role'] ?? 'none';
      final userId = response['userId'];
      
      // Sauvegarder le token dans SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', token);
      await prefs.setString('user_id', userId);
      await prefs.setString('user_role', role);

      state = AuthState(userId: userId, role: role, phone: _phoneNumberBeingVerified, isLoading: true); // isLoading true pendant qu'on fetch le reste
      
      // On peut continuer à utiliser Firestore pour les autres infos de l'utilisateur (points, etc)
      // Ou appeler un endpoint Spring Boot /api/users/me (à l'avenir).
      await _fetchUserRole(userId);
      
    } catch (e) {
      state = state?.copyWith(isLoading: false);
      throw Exception(e.toString());
    }
  }

  Future<void> signInAsAnonymousClient() async {
    try {
      final uid = "anon_${DateTime.now().millisecondsSinceEpoch}";
      await _firestore.collection('users').doc(uid).set({
        'role': 'client',
        'createdAt': FieldValue.serverTimestamp(),
      });
      state = AuthState(userId: uid, role: 'client', isLoading: false);
    } catch (e) {
      debugPrint("Erreur signInAsAnonymousClient: $e");
    }
  }

  Future<void> signUpDriver({
    required String firstName,
    required String lastName,
    required String phone,
  }) async {
    try {
      if (state == null) throw Exception("Utilisateur non authentifié (JWT manquant)");
      final uid = state!.userId;
      final name = "$firstName $lastName";
      final cleanPhone = phone.replaceAll(' ', '');

      await _firestore.collection('users').doc(uid).set({
        'role': 'driver',
        'name': name,
        'firstName': firstName,
        'lastName': lastName,
        'phone': cleanPhone,
        'email': '',
        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      state = state!.copyWith(role: 'driver', isLoading: false);

      // ── Activation automatique de l'essai gratuit 5 jours ──
      // Écriture directe en Firestore pour éviter la dépendance circulaire
      // auth ↔ payment. La logique complète avec anti-fraude est dans SubscriptionService,
      // appelé depuis le driver_signup_screen après cet appel.
      try {
        final deviceId = await DeviceUtils.getDeviceId();
        final now = DateTime.now();
        final expiresAt = now.add(const Duration(days: 5));

        // Normaliser le numéro (enlever espaces, préfixe 221 si nécessaire)
        String digits = cleanPhone.replaceAll(RegExp(r'\D'), '');
        while (digits.startsWith('221') && digits.length > 9) {
          digits = digits.substring(3);
        }
        final phoneKey = 'phone_$digits';

        // Vérifier anti-fraude : téléphone
        final phoneDoc = await _firestore.collection('phone_trials').doc(phoneKey).get();
        if (phoneDoc.exists && (phoneDoc.data()?['trialUsed'] == true)) {
          debugPrint('[Auth] ℹ️ Essai non activé: numéro déjà utilisé');
          return;
        }

        // Vérifier anti-fraude : appareil
        final deviceDoc = await _firestore.collection('devices').doc(deviceId).get();
        if (deviceDoc.exists && (deviceDoc.data()?['trialUsed'] == true)) {
          debugPrint('[Auth] ℹ️ Essai non activé: appareil déjà utilisé');
          return;
        }

        // Activation atomique (batch)
        final batch = _firestore.batch();
        batch.set(_firestore.collection('users').doc(uid), {
          'subscriptionPlan': 'trial',
          'subscriptionStart': Timestamp.fromDate(now),
          'subscriptionExpires': Timestamp.fromDate(expiresAt),
          'trialActivated': true,
        }, SetOptions(merge: true));
        batch.set(_firestore.collection('phone_trials').doc(phoneKey), {
          'trialUsed': true, 'userId': uid, 'phone': digits,
          'deviceId': deviceId, 'usedAt': Timestamp.fromDate(now),
        });
        batch.set(_firestore.collection('devices').doc(deviceId), {
          'trialUsed': true, 'userId': uid, 'phone': digits,
          'usedAt': Timestamp.fromDate(now),
        });
        await batch.commit();
        debugPrint('[Auth] ✅ Essai gratuit 5 jours activé pour $uid');
      } catch (trialError) {
        debugPrint('[Auth] ℹ️ Essai non activé: $trialError');
      }
    } catch (e) {
      debugPrint("Erreur signUpDriver: $e");
      rethrow;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_id');
    await prefs.remove('user_role');
    
    await _repository.signOut();
    state = null;
  }

  Future<void> deleteAccount() async {
    if (state == null) return;
    final uid = state!.userId;
    try {
      if (state?.role == 'driver') {
        await _firestore.collection('active_drivers').doc(uid).delete();
        await _firestore.collection('driver_routes').doc(uid).delete();
      }
      await _firestore.collection('users').doc(uid).delete();
      
      // On déconnecte l'utilisateur localement
      await logout();
      
    } catch (e) {
      debugPrint("Erreur suppression compte: $e");
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState?>(AuthNotifier.new);
