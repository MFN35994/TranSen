import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api_client.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();

  // On garde un getter local (plus utilisé comme Stream Firebase)
  // car l'état sera géré par AuthProvider via SharedPreferences
  
  Future<void> sendOtp(String phoneNumber) async {
    try {
      await _apiClient.dio.post('/api/auth/send-otp', data: {
        'phone': phoneNumber,
      });
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? e.response?.data ?? "Erreur lors de l'envoi du SMS");
      }
      throw Exception("Erreur de connexion au serveur");
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String smsCode, {String? companyAccessCode}) async {
    try {
      final response = await _apiClient.dio.post('/api/auth/verify-otp', data: {
        'phone': phoneNumber,
        'otp': smsCode,
        if (companyAccessCode != null && companyAccessCode.isNotEmpty) 'companyAccessCode': companyAccessCode,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? e.response?.data ?? "Code incorrect ou expiré");
      }
      throw Exception("Erreur de connexion au serveur");
    }
  }

  Future<void> signOut() async {
    // Déconnexion gérée dans le provider (suppression du token local)
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});
