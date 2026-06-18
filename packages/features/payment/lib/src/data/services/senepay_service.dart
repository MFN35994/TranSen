import 'dart:async';
import 'package:flutter/foundation.dart';

import 'package:dio/dio.dart';
import 'package:transen_core/transen_core.dart';

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
      const String apiBase = "https://api.transen.org";
      final returnUrl = kIsWeb ? "https://app.transen.org/payment/success" : "$apiBase/payment/success";
      final failUrl = kIsWeb ? "https://app.transen.org/payment/cancel" : "$apiBase/payment/cancel";

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
          "platform": kIsWeb ? "web_app" : "mobile_app",
          if (customerPhone != null && customerPhone.isNotEmpty) "phone": customerPhone,
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
        final data = response.data;
        if (data is Map) {
          if (data.containsKey('checkoutUrl')) return data['checkoutUrl'] as String?;
          if (data.containsKey('checkout_url')) return data['checkout_url'] as String?;
          if (data.containsKey('paymentUrl')) return data['paymentUrl'] as String?;
          if (data.containsKey('payment_url')) return data['payment_url'] as String?;
          if (data.containsKey('redirectUrl')) return data['redirectUrl'] as String?;
          if (data.containsKey('redirect_url')) return data['redirect_url'] as String?;
          if (data.containsKey('url')) return data['url'] as String?;
          
          if (data.containsKey('token')) {
            return "https://api.sene-pay.com/checkout?session=${data['token']}";
          }
          if (data.containsKey('sessionToken')) {
            return "https://api.sene-pay.com/checkout?session=${data['sessionToken']}";
          }
        }
        return null;
      } else {
        throw Exception("Erreur Serveur: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint(">>> SenePayService Error: $e");
      String errorMsg = "Erreur lors de la création de la session SenePay";
      if (e is DioException && e.response?.data != null) {
        final responseData = e.response!.data;
        if (responseData is Map && responseData.containsKey('error')) {
          errorMsg = responseData['error'].toString();
        } else if (responseData is Map && responseData.containsKey('message')) {
          errorMsg = responseData['message'].toString();
        }
      }
      throw Exception(errorMsg);
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
