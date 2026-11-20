import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart' as dio_lib;
import '../../api/api_client.dart';

class UserRepository {
  final ApiClient _apiClient;

  UserRepository(this._apiClient);

  /// Génère un code de parrainage unique pour l'utilisateur s'il n'en a pas
  Future<String> ensureReferralCode(String userId) async {
    final clean = userId.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
    final prefix = clean.length >= 4 ? clean.substring(0, 4) : clean.padRight(4, 'X');
    return "TS$prefix";
  }

  /// Récupère le profil depuis Spring Boot
  Future<Map<String, dynamic>?> getUserData() async {
    try {
      final response = await _apiClient.dio.get('/api/users/me');
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
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

  /// Upload d'avatar depuis un chemin fichier (Mobile)
  Future<String?> uploadAvatar(String filePath) async {
    try {
      final segments = filePath.split(RegExp(r'[/\\]'));
      final fileName = segments.isNotEmpty && segments.last.isNotEmpty ? segments.last : 'avatar.jpg';
      final formData = dio_lib.FormData.fromMap({
        'file': await dio_lib.MultipartFile.fromFile(filePath, filename: fileName),
      });
      final response = await _apiClient.dio.post('/api/users/me/avatar', data: formData);
      if (response.statusCode == 200 && response.data is Map) {
        return response.data['avatarUrl'] as String?;
      }
    } catch (e) {
      debugPrint("Erreur upload avatar: $e");
    }
    return null;
  }

  /// Upload d'avatar depuis des octets bruts (Compatible Flutter Web + Mobile)
  Future<String?> uploadAvatarBytes(Uint8List bytes, String fileName) async {
    try {
      final safeName = fileName.trim().isEmpty ? 'avatar.jpg' : fileName.trim();
      final formData = dio_lib.FormData.fromMap({
        'file': dio_lib.MultipartFile.fromBytes(bytes, filename: safeName),
      });
      final response = await _apiClient.dio.post('/api/users/me/avatar', data: formData);
      if (response.statusCode == 200 && response.data is Map) {
        return response.data['avatarUrl'] as String?;
      }
    } catch (e) {
      debugPrint("Erreur upload avatar bytes: $e");
    }
    return null;
  }
}

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ApiClient());
});
