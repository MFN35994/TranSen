import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart' as dio_lib;
import '../../api/api_client.dart';

class UserRepository {
  final ApiClient _apiClient;

  UserRepository(this._apiClient);

  /// Génère un code de parrainage unique pour l'utilisateur s'il n'en a pas
  Future<String> ensureReferralCode(String userId) async {
    // Cette logique sera déplacée sur le backend plus tard si besoin.
    // Pour l'instant, on retourne juste un code.
    return "TS${userId.substring(0, 4).toUpperCase()}";
  }

  /// Récupère le profil depuis Spring Boot
  Future<Map<String, dynamic>?> getUserData() async {
    try {
      final response = await _apiClient.dio.get('/api/users/me');
      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint("Erreur chargement profil: $e");
    }
    return null;
  }

  Future<void> updateUserData(Map<String, dynamic> data) async {
    try {
      await _apiClient.dio.put('/api/users/me', data: data);
    } catch (e) {
      debugPrint("Erreur update profil: $e");
    }
  }

  Future<String?> uploadAvatar(String filePath) async {
    try {
      final fileName = filePath.split('/').last;
      final formData = dio_lib.FormData.fromMap({
        'file': await dio_lib.MultipartFile.fromFile(filePath, filename: fileName),
      });
      final response = await _apiClient.dio.post('/api/users/me/avatar', data: formData);
      if (response.statusCode == 200) {
        return response.data['avatarUrl'] as String?;
      }
    } catch (e) {
      debugPrint("Erreur upload avatar: $e");
    }
    return null;
  }
}

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ApiClient());
});
