import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../../core/api/api_client.dart';

class SenePayService {
  final ApiClient _apiClient = ApiClient();
  
  Future<String?> createCheckoutSession({
    required double amount,
    required String orderId,
    required String description,
    String? customerName,
    String? customerPhone,
    String? providerId,
  }) async {
    try {
      // Test de connexion basique d'abord
      debugPrint(">>> SenePayService: Test de connexion à Google...");
      try {
        await http.get(Uri.parse("https://www.google.com")).timeout(const Duration(seconds: 5));
        debugPrint(">>> SenePayService: Internet OK");
      } catch (e) {
        debugPrint(">>> SenePayService: Pas d'internet ou bloqué: $e");
      }

      final url = Uri.parse("$backendUrl/api/payment/create-session");
      
      final returnUrl = kIsWeb ? "https://transen-pro.web.app/payment/success" : "$backendUrl/payment/success";
      final failUrl = kIsWeb ? "https://transen-pro.web.app/payment/cancel" : "$backendUrl/payment/cancel";

      final bodyMap = {
        "amount": amount.toInt(),
        "currency": "XOF",
        "orderReference": orderId,
        "description": description,
        "successUrl": returnUrl,
        "cancelUrl": failUrl,
        "webhookUrl": "https://api.transen.org/api/payments/webhook/senepay",
        "metadata": {
          "order_id": orderId,
          "platform": kIsWeb ? "web_app" : "mobile_app"
        },
        "expiresInMinutes": 60
      };

      if (providerId != null && providerId.isNotEmpty) {
        bodyMap["providerId"] = providerId;
      }

      debugPrint(">>> SenePayService: Appel /api/payments/create-session");
      
      final response = await _apiClient.dio.post(
        '/api/payments/create-session',
        data: bodyMap,
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['checkoutUrl'] as String?;
      } else {
        throw Exception("Erreur Serveur: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint(">>> SenePayService Error: $e");
      throw Exception("Erreur lors de la création de la session SenePay");
    }
  }

  Future<Map<String, dynamic>?> createPayout({
    required double amount,
    required String recipientPhone,
    required String recipientName,
    required String operator,
    String? description,
  }) async {
    try {
      final bodyMap = {
        "amount": amount,
        "recipientPhone": recipientPhone,
        "recipientName": recipientName,
        "operator": operator,
        "description": description,
      };

      debugPrint(">>> SenePayService: Appel /api/payments/secure-payout");
      
      final response = await _apiClient.dio.post(
        '/api/payments/secure-payout',
        data: bodyMap,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data as Map<String, dynamic>;
      } else {
        throw Exception("Erreur ${response.statusCode}");
      }
    } catch (e) {
      debugPrint(">>> SenePayService Payout Error: $e");
      throw Exception("Erreur lors du retrait SenePay.");
    }
  }

  Future<Map<String, dynamic>?> getPayoutStatus(String internalId) async { return null; }
  Future<Map<String, dynamic>?> checkCheckoutStatus(String orderReference) async { return null; }

  Future<void> recordCommission({
    required double amount,
    required String tripId,
    required String type,
  }) async {
    try {
      await _apiClient.dio.post(
        '/api/stats/record-commission',
        data: {
          "commission": amount,
          "tripId": tripId,
          "type": type,
        },
      );
      
      debugPrint(">>> Stats: Commission de $amount enregistrée via Backend");
    } catch (e) {
      debugPrint(">>> Stats Error: Impossible d'enregistrer la commission ($e)");
    }
  }

  Future<void> processReferralReward(String referredUserId, String tripId) async {
    try {
      await _apiClient.dio.post(
        '/api/admin/award-referral-reward',
        data: {
          "referredUserId": referredUserId,
          "tripId": tripId,
        },
      );
      
      debugPrint(">>> Parrainage: Demande de récompense envoyée au Backend");
    } catch (e) {
      debugPrint(">>> Parrainage Error: $e");
    }
  }
}
